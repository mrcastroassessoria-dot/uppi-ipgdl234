-- ============================================================
-- UPPI - Fase 1: Setup Database (enums + 8 core tables + triggers)
-- ============================================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create custom enums
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('passenger', 'driver', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ride_status AS ENUM (
    'pending', 'negotiating', 'accepted',
    'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash', 'credit_card', 'debit_card', 'pix', 'wallet'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('economy', 'electric', 'premium', 'suv', 'moto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'credit', 'debit', 'refund', 'cashback',
    'withdrawal', 'bonus', 'transfer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Helper function: update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Table 1: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  user_type user_type DEFAULT 'passenger',
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table 2: driver_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE,
  vehicle_type vehicle_type DEFAULT 'economy',
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_plate TEXT UNIQUE,
  vehicle_color TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_profiles_select_own" ON public.driver_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "driver_profiles_update_own" ON public.driver_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "driver_profiles_insert_own" ON public.driver_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
-- Passengers can see available drivers
CREATE POLICY "driver_profiles_passengers_view" ON public.driver_profiles
  FOR SELECT USING (is_available = true AND is_verified = true);

DROP TRIGGER IF EXISTS update_driver_profiles_updated_at ON public.driver_profiles;
CREATE TRIGGER update_driver_profiles_updated_at
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostGIS spatial index
CREATE INDEX IF NOT EXISTS idx_driver_location ON public.driver_profiles USING GIST(current_location);

-- ============================================================
-- Table 3: rides
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.profiles(id),
  driver_id UUID REFERENCES public.profiles(id),
  vehicle_type vehicle_type DEFAULT 'economy',
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  pickup_address TEXT,
  dropoff_lat DECIMAL,
  dropoff_lng DECIMAL,
  dropoff_address TEXT,
  distance_km DECIMAL(10,2),
  estimated_duration_minutes INTEGER,
  passenger_price_offer DECIMAL(10,2),
  final_price DECIMAL(10,2),
  payment_method payment_method DEFAULT 'pix',
  status ride_status DEFAULT 'pending',
  scheduled_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rides_select_own" ON public.rides
  FOR SELECT USING (auth.uid() = passenger_id OR auth.uid() = driver_id);
CREATE POLICY "rides_insert_passenger" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "rides_update_own" ON public.rides
  FOR UPDATE USING (auth.uid() = passenger_id OR auth.uid() = driver_id);
-- Drivers can view pending rides matching their vehicle type
CREATE POLICY "rides_drivers_view_pending" ON public.rides
  FOR SELECT USING (
    status IN ('pending', 'negotiating')
    AND EXISTS (
      SELECT 1 FROM public.driver_profiles dp
      WHERE dp.id = auth.uid()
        AND dp.is_verified = true
        AND dp.is_available = true
        AND dp.vehicle_type = rides.vehicle_type
    )
  );

CREATE INDEX IF NOT EXISTS idx_rides_status_vehicle ON public.rides(status, vehicle_type);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON public.rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_created ON public.rides(created_at DESC);

DROP TRIGGER IF EXISTS update_rides_updated_at ON public.rides;
CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table 4: price_offers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id),
  offered_price DECIMAL(10,2) NOT NULL,
  message TEXT,
  status offer_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.price_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_select_relevant" ON public.price_offers
  FOR SELECT USING (
    auth.uid() = driver_id
    OR EXISTS (SELECT 1 FROM public.rides WHERE rides.id = price_offers.ride_id AND rides.passenger_id = auth.uid())
  );
CREATE POLICY "offers_insert_driver" ON public.price_offers
  FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "offers_update_relevant" ON public.price_offers
  FOR UPDATE USING (
    auth.uid() = driver_id
    OR EXISTS (SELECT 1 FROM public.rides WHERE rides.id = price_offers.ride_id AND rides.passenger_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_offers_ride ON public.price_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_offers_driver ON public.price_offers(driver_id);

DROP TRIGGER IF EXISTS update_offers_updated_at ON public.price_offers;
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.price_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Table 5: ratings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, reviewer_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select_own" ON public.ratings
  FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id);
CREATE POLICY "ratings_insert_own" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_ratings_reviewed ON public.ratings(reviewed_id);

-- ============================================================
-- Table 6: favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Table 7: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  ride_id UUID,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ============================================================
-- Table 8: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_ride" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = messages.ride_id
        AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );
CREATE POLICY "messages_insert_ride" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_ride ON public.messages(ride_id, created_at);

-- ============================================================
-- Trigger functions
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update user rating after new rating
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET rating = (
    SELECT COALESCE(AVG(rating), 5.0)
    FROM public.ratings
    WHERE reviewed_id = NEW.reviewed_id
  )
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_rating ON public.ratings;
CREATE TRIGGER on_new_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- Handle ride status change (increment total_rides on completion)
CREATE OR REPLACE FUNCTION public.handle_ride_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.profiles SET total_rides = total_rides + 1 WHERE id = NEW.passenger_id;
    IF NEW.driver_id IS NOT NULL THEN
      UPDATE public.profiles SET total_rides = total_rides + 1 WHERE id = NEW.driver_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_ride_status_change ON public.rides;
CREATE TRIGGER on_ride_status_change
  AFTER UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.handle_ride_status_change();
