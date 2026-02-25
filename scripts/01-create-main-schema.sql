-- Uppi Database Schema - Main Tables
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
CREATE TYPE driver_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE vehicle_type AS ENUM ('economy', 'comfort', 'premium', 'suv', 'van', 'moto');
CREATE TYPE ride_status AS ENUM ('searching', 'pending_offers', 'accepted', 'driver_arrived', 'in_progress', 'completed', 'cancelled', 'failed');
CREATE TYPE ride_type AS ENUM ('individual', 'shared', 'scheduled', 'delivery', 'intercity');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE transaction_type AS ENUM ('ride', 'refund', 'bonus', 'cashback', 'referral', 'subscription', 'withdrawal', 'deposit');
CREATE TYPE notification_type AS ENUM ('ride', 'offer', 'message', 'achievement', 'promotion', 'system');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'passenger',
  status user_status DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  birth_date DATE,
  gender TEXT,
  language TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  push_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE NOT NULL,
  license_expiry_date DATE NOT NULL,
  license_state TEXT NOT NULL,
  status driver_status DEFAULT 'pending',
  is_online BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT),
  current_location_updated_at TIMESTAMPTZ,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
  cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver documents table
CREATE TABLE public.driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'license_front', 'license_back', 'selfie', 'criminal_record', 'vehicle_registration'
  document_url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, document_type)
);

-- Vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  type vehicle_type NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  type ride_type DEFAULT 'individual',
  status ride_status DEFAULT 'searching',
  
  -- Location data
  pickup_location GEOGRAPHY(POINT) NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_details TEXT,
  dropoff_location GEOGRAPHY(POINT) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_details TEXT,
  
  -- Route data
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  route_polyline TEXT,
  
  -- Pricing
  base_price DECIMAL(10,2),
  surge_multiplier DECIMAL(3,2) DEFAULT 1.00,
  final_price DECIMAL(10,2),
  
  -- Timing
  scheduled_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  driver_arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES public.users(id),
  
  -- Features
  is_shared BOOLEAN DEFAULT false,
  max_passengers INTEGER DEFAULT 1,
  current_passengers INTEGER DEFAULT 1,
  payment_method TEXT DEFAULT 'wallet',
  promo_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Safety
  audio_recording_url TEXT,
  sos_activated BOOLEAN DEFAULT false,
  sos_activated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ride offers table (for the Fair Deal system)
CREATE TABLE public.ride_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  
  offered_price DECIMAL(10,2) NOT NULL,
  estimated_arrival_minutes INTEGER,
  message TEXT,
  
  status offer_status DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ride_id, driver_id)
);

-- Ride tracking table (for real-time location updates)
CREATE TABLE public.ride_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_location GEOGRAPHY(POINT) NOT NULL,
  passenger_location GEOGRAPHY(POINT),
  bearing DECIMAL(5,2),
  speed_kmh DECIMAL(5,2),
  eta_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for tracking queries
CREATE INDEX idx_ride_tracking_ride_id ON public.ride_tracking(ride_id, created_at DESC);

-- Messages table (chat between passenger and driver)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  receiver_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id),
  reviewee_id UUID NOT NULL REFERENCES public.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[], -- ['clean_car', 'friendly', 'safe_driver', 'punctual']
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, reviewer_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);

CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_is_online ON public.drivers(is_online);
CREATE INDEX idx_drivers_location ON public.drivers USING GIST(current_location);

CREATE INDEX idx_rides_passenger_id ON public.rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_created_at ON public.rides(created_at DESC);
CREATE INDEX idx_rides_pickup_location ON public.rides USING GIST(pickup_location);
CREATE INDEX idx_rides_dropoff_location ON public.rides USING GIST(dropoff_location);

CREATE INDEX idx_ride_offers_ride_id ON public.ride_offers(ride_id);
CREATE INDEX idx_ride_offers_driver_id ON public.ride_offers(driver_id);
CREATE INDEX idx_ride_offers_status ON public.ride_offers(status);

CREATE INDEX idx_messages_ride_id ON public.messages(ride_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);

CREATE INDEX idx_reviews_ride_id ON public.reviews(ride_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ride_offers_updated_at BEFORE UPDATE ON public.ride_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
