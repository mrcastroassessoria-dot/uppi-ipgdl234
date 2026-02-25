-- Add vehicle_type column to rides table so drivers can filter by their vehicle type
-- Moto drivers see moto requests, car drivers see car requests

-- Add vehicle_type column to rides
ALTER TABLE rides ADD COLUMN IF NOT EXISTS vehicle_type vehicle_type DEFAULT 'economy';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_rides_vehicle_type ON rides(vehicle_type);

-- Compound index for driver filtering: status + vehicle_type
CREATE INDEX IF NOT EXISTS idx_rides_status_vehicle ON rides(status, vehicle_type);

-- Update RLS policy so drivers can see pending rides matching their vehicle type
-- First, drop existing restrictive policy that only allows passenger/driver to see their own rides
DROP POLICY IF EXISTS "Users can view their own rides" ON rides;

-- Create new policies:
-- 1. Passengers can see their own rides
CREATE POLICY "Passengers can view their rides"
  ON rides FOR SELECT 
  USING (auth.uid() = passenger_id);

-- 2. Drivers can see pending/negotiating rides (to find new passengers)
CREATE POLICY "Drivers can view available rides"
  ON rides FOR SELECT 
  USING (
    status IN ('pending', 'negotiating')
    AND EXISTS (
      SELECT 1 FROM driver_profiles 
      WHERE driver_profiles.id = auth.uid()
    )
  );

-- 3. Drivers can see rides assigned to them
CREATE POLICY "Drivers can view assigned rides"
  ON rides FOR SELECT 
  USING (auth.uid() = driver_id);
