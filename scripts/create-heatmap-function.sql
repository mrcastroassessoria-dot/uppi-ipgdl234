-- Function to calculate demand heatmap zones
CREATE OR REPLACE FUNCTION get_demand_heatmap(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  time_window_hours INT DEFAULT 24
)
RETURNS TABLE (
  zone_lat DOUBLE PRECISION,
  zone_lng DOUBLE PRECISION,
  ride_count INT,
  avg_price NUMERIC,
  demand_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH recent_rides AS (
    SELECT
      pickup_lat,
      pickup_lng,
      final_price,
      created_at
    FROM rides
    WHERE 
      pickup_lat IS NOT NULL
      AND pickup_lng IS NOT NULL
      AND status = 'completed'
      AND created_at >= NOW() - (time_window_hours || ' hours')::INTERVAL
      AND ST_DWithin(
        ST_MakePoint(center_lng, center_lat)::geography,
        ST_MakePoint(pickup_lng, pickup_lat)::geography,
        radius_km * 1000
      )
  ),
  grid_cells AS (
    -- Create a grid of ~500m x 500m cells (roughly 0.0045 degrees)
    SELECT
      ROUND((pickup_lat / 0.0045)::NUMERIC, 0) * 0.0045 as cell_lat,
      ROUND((pickup_lng / 0.0045)::NUMERIC, 0) * 0.0045 as cell_lng,
      COUNT(*)::INT as ride_count,
      AVG(final_price) as avg_price
    FROM recent_rides
    GROUP BY cell_lat, cell_lng
    HAVING COUNT(*) >= 2  -- At least 2 rides to be considered
  )
  SELECT
    cell_lat::DOUBLE PRECISION as zone_lat,
    cell_lng::DOUBLE PRECISION as zone_lng,
    ride_count,
    COALESCE(avg_price, 0)::NUMERIC as avg_price,
    (ride_count::NUMERIC * 10 + COALESCE(avg_price, 0)) as demand_score
  FROM grid_cells
  ORDER BY demand_score DESC
  LIMIT 50;
END;
$$;

-- Function to get hot zones for drivers
CREATE OR REPLACE FUNCTION get_hot_zones_for_drivers(
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5
)
RETURNS TABLE (
  zone_name TEXT,
  zone_lat DOUBLE PRECISION,
  zone_lng DOUBLE PRECISION,
  recent_rides INT,
  avg_price NUMERIC,
  distance_km NUMERIC,
  recommendation_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH heatmap AS (
    SELECT * FROM get_demand_heatmap(driver_lat, driver_lng, radius_km, 3)
  ),
  scored_zones AS (
    SELECT
      'Zona Quente' as zone_name,
      h.zone_lat,
      h.zone_lng,
      h.ride_count as recent_rides,
      h.avg_price,
      ST_Distance(
        ST_MakePoint(driver_lng, driver_lat)::geography,
        ST_MakePoint(h.zone_lng, h.zone_lat)::geography
      ) / 1000.0 as distance_km,
      -- Score: high demand, good price, close distance = high score
      (h.demand_score * 10 / GREATEST(ST_Distance(
        ST_MakePoint(driver_lng, driver_lat)::geography,
        ST_MakePoint(h.zone_lng, h.zone_lat)::geography
      ) / 1000.0, 0.5)) as recommendation_score
    FROM heatmap h
  )
  SELECT
    zone_name::TEXT,
    zone_lat::DOUBLE PRECISION,
    zone_lng::DOUBLE PRECISION,
    recent_rides::INT,
    avg_price::NUMERIC,
    distance_km::NUMERIC,
    recommendation_score::NUMERIC
  FROM scored_zones
  ORDER BY recommendation_score DESC
  LIMIT 10;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_demand_heatmap TO authenticated;
GRANT EXECUTE ON FUNCTION get_hot_zones_for_drivers TO authenticated;
