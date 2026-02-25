-- Function to calculate user leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
  limit_count INT DEFAULT 100,
  category TEXT DEFAULT 'total_rides'
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_rides INT,
  rating NUMERIC,
  total_savings NUMERIC,
  achievements_count INT,
  rank INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF category = 'total_rides' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.avatar_url,
      p.total_rides,
      p.rating,
      COALESCE(SUM(
        CASE
          WHEN r.passenger_price_offer IS NOT NULL AND r.final_price IS NOT NULL
          THEN r.passenger_price_offer - r.final_price
          ELSE 0
        END
      ), 0) as total_savings,
      COALESCE((
        SELECT COUNT(*)::INT
        FROM user_achievements ua
        WHERE ua.user_id = p.id
      ), 0) as achievements_count,
      ROW_NUMBER() OVER (ORDER BY p.total_rides DESC, p.rating DESC)::INT as rank
    FROM profiles p
    LEFT JOIN rides r ON (r.passenger_id = p.id AND r.status = 'completed')
    WHERE p.user_type IN ('passenger', 'both')
    GROUP BY p.id, p.full_name, p.avatar_url, p.total_rides, p.rating
    ORDER BY p.total_rides DESC, p.rating DESC
    LIMIT limit_count;

  ELSIF category = 'savings' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.avatar_url,
      p.total_rides,
      p.rating,
      COALESCE(SUM(
        CASE
          WHEN r.passenger_price_offer IS NOT NULL AND r.final_price IS NOT NULL
          THEN r.passenger_price_offer - r.final_price
          ELSE 0
        END
      ), 0) as total_savings,
      COALESCE((
        SELECT COUNT(*)::INT
        FROM user_achievements ua
        WHERE ua.user_id = p.id
      ), 0) as achievements_count,
      ROW_NUMBER() OVER (
        ORDER BY SUM(
          CASE
            WHEN r.passenger_price_offer IS NOT NULL AND r.final_price IS NOT NULL
            THEN r.passenger_price_offer - r.final_price
            ELSE 0
          END
        ) DESC
      )::INT as rank
    FROM profiles p
    LEFT JOIN rides r ON (r.passenger_id = p.id AND r.status = 'completed')
    WHERE p.user_type IN ('passenger', 'both')
    GROUP BY p.id, p.full_name, p.avatar_url, p.total_rides, p.rating
    HAVING SUM(
      CASE
        WHEN r.passenger_price_offer IS NOT NULL AND r.final_price IS NOT NULL
        THEN r.passenger_price_offer - r.final_price
        ELSE 0
      END
    ) > 0
    ORDER BY total_savings DESC
    LIMIT limit_count;

  ELSIF category = 'rating' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.avatar_url,
      p.total_rides,
      p.rating,
      COALESCE(SUM(
        CASE
          WHEN r.passenger_price_offer IS NOT NULL AND r.final_price IS NOT NULL
          THEN r.passenger_price_offer - r.final_price
          ELSE 0
        END
      ), 0) as total_savings,
      COALESCE((
        SELECT COUNT(*)::INT
        FROM user_achievements ua
        WHERE ua.user_id = p.id
      ), 0) as achievements_count,
      ROW_NUMBER() OVER (ORDER BY p.rating DESC, p.total_rides DESC)::INT as rank
    FROM profiles p
    LEFT JOIN rides r ON (r.passenger_id = p.id AND r.status = 'completed')
    WHERE p.user_type IN ('passenger', 'both') AND p.total_rides >= 5
    GROUP BY p.id, p.full_name, p.avatar_url, p.total_rides, p.rating
    ORDER BY p.rating DESC, p.total_rides DESC
    LIMIT limit_count;

  ELSE
    -- achievements category
    RETURN QUERY
    SELECT
      p.id,
      p.full_name,
      p.avatar_url,
      p.total_rides,
      p.rating,
      COALESCE(SUM(
        CASE
          WHEN r.passenger_price_offer IS NOT NULL AND r.final_price IS NOT NULL
          THEN r.passenger_price_offer - r.final_price
          ELSE 0
        END
      ), 0) as total_savings,
      COALESCE((
        SELECT COUNT(*)::INT
        FROM user_achievements ua
        WHERE ua.user_id = p.id
      ), 0) as achievements_count,
      ROW_NUMBER() OVER (
        ORDER BY (
          SELECT COUNT(*)
          FROM user_achievements ua
          WHERE ua.user_id = p.id
        ) DESC, p.total_rides DESC
      )::INT as rank
    FROM profiles p
    LEFT JOIN rides r ON (r.passenger_id = p.id AND r.status = 'completed')
    WHERE p.user_type IN ('passenger', 'both')
    GROUP BY p.id, p.full_name, p.avatar_url, p.total_rides, p.rating
    HAVING (
      SELECT COUNT(*)
      FROM user_achievements ua
      WHERE ua.user_id = p.id
    ) > 0
    ORDER BY achievements_count DESC, p.total_rides DESC
    LIMIT limit_count;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_leaderboard TO authenticated;
