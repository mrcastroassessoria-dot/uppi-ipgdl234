-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Function to get nearby available drivers
CREATE OR REPLACE FUNCTION get_nearby_drivers(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  rating NUMERIC,
  vehicle_type TEXT,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  distance_meters DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.rating,
    dp.vehicle_type::TEXT,
    dp.vehicle_brand,
    dp.vehicle_model,
    dp.vehicle_color,
    ST_Distance(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(
        (dp.current_location->'coordinates'->>0)::DOUBLE PRECISION,
        (dp.current_location->'coordinates'->>1)::DOUBLE PRECISION
      )::geography
    ) as distance_meters,
    (dp.current_location->'coordinates'->>1)::DOUBLE PRECISION as lat,
    (dp.current_location->'coordinates'->>0)::DOUBLE PRECISION as lng
  FROM driver_profiles dp
  INNER JOIN profiles p ON dp.id = p.id
  WHERE 
    dp.is_available = true
    AND dp.is_verified = true
    AND dp.current_location IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(
        (dp.current_location->'coordinates'->>0)::DOUBLE PRECISION,
        (dp.current_location->'coordinates'->>1)::DOUBLE PRECISION
      )::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT 50;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_drivers TO authenticated;
