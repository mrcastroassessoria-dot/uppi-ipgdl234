-- =====================================================
-- UPPI - Migration Consolidada
-- Cria todas as tabelas necessarias para o app funcionar
-- =====================================================

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- TIPOS ENUMERADOS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('economy', 'comfort', 'premium', 'suv', 'van', 'moto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ride_status AS ENUM (
    'searching', 'pending_offers', 'accepted', 'driver_arrived',
    'in_progress', 'completed', 'cancelled', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ride_type AS ENUM ('individual', 'shared', 'scheduled', 'delivery', 'intercity');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'pix', 'cash', 'wallet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'ride', 'refund', 'bonus', 'cashback', 'referral',
    'subscription', 'withdrawal', 'deposit'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'ride', 'offer', 'message', 'achievement', 'promotion', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- FUNÇÃO UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELAS CORE
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'passenger',
  status user_status NOT NULL DEFAULT 'active',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cpf TEXT UNIQUE,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cnh TEXT UNIQUE NOT NULL,
  cnh_category TEXT NOT NULL,
  cnh_expiry_date DATE NOT NULL,
  cnh_photo_url TEXT,
  selfie_url TEXT,
  background_check_status driver_status NOT NULL DEFAULT 'pending',
  is_online BOOLEAN DEFAULT FALSE,
  current_location GEOGRAPHY(POINT),
  heading DECIMAL(5,2),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 100.0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  renavam TEXT UNIQUE NOT NULL,
  crlv_url TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  seats INTEGER NOT NULL DEFAULT 4,
  has_air_conditioning BOOLEAN DEFAULT TRUE,
  has_trunk BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CORRIDAS
-- =====================================================

CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  pickup_location GEOGRAPHY(POINT) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography
  ) STORED,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10,8) NOT NULL,
  dropoff_lng DECIMAL(11,8) NOT NULL,
  dropoff_location GEOGRAPHY(POINT) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(dropoff_lng, dropoff_lat), 4326)::geography
  ) STORED,
  ride_type ride_type NOT NULL DEFAULT 'individual',
  vehicle_type vehicle_type NOT NULL,
  status ride_status NOT NULL DEFAULT 'searching',
  distance_km DECIMAL(8,2),
  duration_minutes INTEGER,
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  payment_method payment_method,
  payment_status payment_status DEFAULT 'pending',
  stops JSONB DEFAULT '[]'::jsonb,
  route_polyline TEXT,
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  offered_price DECIMAL(10,2) NOT NULL,
  estimated_arrival_minutes INTEGER NOT NULL,
  message TEXT,
  status offer_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ride_id, driver_id)
);

CREATE TABLE IF NOT EXISTS ride_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  location GEOGRAPHY(POINT) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  heading DECIMAL(5,2),
  speed_kmh DECIMAL(5,2),
  accuracy_meters DECIMAL(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FINANCEIRO
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  reference_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount DECIMAL(10,2),
  min_ride_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, ride_id)
);

-- =====================================================
-- GAMIFICAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  total_distance_km DECIMAL(10,2) DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'all_time')),
  rank INTEGER,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period, period_start)
);

-- =====================================================
-- SOCIAL
-- =====================================================

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CORRIDAS COMPARTILHADAS
-- =====================================================

CREATE TABLE IF NOT EXISTS group_rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL UNIQUE REFERENCES rides(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_participants INTEGER NOT NULL DEFAULT 4,
  current_participants INTEGER DEFAULT 1,
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'by_distance', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_ride_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_ride_id UUID NOT NULL REFERENCES group_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10,8) NOT NULL,
  dropoff_lng DECIMAL(11,8) NOT NULL,
  share_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_ride_id, user_id)
);

-- =====================================================
-- EMERGÊNCIA E SEGURANÇA
-- =====================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('sos', 'suspicious', 'accident', 'other')),
  description TEXT,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  location GEOGRAPHY(POINT) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SUPORTE
-- =====================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CONFIGURAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'pt-BR',
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  location_sharing BOOLEAN DEFAULT TRUE,
  show_online_status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'payment_failed')),
  price DECIMAL(10,2) NOT NULL,
  benefits JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MARKETING
-- =====================================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'cashback')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hot_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  center_lat DECIMAL(10,8) NOT NULL,
  center_lng DECIMAL(11,8) NOT NULL,
  center_location GEOGRAPHY(POINT) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
  ) STORED,
  radius_km DECIMAL(6,2) NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.5,
  is_active BOOLEAN DEFAULT TRUE,
  active_from TIMESTAMPTZ,
  active_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SISTEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS address_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  label TEXT,
  use_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, address)
);

CREATE TABLE IF NOT EXISTS favorite_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  type TEXT DEFAULT 'other' CHECK (type IN ('home', 'work', 'other')),
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PUSH SUBSCRIPTIONS (VAPID)
-- =====================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_is_online ON drivers(is_online);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_location ON rides USING GIST(pickup_location);
CREATE INDEX IF NOT EXISTS idx_rides_dropoff_location ON rides USING GIST(dropoff_location);
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride_id ON ride_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_id ON ride_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_status ON ride_offers(status);
CREATE INDEX IF NOT EXISTS idx_ride_tracking_ride_id ON ride_tracking(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_tracking_location ON ride_tracking USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location ON emergency_alerts USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_hot_zones_center_location ON hot_zones USING GIST(center_location);
CREATE INDEX IF NOT EXISTS idx_hot_zones_is_active ON hot_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_address_history_user_id ON address_history(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_places_user_id ON favorite_places(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies basicas: usuario ve/edita apenas os proprios dados
CREATE POLICY "users_own" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "drivers_own" ON drivers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "vehicles_own" ON vehicles FOR ALL USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);
CREATE POLICY "rides_own" ON rides FOR ALL USING (
  auth.uid() = passenger_id OR
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);
CREATE POLICY "ride_offers_own" ON ride_offers FOR ALL USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()) OR
  ride_id IN (SELECT id FROM rides WHERE passenger_id = auth.uid())
);
CREATE POLICY "messages_own" ON messages FOR ALL USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "reviews_own" ON reviews FOR ALL USING (
  auth.uid() = reviewer_id OR auth.uid() = reviewed_id
);
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "wallet_own" ON wallet_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "settings_own" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "push_subs_own" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "address_history_own" ON address_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "favorites_own" ON favorite_places FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "emergency_contacts_own" ON emergency_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "support_tickets_own" ON support_tickets FOR ALL USING (auth.uid() = user_id);

-- Drivers publicamente visiveis (para passageiros encontrarem motoristas online)
CREATE POLICY "drivers_public_read" ON drivers FOR SELECT USING (is_online = TRUE AND background_check_status = 'approved');
