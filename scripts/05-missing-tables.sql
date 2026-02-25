-- ============================================
-- SCRIPT 05: TABELAS FALTANTES CRÍTICAS
-- ============================================
-- Cria tabelas que o código está usando mas que não existem no banco
-- Data: 23/02/2026

-- ============================================
-- 1. DRIVER LOCATIONS (rastreamento em tempo real)
-- ============================================
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  location geography(Point, 4326),
  is_available BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_available ON driver_locations(is_available);
CREATE INDEX IF NOT EXISTS idx_driver_locations_location ON driver_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated ON driver_locations(last_updated DESC);

-- RLS
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can update own location"
  ON driver_locations FOR UPDATE
  USING (auth.uid() = driver_id);

CREATE POLICY "Everyone can view available drivers"
  ON driver_locations FOR SELECT
  USING (is_available = true);

-- ============================================
-- 2. WEBHOOKS (integração com sistemas externos)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_code INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- RLS
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage webhooks"
  ON webhook_endpoints FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view deliveries"
  ON webhook_deliveries FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. SMS (envio e rastreamento de SMS)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sms_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  ride_updates BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES sms_deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_deliveries_user_id ON sms_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_deliveries_status ON sms_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_sms_deliveries_created ON sms_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_delivery_id ON sms_logs(delivery_id);

-- RLS
ALTER TABLE user_sms_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SMS preferences"
  ON user_sms_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS preferences"
  ON user_sms_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own SMS deliveries"
  ON sms_deliveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view SMS logs"
  ON sms_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 4. DRIVER VERIFICATIONS (verificação de motoristas)
-- ============================================
CREATE TABLE IF NOT EXISTS driver_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  notes TEXT,
  documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_verifications_driver_id ON driver_verifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_status ON driver_verifications(status);

-- RLS
ALTER TABLE driver_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own verifications"
  ON driver_verifications FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Authenticated users can manage verifications"
  ON driver_verifications FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 5. USER COUPONS (cupons de usuário)
-- ============================================
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  ride_id UUID REFERENCES rides(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_used ON user_coupons(used);

-- RLS
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupons"
  ON user_coupons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can use own coupons"
  ON user_coupons FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. POST COMMENTS (comentários em posts sociais)
-- ============================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(created_at DESC);

-- RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view comments"
  ON post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. AVATARS (upload de avatares) - Storage reference
-- ============================================
CREATE TABLE IF NOT EXISTS avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);

-- RLS
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all avatars"
  ON avatars FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own avatar"
  ON avatars FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_driver_locations_updated_at BEFORE UPDATE ON driver_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sms_preferences_updated_at BEFORE UPDATE ON user_sms_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_verifications_updated_at BEFORE UPDATE ON driver_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatars_updated_at BEFORE UPDATE ON avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
