-- ============================================================
-- UPPI - Fase 6: PostGIS functions + analytics + leaderboard + driver verification
-- ============================================================

-- ============================================================
-- PostGIS: Nearby drivers
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_nearby_drivers(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  rating DECIMAL,
  vehicle_type vehicle_type,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_plate TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.id,
    p.full_name,
    p.avatar_url,
    p.rating,
    dp.vehicle_type,
    dp.vehicle_brand,
    dp.vehicle_model,
    dp.vehicle_color,
    dp.vehicle_plate,
    ST_Y(dp.current_location::geometry) as lat,
    ST_X(dp.current_location::geometry) as lng,
    ST_Distance(
      dp.current_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) as distance_meters
  FROM public.driver_profiles dp
  JOIN public.profiles p ON p.id = dp.id
  WHERE dp.is_available = true
    AND dp.is_verified = true
    AND dp.current_location IS NOT NULL
    AND ST_DWithin(
      dp.current_location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$;

-- ============================================================
-- PostGIS: Demand heatmap
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_demand_heatmap(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  grid_lat DOUBLE PRECISION,
  grid_lng DOUBLE PRECISION,
  ride_count BIGINT,
  avg_price DECIMAL,
  zone_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(r.pickup_lat::numeric / 0.005) * 0.005 as grid_lat,
    ROUND(r.pickup_lng::numeric / 0.005) * 0.005 as grid_lng,
    COUNT(*) as ride_count,
    AVG(r.final_price) as avg_price,
    CASE
      WHEN COUNT(*) > 10 THEN 'hot'
      WHEN COUNT(*) > 5 THEN 'warm'
      ELSE 'cold'
    END as zone_status
  FROM public.rides r
  WHERE r.status IN ('completed', 'in_progress')
    AND r.created_at > NOW() - INTERVAL '24 hours'
    AND r.pickup_lat IS NOT NULL
    AND r.pickup_lng IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(r.pickup_lng::double precision, r.pickup_lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_km * 1000
    )
  GROUP BY grid_lat, grid_lng;
END;
$$;

-- ============================================================
-- PostGIS: Driver suggestions (hot zones)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_driver_suggestions(driver_uuid UUID)
RETURNS TABLE (
  zone_lat DOUBLE PRECISION,
  zone_lng DOUBLE PRECISION,
  demand_score BIGINT,
  avg_earnings DECIMAL,
  estimated_wait_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  driver_location GEOGRAPHY;
BEGIN
  SELECT current_location INTO driver_location
  FROM public.driver_profiles WHERE id = driver_uuid;

  IF driver_location IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ROUND(r.pickup_lat::numeric / 0.005) * 0.005 as zone_lat,
    ROUND(r.pickup_lng::numeric / 0.005) * 0.005 as zone_lng,
    COUNT(*) as demand_score,
    AVG(r.final_price) as avg_earnings,
    5 as estimated_wait_minutes
  FROM public.rides r
  WHERE r.status IN ('completed', 'in_progress')
    AND r.created_at > NOW() - INTERVAL '2 hours'
    AND r.pickup_lat IS NOT NULL
    AND r.pickup_lng IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(r.pickup_lng::double precision, r.pickup_lat::double precision), 4326)::geography,
      driver_location,
      5000
    )
  GROUP BY zone_lat, zone_lng
  ORDER BY demand_score DESC
  LIMIT 5;
END;
$$;

-- ============================================================
-- Leaderboard
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  category TEXT DEFAULT 'rides',
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  score DECIMAL,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF category = 'rides' THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.avatar_url, p.total_rides::DECIMAL as score,
           ROW_NUMBER() OVER (ORDER BY p.total_rides DESC) as rank
    FROM public.profiles p
    WHERE p.total_rides > 0
    ORDER BY p.total_rides DESC
    LIMIT limit_count;
  ELSIF category = 'savings' THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.avatar_url,
           COALESCE(SUM(r.passenger_price_offer - r.final_price), 0) as score,
           ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(r.passenger_price_offer - r.final_price), 0) DESC) as rank
    FROM public.profiles p
    LEFT JOIN public.rides r ON r.passenger_id = p.id AND r.status = 'completed' AND r.final_price < r.passenger_price_offer
    GROUP BY p.id, p.full_name, p.avatar_url
    HAVING COALESCE(SUM(r.passenger_price_offer - r.final_price), 0) > 0
    ORDER BY score DESC
    LIMIT limit_count;
  ELSIF category = 'rating' THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.avatar_url, p.rating as score,
           ROW_NUMBER() OVER (ORDER BY p.rating DESC, p.total_rides DESC) as rank
    FROM public.profiles p
    WHERE p.total_rides >= 5
    ORDER BY p.rating DESC, p.total_rides DESC
    LIMIT limit_count;
  ELSIF category = 'achievements' THEN
    RETURN QUERY
    SELECT p.id, p.full_name, p.avatar_url,
           COUNT(ua.id)::DECIMAL as score,
           ROW_NUMBER() OVER (ORDER BY COUNT(ua.id) DESC) as rank
    FROM public.profiles p
    LEFT JOIN public.user_achievements ua ON ua.user_id = p.id
    GROUP BY p.id, p.full_name, p.avatar_url
    HAVING COUNT(ua.id) > 0
    ORDER BY score DESC
    LIMIT limit_count;
  END IF;
