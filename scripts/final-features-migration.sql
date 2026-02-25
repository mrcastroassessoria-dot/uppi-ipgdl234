-- =============================================
-- UPPI FINAL FEATURES MIGRATION
-- Verificacao Facial, Avaliacao Bidirecional,
-- Onboarding, Gestos iOS
-- =============================================

-- 1. Driver Facial Verification
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS last_verification_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_photo_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0;

-- Facial verification logs
CREATE TABLE IF NOT EXISTS driver_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  confidence_score NUMERIC(5,4),
  device_info JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE driver_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers_view_own_verifications" ON driver_verifications
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "drivers_insert_own_verifications" ON driver_verifications
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Function to check if driver needs verification
CREATE OR REPLACE FUNCTION needs_facial_verification(p_driver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_verification TIMESTAMPTZ;
  v_requires BOOLEAN;
BEGIN
  SELECT last_verification_at, requires_verification
  INTO v_last_verification, v_requires
  FROM driver_profiles
  WHERE id = p_driver_id;

  IF v_requires IS TRUE AND (v_last_verification IS NULL OR v_last_verification < NOW() - INTERVAL '24 hours') THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

-- 2. Enhanced Bidirectional Rating System
CREATE TABLE IF NOT EXISTS rating_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_icon TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('driver', 'passenger')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rating_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_read_categories" ON rating_categories FOR SELECT USING (true);

-- Seed rating categories
INSERT INTO rating_categories (category_key, category_name, category_icon, user_type, display_order) VALUES
  ('driving', 'Direcao', NULL, 'driver', 1),
  ('cleanliness', 'Limpeza', NULL, 'driver', 2),
  ('punctuality', 'Pontualidade', NULL, 'driver', 3),
  ('communication', 'Comunicacao', NULL, 'driver', 4),
  ('route', 'Trajeto', NULL, 'driver', 5),
  ('respect', 'Respeito', NULL, 'passenger', 1),
  ('punctuality_p', 'Pontualidade', NULL, 'passenger', 2),
  ('communication_p', 'Comunicacao', NULL, 'passenger', 3),
  ('behavior', 'Comportamento', NULL, 'passenger', 4)
ON CONFLICT DO NOTHING;

-- Add fields to ratings table
ALTER TABLE ratings
ADD COLUMN IF NOT EXISTS category_ratings JSONB,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_text TEXT,
ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_reason TEXT;

-- Rating response function
CREATE OR REPLACE FUNCTION respond_to_rating(
  p_rating_id UUID,
  p_response TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ratings
  SET response_text = p_response,
      response_at = NOW()
  WHERE id = p_rating_id
    AND reviewed_id = auth.uid()
    AND response_text IS NULL;
END;
$$;

-- Average rating by category
CREATE OR REPLACE FUNCTION get_category_ratings(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_object_agg(
    cat_key,
    jsonb_build_object('avg', ROUND(cat_avg::numeric, 1), 'count', cat_count)
  )
  INTO v_result
  FROM (
    SELECT 
      key AS cat_key,
      AVG(value::text::numeric) AS cat_avg,
      COUNT(*) AS cat_count
    FROM ratings r,
    LATERAL jsonb_each(r.category_ratings)
    WHERE r.reviewed_id = p_user_id
      AND r.category_ratings IS NOT NULL
    GROUP BY key
  ) sub;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- 3. Onboarding tracking
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  skipped BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_onboarding" ON user_onboarding
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. User gesture/UX preferences
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"haptic": true, "animations": true, "dark_mode": "auto", "language": "pt-BR"}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_driver_verifications_driver ON driver_verifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_created ON driver_verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_category ON ratings(reviewed_id) WHERE category_ratings IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user ON user_onboarding(user_id);
