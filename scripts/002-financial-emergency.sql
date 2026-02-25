-- ============================================================
-- UPPI - Fase 2: Financial tables + subscriptions + emergency
-- ============================================================

-- ============================================================
-- Table 9: user_wallets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_select_own" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert_own" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update_own" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table 10: wallet_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  ride_id UUID,
  reference_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);

-- Auto-update wallet balance on transaction
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.type IN ('credit', 'refund', 'cashback', 'bonus') THEN
    UPDATE public.user_wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
  ELSIF NEW.type IN ('debit', 'withdrawal', 'transfer') THEN
    UPDATE public.user_wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wallet_transaction ON public.wallet_transactions;
CREATE TRIGGER on_wallet_transaction
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- Auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION public.auto_create_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_create_wallet ON public.profiles;
CREATE TRIGGER on_profile_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_wallet();

-- ============================================================
-- Table 11: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.profiles(id),
  payee_id UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE INDEX IF NOT EXISTS idx_payments_ride ON public.payments(ride_id);

-- ============================================================
-- Table 12: coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_ride_value DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_select_active" ON public.coupons
  FOR SELECT USING (is_active = true);

-- ============================================================
-- Table 13: coupon_usage
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  ride_id UUID REFERENCES public.rides(id),
  discount_applied DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_usage_select_own" ON public.coupon_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coupon_usage_insert_own" ON public.coupon_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Table 37: subscriptions (Club Uppi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT CHECK (plan IN ('basic', 'premium', 'vip')) NOT NULL,
  status TEXT DEFAULT 'active',
  price DECIMAL(10,2),
  discount_percentage INTEGER,
  cashback_percentage INTEGER,
  priority_support BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Tables 19-21: Emergency tables
-- ============================================================

-- Table 19: emergency_contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergency_contacts_select_own" ON public.emergency_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emergency_contacts_insert_own" ON public.emergency_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "emergency_contacts_update_own" ON public.emergency_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "emergency_contacts_delete_own" ON public.emergency_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Table 20: emergency_alerts
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  ride_id UUID REFERENCES public.rides(id),
  alert_type TEXT CHECK (alert_type IN ('sos', 'accident', 'harassment')),
  location_lat DECIMAL,
  location_lng DECIMAL,
  status TEXT DEFAULT 'active',
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergency_alerts_select_own" ON public.emergency_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emergency_alerts_insert_own" ON public.emergency_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table 21: scheduled_rides
CREATE TABLE IF NOT EXISTS public.scheduled_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  dropoff_lat DECIMAL,
  dropoff_lng DECIMAL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  vehicle_type TEXT,
  max_price DECIMAL(10,2),
  status TEXT DEFAULT 'scheduled',
  ride_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scheduled_rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduled_rides_select_own" ON public.scheduled_rides
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scheduled_rides_insert_own" ON public.scheduled_rides
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scheduled_rides_update_own" ON public.scheduled_rides
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scheduled_rides_delete_own" ON public.scheduled_rides
  FOR DELETE USING (auth.uid() = user_id);

-- Ride stats function
CREATE OR REPLACE FUNCTION public.get_ride_stats(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_rides', COALESCE(COUNT(*), 0),
    'total_spent', COALESCE(SUM(final_price), 0),
    'avg_price', COALESCE(AVG(final_price), 0),
    'total_distance', COALESCE(SUM(distance_km), 0),
    'completed_rides', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),
    'cancelled_rides', COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled'), 0)
  ) INTO result
  FROM public.rides
  WHERE passenger_id = user_uuid OR driver_id = user_uuid;
  RETURN result;
END;
$$;

-- Emergency notification trigger
CREATE OR REPLACE FUNCTION public.trigger_emergency_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, ride_id, data)
  SELECT
    ec.user_id,
    'ALERTA SOS',
    'Um contato de emergencia acionou o SOS',
    'emergency',
    NEW.ride_id,
    json_build_object('alert_id', NEW.id, 'lat', NEW.location_lat, 'lng', NEW.location_lng)::jsonb
  FROM public.emergency_contacts ec
  WHERE ec.user_id = NEW.user_id AND ec.is_primary = true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_emergency_alert ON public.emergency_alerts;
CREATE TRIGGER on_emergency_alert
  AFTER INSERT ON public.emergency_alerts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_emergency_notification();
