-- Analytics Functions for Admin Dashboard
-- Comprehensive metrics, KPIs, cohorts, retention, and revenue analysis

-- 1. Real-time Platform Metrics
CREATE OR REPLACE FUNCTION get_platform_metrics(time_range interval DEFAULT '24 hours'::interval)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_rides', COUNT(DISTINCT r.id),
    'active_riders', COUNT(DISTINCT r.passenger_id),
    'active_drivers', COUNT(DISTINCT r.driver_id),
    'total_revenue', COALESCE(SUM(r.final_price), 0),
    'avg_ride_price', COALESCE(AVG(r.final_price), 0),
    'completed_rides', COUNT(*) FILTER (WHERE r.status = 'completed'),
    'cancelled_rides', COUNT(*) FILTER (WHERE r.status = 'cancelled'),
    'completion_rate', ROUND(
      COUNT(*) FILTER (WHERE r.status = 'completed')::numeric / 
      NULLIF(COUNT(*)::numeric, 0) * 100, 
      2
    ),
    'avg_rating', COALESCE(AVG(rt.rating), 0)
  ) INTO result
  FROM rides r
  LEFT JOIN ratings rt ON rt.ride_id = r.id
  WHERE r.created_at >= NOW() - time_range;

  RETURN result;
END;
$$;

-- 2. Revenue Analytics with Breakdown
CREATE OR REPLACE FUNCTION get_revenue_analytics(
  start_date timestamp DEFAULT NOW() - interval '30 days',
  end_date timestamp DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(r.final_price), 0),
    'avg_revenue_per_ride', COALESCE(AVG(r.final_price), 0),
    'revenue_by_vehicle_type', (
      SELECT json_object_agg(vehicle_type, total)
      FROM (
        SELECT vehicle_type, SUM(final_price) as total
        FROM rides
        WHERE created_at BETWEEN start_date AND end_date
        AND status = 'completed'
        GROUP BY vehicle_type
      ) v
    ),
    'revenue_by_hour', (
      SELECT json_object_agg(hour, total)
      FROM (
        SELECT EXTRACT(HOUR FROM created_at)::int as hour, SUM(final_price) as total
        FROM rides
        WHERE created_at BETWEEN start_date AND end_date
        AND status = 'completed'
        GROUP BY hour
        ORDER BY hour
      ) h
    ),
    'revenue_by_day', (
      SELECT json_agg(json_build_object('date', date, 'revenue', total))
      FROM (
        SELECT DATE(created_at) as date, SUM(final_price) as total
        FROM rides
        WHERE created_at BETWEEN start_date AND end_date
        AND status = 'completed'
        GROUP BY date
        ORDER BY date DESC
      ) d
    )
  ) INTO result
  FROM rides r
  WHERE r.created_at BETWEEN start_date AND end_date
  AND r.status = 'completed';

  RETURN result;
END;
$$;

-- 3. User Cohort Analysis
CREATE OR REPLACE FUNCTION get_cohort_analysis()
RETURNS TABLE (
  cohort_month text,
  users_count bigint,
  month_0 numeric,
  month_1 numeric,
  month_2 numeric,
  month_3 numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT 
      p.id as user_id,
      DATE_TRUNC('month', p.created_at) as cohort_month
    FROM profiles p
  ),
  ride_months AS (
    SELECT 
      r.passenger_id,
      DATE_TRUNC('month', r.created_at) as ride_month
    FROM rides r
  )
  SELECT
    TO_CHAR(c.cohort_month, 'YYYY-MM') as cohort_month,
    COUNT(DISTINCT c.user_id) as users_count,
    ROUND(COUNT(DISTINCT CASE WHEN rm.ride_month = c.cohort_month THEN c.user_id END)::numeric / 
      NULLIF(COUNT(DISTINCT c.user_id)::numeric, 0) * 100, 1) as month_0,
    ROUND(COUNT(DISTINCT CASE WHEN rm.ride_month = c.cohort_month + interval '1 month' THEN c.user_id END)::numeric / 
      NULLIF(COUNT(DISTINCT c.user_id)::numeric, 0) * 100, 1) as month_1,
    ROUND(COUNT(DISTINCT CASE WHEN rm.ride_month = c.cohort_month + interval '2 months' THEN c.user_id END)::numeric / 
      NULLIF(COUNT(DISTINCT c.user_id)::numeric, 0) * 100, 1) as month_2,
    ROUND(COUNT(DISTINCT CASE WHEN rm.ride_month = c.cohort_month + interval '3 months' THEN c.user_id END)::numeric / 
      NULLIF(COUNT(DISTINCT c.user_id)::numeric, 0) * 100, 1) as month_3
  FROM cohorts c
  LEFT JOIN ride_months rm ON c.user_id = rm.passenger_id
  GROUP BY c.cohort_month
  ORDER BY c.cohort_month DESC
  LIMIT 12;