END;
$$;

-- ============================================================
-- Admin Analytics (5 functions)
-- ============================================================

-- 1. Dashboard stats
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_drivers', (SELECT COUNT(*) FROM public.driver_profiles),
    'verified_drivers', (SELECT COUNT(*) FROM public.driver_profiles WHERE is_verified = true),
    'active_drivers', (SELECT COUNT(*) FROM public.driver_profiles WHERE is_available = true),
    'total_rides', (SELECT COUNT(*) FROM public.rides),
    'completed_rides', (SELECT COUNT(*) FROM public.rides WHERE status = 'completed'),
    'active_rides', (SELECT COUNT(*) FROM public.rides WHERE status IN ('pending', 'negotiating', 'accepted', 'in_progress')),
    'total_revenue', (SELECT COALESCE(SUM(final_price), 0) FROM public.rides WHERE status = 'completed'),
    'today_rides', (SELECT COUNT(*) FROM public.rides WHERE created_at::date = CURRENT_DATE),
    'today_revenue', (SELECT COALESCE(SUM(final_price), 0) FROM public.rides WHERE status = 'completed' AND created_at::date = CURRENT_DATE)
  ) INTO result;
  RETURN result;
END;
$$;

-- 2. Revenue analytics
CREATE OR REPLACE FUNCTION public.get_revenue_analytics(days INTEGER DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_agg(daily) INTO result FROM (
    SELECT
      created_at::date as date,
      COUNT(*) as rides,
      COALESCE(SUM(final_price), 0) as revenue,
      COALESCE(AVG(final_price), 0) as avg_price
    FROM public.rides
    WHERE status = 'completed'
      AND created_at > NOW() - (days || ' days')::interval
    GROUP BY created_at::date
    ORDER BY date DESC
  ) daily;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 3. Ride analytics
CREATE OR REPLACE FUNCTION public.get_ride_analytics(days INTEGER DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'by_status', (
      SELECT json_agg(s) FROM (
        SELECT status, COUNT(*) as count
        FROM public.rides WHERE created_at > NOW() - (days || ' days')::interval
        GROUP BY status
      ) s
    ),
    'by_vehicle', (
      SELECT json_agg(v) FROM (
        SELECT vehicle_type, COUNT(*) as count
        FROM public.rides WHERE created_at > NOW() - (days || ' days')::interval
        GROUP BY vehicle_type
      ) v
    ),
    'by_payment', (
      SELECT json_agg(p) FROM (
        SELECT payment_method, COUNT(*) as count
        FROM public.rides WHERE status = 'completed' AND created_at > NOW() - (days || ' days')::interval
        GROUP BY payment_method
      ) p
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- 4. User growth
CREATE OR REPLACE FUNCTION public.get_user_growth_analytics(days INTEGER DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_agg(daily) INTO result FROM (
    SELECT
      created_at::date as date,
      COUNT(*) as new_users,
      COUNT(*) FILTER (WHERE user_type IN ('driver', 'both')) as new_drivers
    FROM public.profiles
    WHERE created_at > NOW() - (days || ' days')::interval
    GROUP BY created_at::date
    ORDER BY date DESC
  ) daily;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 5. Driver performance
CREATE OR REPLACE FUNCTION public.get_driver_performance(days INTEGER DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_agg(driver) INTO result FROM (
    SELECT
      p.id, p.full_name, p.rating,
      COUNT(r.id) as total_rides,
      COALESCE(SUM(r.final_price), 0) as total_earnings,
      COALESCE(AVG(r.final_price), 0) as avg_earnings
    FROM public.profiles p
    JOIN public.rides r ON r.driver_id = p.id AND r.status = 'completed'
    WHERE r.created_at > NOW() - (days || ' days')::interval
    GROUP BY p.id, p.full_name, p.rating
    ORDER BY total_earnings DESC
    LIMIT 50
  ) driver;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ============================================================
-- Driver verification
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_driver(driver_uuid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.driver_profiles SET is_verified = true WHERE id = driver_uuid;
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (driver_uuid, 'Conta Verificada', 'Sua conta de motorista foi verificada com sucesso!', 'driver_verified');
END;
$$;
