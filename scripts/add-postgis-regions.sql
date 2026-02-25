-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column to rides table for pickup location
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS pickup_location geometry(Point, 4326);

-- Add geometry column for dropoff location
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS dropoff_location geometry(Point, 4326);

-- Create spatial index on pickup location for fast queries
CREATE INDEX IF NOT EXISTS rides_pickup_location_idx 
ON rides USING GIST (pickup_location);

-- Create spatial index on dropoff location
CREATE INDEX IF NOT EXISTS rides_dropoff_location_idx 
ON rides USING GIST (dropoff_location);

-- Create function to update geometry from lat/lng
CREATE OR REPLACE FUNCTION update_ride_geometry()
RETURNS TRIGGER AS $$
BEGIN
  -- Update pickup location geometry
  IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL THEN
    NEW.pickup_location := ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326);
  END IF;
  
  -- Update dropoff location geometry
  IF NEW.dropoff_lat IS NOT NULL AND NEW.dropoff_lng IS NOT NULL THEN
    NEW.dropoff_location := ST_SetSRID(ST_MakePoint(NEW.dropoff_lng, NEW.dropoff_lat), 4326);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update geometry columns
DROP TRIGGER IF EXISTS update_ride_geometry_trigger ON rides;
CREATE TRIGGER update_ride_geometry_trigger
BEFORE INSERT OR UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION update_ride_geometry();

-- Populate existing rides with geometry data
UPDATE rides 
SET pickup_location = ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326),
    dropoff_location = ST_SetSRID(ST_MakePoint(dropoff_lng, dropoff_lat), 4326)
WHERE pickup_lat IS NOT NULL 
  AND pickup_lng IS NOT NULL 
  AND dropoff_lat IS NOT NULL 
  AND dropoff_lng IS NOT NULL
  AND pickup_location IS NULL;

-- Create function to find nearby rides within radius (in meters)
CREATE OR REPLACE FUNCTION find_nearby_rides(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000,
  ride_status TEXT DEFAULT 'pending'
)
RETURNS TABLE (
  id UUID,
  pickup_address TEXT,
  dropoff_address TEXT,
  distance_meters DOUBLE PRECISION,
  passenger_price_offer NUMERIC,
  vehicle_type TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.pickup_address,
    r.dropoff_address,
    ST_Distance(
      r.pickup_location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_meters,
    r.passenger_price_offer,
    r.vehicle_type,
    r.created_at
  FROM rides r
  WHERE r.status = ride_status
    AND r.pickup_location IS NOT NULL
    AND ST_DWithin(
      r.pickup_location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if ride is in driver's region
CREATE OR REPLACE FUNCTION is_ride_in_region(
  ride_pickup_lat DOUBLE PRECISION,
  ride_pickup_lng DOUBLE PRECISION,
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  max_distance_km DOUBLE PRECISION DEFAULT 10.0
)
RETURNS BOOLEAN AS $$
DECLARE
  distance_km DOUBLE PRECISION;
BEGIN
  -- Calculate distance in kilometers
  distance_km := ST_Distance(
    ST_SetSRID(ST_MakePoint(ride_pickup_lng, ride_pickup_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(driver_lng, driver_lat), 4326)::geography
  ) / 1000.0;
  
  RETURN distance_km <= max_distance_km;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_nearby_rides TO authenticated;
GRANT EXECUTE ON FUNCTION is_ride_in_region TO authenticated;

-- Create index for faster region queries
CREATE INDEX IF NOT EXISTS rides_status_created_idx 
ON rides (status, created_at DESC)
WHERE status = 'pending';

COMMENT ON FUNCTION find_nearby_rides IS 'Find pending rides within radius from user location';
COMMENT ON FUNCTION is_ride_in_region IS 'Check if ride pickup is within driver operating region';