END;
$$;

-- 4. Driver Performance Metrics
CREATE OR REPLACE FUNCTION get_driver_performance(days int DEFAULT 30)
RETURNS TABLE (
  driver_id uuid,
  driver_name text,
  total_rides bigint,
  completed_rides bigint,
  cancelled_rides bigint,
  completion_rate numeric,
  avg_rating numeric,
  total_earnings numeric,
  avg_earnings_per_ride numeric,
  online_hours numeric,
  rides_per_hour numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.id,
    p.full_name,
    COUNT(r.id) as total_rides,
    COUNT(*) FILTER (WHERE r.status = 'completed') as completed_rides,
    COUNT(*) FILTER (WHERE r.status = 'cancelled') as cancelled_rides,
    ROUND(COUNT(*) FILTER (WHERE r.status = 'completed')::numeric / 
      NULLIF(COUNT(*)::numeric, 0) * 100, 1) as completion_rate,
    COALESCE(AVG(rt.rating), 0) as avg_rating,
    COALESCE(SUM(r.final_price), 0) as total_earnings,
    COALESCE(AVG(r.final_price), 0) as avg_earnings_per_ride,
    COALESCE(SUM(EXTRACT(EPOCH FROM (r.completed_at - r.accepted_at)) / 3600), 0) as online_hours,
    CASE 
      WHEN SUM(EXTRACT(EPOCH FROM (r.completed_at - r.accepted_at)) / 3600) > 0 
      THEN COUNT(*) FILTER (WHERE r.status = 'completed') / 
           SUM(EXTRACT(EPOCH FROM (r.completed_at - r.accepted_at)) / 3600)
      ELSE 0 
    END as rides_per_hour
  FROM driver_profiles dp
  JOIN profiles p ON p.id = dp.id
  LEFT JOIN rides r ON r.driver_id = dp.id AND r.created_at >= NOW() - (days || ' days')::interval
  LEFT JOIN ratings rt ON rt.ride_id = r.id
  GROUP BY dp.id, p.full_name
  HAVING COUNT(r.id) > 0
  ORDER BY total_rides DESC
  LIMIT 50;
END;
$$;

-- 5. Growth Metrics
CREATE OR REPLACE FUNCTION get_growth_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'new_users_today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
    'new_users_this_week', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)),
    'new_users_this_month', COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)),
    'total_users', COUNT(*),
    'active_users_today', (
      SELECT COUNT(DISTINCT passenger_id) 
      FROM rides 
      WHERE created_at >= CURRENT_DATE
    ),
    'daily_active_users', (
      SELECT json_agg(json_build_object('date', date, 'count', count))
      FROM (
        SELECT DATE(created_at) as date, COUNT(DISTINCT passenger_id) as count
        FROM rides
        WHERE created_at >= CURRENT_DATE - interval '30 days'
        GROUP BY date
        ORDER BY date DESC
      ) d
    )
  ) INTO result
  FROM profiles;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (admin only in RLS)
GRANT EXECUTE ON FUNCTION get_platform_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_cohort_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_driver_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_growth_metrics TO authenticated;
