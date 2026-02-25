-- Uppi App Database Schema
-- Sistema completo de transporte similar ao inDrive
-- Version without PostGIS - using simple lat/lng columns

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('passenger', 'driver', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ride_status AS ENUM ('pending', 'negotiating', 'accepted', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'wallet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('economy', 'electric', 'premium', 'suv', 'moto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Usuario',
  phone TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  user_type user_type NOT NULL DEFAULT 'passenger',
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver profiles
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  current_lat DECIMAL(10,7),
  current_lng DECIMAL(10,7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID NOT NULL REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id),
  pickup_lat DECIMAL(10,7) NOT NULL,
  pickup_lng DECIMAL(10,7) NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10,7) NOT NULL,
  dropoff_lng DECIMAL(10,7) NOT NULL,
  dropoff_address TEXT NOT NULL,
  distance_km DECIMAL(10,2),
  estimated_duration_minutes INTEGER,
  passenger_price_offer DECIMAL(10,2),
  final_price DECIMAL(10,2),
  payment_method payment_method,
  status ride_status NOT NULL DEFAULT 'pending',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price offers (sistema de negociacao do inDrive)
CREATE TABLE IF NOT EXISTS price_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  offered_price DECIMAL(10,2) NOT NULL,
  message TEXT,
  status offer_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings and reviews
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewed_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites (motoristas/passageiros favoritos)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorite_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, favorite_user_id)
);

-- Payment history
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status TEXT NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created ON rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_offers_ride ON price_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_driver ON price_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_status ON price_offers(status);
CREATE INDEX IF NOT EXISTS idx_ratings_reviewed ON ratings(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for driver_profiles
DROP POLICY IF EXISTS "Driver profiles are viewable by everyone" ON driver_profiles;
CREATE POLICY "Driver profiles are viewable by everyone"
  ON driver_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can update own profile" ON driver_profiles;
CREATE POLICY "Drivers can update own profile"
  ON driver_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Drivers can insert own profile" ON driver_profiles;
CREATE POLICY "Drivers can insert own profile"
  ON driver_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for rides
DROP POLICY IF EXISTS "Users can view their own rides" ON rides;
CREATE POLICY "Users can view their own rides"
  ON rides FOR SELECT USING (auth.uid() = passenger_id OR auth.uid() = driver_id);

DROP POLICY IF EXISTS "Passengers can create rides" ON rides;
CREATE POLICY "Passengers can create rides"
  ON rides FOR INSERT WITH CHECK (auth.uid() = passenger_id);

DROP POLICY IF EXISTS "Users can update their own rides" ON rides;
CREATE POLICY "Users can update their own rides"
  ON rides FOR UPDATE USING (auth.uid() = passenger_id OR auth.uid() = driver_id);

-- RLS Policies for price_offers
DROP POLICY IF EXISTS "Users can view offers for their rides" ON price_offers;
CREATE POLICY "Users can view offers for their rides"
  ON price_offers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = price_offers.ride_id 
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
    OR auth.uid() = driver_id
  );

DROP POLICY IF EXISTS "Drivers can create offers" ON price_offers;
CREATE POLICY "Drivers can create offers"
  ON price_offers FOR INSERT WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Drivers can update their offers" ON price_offers;
CREATE POLICY "Drivers can update their offers"
  ON price_offers FOR UPDATE USING (auth.uid() = driver_id);

-- RLS Policies for ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings;
CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create ratings for their rides" ON ratings;
CREATE POLICY "Users can create ratings for their rides"
  ON ratings FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- RLS Policies for favorites
DROP POLICY IF EXISTS "Users can view their favorites" ON favorites;
CREATE POLICY "Users can view their favorites"
  ON favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their favorites" ON favorites;
CREATE POLICY "Users can manage their favorites"
  ON favorites FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for payments
DROP POLICY IF EXISTS "Users can view their payments" ON payments;
CREATE POLICY "Users can view their payments"
  ON payments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = payments.ride_id 
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_profiles_updated_at ON driver_profiles;
CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rides_updated_at ON rides;
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_offers_updated_at ON price_offers;
CREATE TRIGGER update_price_offers_updated_at BEFORE UPDATE ON price_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT COALESCE(AVG(rating), 5.00)
    FROM ratings
    WHERE reviewed_id = NEW.reviewed_id
  )
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rating_trigger ON ratings;
CREATE TRIGGER update_rating_trigger AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Function to increment total rides
CREATE OR REPLACE FUNCTION increment_total_rides()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles SET total_rides = total_rides + 1
    WHERE id = NEW.passenger_id OR id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_rides_trigger ON rides;
CREATE TRIGGER increment_rides_trigger AFTER UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION increment_total_rides();

-- Auto-create profile on signup (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(
      CASE WHEN NEW.raw_user_meta_data ->> 'user_type' IN ('passenger', 'driver', 'both')
        THEN (NEW.raw_user_meta_data ->> 'user_type')::user_type
        ELSE 'passenger'::user_type
      END,
      'passenger'::user_type
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
