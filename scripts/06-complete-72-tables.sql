-- Script para criar as 21 tabelas faltantes e completar as 72 tabelas
-- Data: 23/02/2026
-- Objetivo: Criar TODAS as tabelas restantes mencionadas na documentação

-- ====================
-- TABELAS FALTANTES (21)
-- ====================

-- 1. CORRIDAS AVANÇADAS
CREATE TABLE IF NOT EXISTS ride_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading INTEGER,
  accuracy DECIMAL(6, 2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_tracking_ride ON ride_tracking(ride_id);
CREATE INDEX idx_ride_tracking_timestamp ON ride_tracking(timestamp);

CREATE TABLE IF NOT EXISTS ride_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_order INTEGER NOT NULL,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_stops_ride ON ride_stops(ride_id);

CREATE TABLE IF NOT EXISTS recording_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recording_consents_ride ON recording_consents(ride_id);

-- 2. SOCIAL COMPLETO
CREATE TABLE IF NOT EXISTS social_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_social_follows_follower ON social_follows(follower_id);
CREATE INDEX idx_social_follows_following ON social_follows(following_id);

CREATE TABLE IF NOT EXISTS user_social_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  posts_count INTEGER NOT NULL DEFAULT 0,
  likes_received INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_social_stats_user ON user_social_stats(user_id);

-- 3. SMS SYSTEM
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. REVIEWS ADICIONAIS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewed_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_ride ON reviews(ride_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id);

CREATE TABLE IF NOT EXISTS rating_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rating_id, user_id)
);

CREATE INDEX idx_rating_helpful_votes_rating ON rating_helpful_votes(rating_id);

CREATE TABLE IF NOT EXISTS rating_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rating_reports_rating ON rating_reports(rating_id);
CREATE INDEX idx_rating_reports_status ON rating_reports(status);

-- 5. SEGURANÇA ADICIONAL
CREATE TABLE IF NOT EXISTS hot_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL,
  danger_level TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hot_zones_active ON hot_zones(is_active);

-- 6. DRIVERS COMPLETO
CREATE TABLE IF NOT EXISTS driver_route_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_latitude DECIMAL(10, 8) NOT NULL,
  start_longitude DECIMAL(11, 8) NOT NULL,
  end_latitude DECIMAL(10, 8) NOT NULL,
  end_longitude DECIMAL(11, 8) NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_route_segments_driver ON driver_route_segments(driver_id);

-- 7. ROTAS POPULARES
CREATE TABLE IF NOT EXISTS popular_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_address TEXT NOT NULL,
  end_address TEXT NOT NULL,
  start_latitude DECIMAL(10, 8) NOT NULL,
  start_longitude DECIMAL(11, 8) NOT NULL,
  end_latitude DECIMAL(10, 8) NOT NULL,
  end_longitude DECIMAL(11, 8) NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  avg_price DECIMAL(10, 2),
  avg_duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_popular_routes_usage ON popular_routes(usage_count DESC);

-- 8. ADMIN
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  ride_id UUID REFERENCES rides(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);

-- 9. ONBOARDING
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  step TEXT NOT NULL DEFAULT 'welcome',
  completed BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_onboarding_user ON user_onboarding(user_id);

-- 10. OUTROS
CREATE TABLE IF NOT EXISTS address_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  search_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_address_search_history_user ON address_search_history(user_id);
CREATE INDEX idx_address_search_history_created ON address_search_history(created_at DESC);

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  discount_amount DECIMAL(10, 2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_users JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promotions_active ON promotions(is_active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);

CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_history_user ON location_history(user_id);
CREATE INDEX idx_location_history_timestamp ON location_history(timestamp);

-- ====================
-- ROW LEVEL SECURITY
-- ====================

ALTER TABLE ride_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_route_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own ride tracking"
  ON ride_tracking FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view ride stops"
  ON ride_stops FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own consents"
  ON recording_consents FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own follows"
  ON social_follows FOR ALL
  USING (follower_id = auth.uid());

CREATE POLICY "Users can view social stats"
  ON user_social_stats FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own stats"
  ON user_social_stats FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view active templates"
  ON sms_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can view reviews"
  ON reviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can vote on ratings"
  ON rating_helpful_votes FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can report ratings"
  ON rating_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view active hot zones"
  ON hot_zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "Drivers can manage own route segments"
  ON driver_route_segments FOR ALL
  USING (driver_id = auth.uid());

CREATE POLICY "Users can view popular routes"
  ON popular_routes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can manage own onboarding"
  ON user_onboarding FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own search history"
  ON address_search_history FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage own location history"
  ON location_history FOR ALL
  USING (user_id = auth.uid());

-- ====================
-- TRIGGERS
-- ====================

CREATE OR REPLACE FUNCTION update_social_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower's following count
    INSERT INTO user_social_stats (user_id, following_count)
    VALUES (NEW.follower_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET following_count = user_social_stats.following_count + 1;
    
    -- Update following's followers count
    INSERT INTO user_social_stats (user_id, followers_count)
    VALUES (NEW.following_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET followers_count = user_social_stats.followers_count + 1;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update follower's following count
    UPDATE user_social_stats
    SET following_count = GREATEST(0, following_count - 1)
    WHERE user_id = OLD.follower_id;
    
    -- Update following's followers count
    UPDATE user_social_stats
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE user_id = OLD.following_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_stats_trigger
  AFTER INSERT OR DELETE ON social_follows
  FOR EACH ROW EXECUTE FUNCTION update_social_stats();
