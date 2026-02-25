-- Create driver_profiles table
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'van')),
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL UNIQUE,
  vehicle_year INTEGER NOT NULL CHECK (vehicle_year >= 1980 AND vehicle_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  license_number TEXT NOT NULL UNIQUE,
  license_category TEXT NOT NULL CHECK (license_category IN ('A', 'B', 'AB', 'C', 'D', 'E')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  current_location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON driver_profiles(status);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_is_online ON driver_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_vehicle_plate ON driver_profiles(vehicle_plate);

-- Enable Row Level Security
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own driver profile
CREATE POLICY "Users can view their own driver profile"
  ON driver_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own driver profile
CREATE POLICY "Users can create their own driver profile"
  ON driver_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own driver profile
CREATE POLICY "Users can update their own driver profile"
  ON driver_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Allow passengers to view online drivers (for ride matching)
CREATE POLICY "Passengers can view online drivers"
  ON driver_profiles
  FOR SELECT
  USING (is_online = true AND status = 'approved');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_driver_profiles_updated_at_trigger
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_profiles_updated_at();
