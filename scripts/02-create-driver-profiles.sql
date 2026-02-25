-- Create driver_profiles table
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('economy', 'electric', 'premium', 'suv', 'moto')),
  vehicle_model TEXT,
  vehicle_plate TEXT,
  vehicle_color TEXT,
  vehicle_year INTEGER,
  license_number TEXT,
  license_expiry DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  current_location JSONB,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own profile"
  ON driver_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own profile"
  ON driver_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can insert their own profile"
  ON driver_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view verified drivers"
  ON driver_profiles FOR SELECT
  USING (is_verified = TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_available ON driver_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_vehicle_type ON driver_profiles(vehicle_type);
