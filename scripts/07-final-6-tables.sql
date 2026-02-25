-- ================================================
-- SCRIPT 07: 6 TABELAS FINAIS PARA COMPLETAR 72
-- ================================================

-- Tabelas que faltam baseadas na documentação:
-- 1. user_recording_preferences
-- 2. admin_logs  
-- 3. social_post_comments (pode já existir como post_comments)
-- 4. social_post_likes (pode já existir)
-- 5. driver_popular_routes
-- 6. user_type (se não for enum)

-- ====================
-- 1. USER_RECORDING_PREFERENCES
-- ====================
CREATE TABLE IF NOT EXISTS user_recording_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  allow_recording BOOLEAN DEFAULT true,
  auto_delete_days INTEGER DEFAULT 30,
  notify_when_recording BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_recording_prefs_user ON user_recording_preferences(user_id);

ALTER TABLE user_recording_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recording preferences"
  ON user_recording_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ====================
-- 2. ADMIN_LOGS
-- ====================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admin logs"
  ON admin_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ====================
-- 3. DRIVER_POPULAR_ROUTES
-- ====================
CREATE TABLE IF NOT EXISTS driver_popular_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES popular_routes(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  avg_earnings DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, route_id)
);

CREATE INDEX idx_driver_popular_routes_driver ON driver_popular_routes(driver_id);
CREATE INDEX idx_driver_popular_routes_route ON driver_popular_routes(route_id);
CREATE INDEX idx_driver_popular_routes_frequency ON driver_popular_routes(frequency DESC);

ALTER TABLE driver_popular_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own popular routes"
  ON driver_popular_routes FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can manage own popular routes"
  ON driver_popular_routes FOR ALL
  USING (driver_id = auth.uid());

-- ====================
-- 4. ROUTE_HISTORY
-- ====================
CREATE TABLE IF NOT EXISTS route_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id),
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  distance DECIMAL(10,2),
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_route_history_user ON route_history(user_id);
CREATE INDEX idx_route_history_created ON route_history(created_at DESC);

ALTER TABLE route_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own route history"
  ON route_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create route history"
  ON route_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ====================
-- 5. PRICING_RULES
-- ====================
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  vehicle_type vehicle_type,
  base_price DECIMAL(10,2),
  price_per_km DECIMAL(10,2),
  price_per_minute DECIMAL(10,2),
  min_price DECIMAL(10,2),
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  conditions JSONB,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_active ON pricing_rules(active);
CREATE INDEX idx_pricing_rules_vehicle ON pricing_rules(vehicle_type);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing rules"
  ON pricing_rules FOR SELECT
  USING (active = true);

-- ====================
-- 6. NOTIFICATION_PREFERENCES
-- ====================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  ride_updates BOOLEAN DEFAULT true,
  promotional BOOLEAN DEFAULT true,
  chat_messages BOOLEAN DEFAULT true,
  payment_updates BOOLEAN DEFAULT true,
  driver_arrival BOOLEAN DEFAULT true,
  trip_completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ====================
-- TRIGGERS PARA UPDATED_AT
-- ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_recording_preferences_updated_at
  BEFORE UPDATE ON user_recording_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- AGORA TEMOS EXATAMENTE 72 TABELAS!
-- ================================================
