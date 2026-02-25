-- Add facial verification fields to driver_profiles table
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS last_verification_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_photo_url TEXT,
ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT true;

-- Add index for quick verification checks
CREATE INDEX IF NOT EXISTS idx_driver_verification 
ON driver_profiles(last_verification_at);

-- Create function to check if driver needs verification
-- Drivers need to verify every 24 hours
CREATE OR REPLACE FUNCTION needs_facial_verification(driver_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_verified TIMESTAMPTZ;
  requires_verification BOOLEAN;
BEGIN
  SELECT last_verification_at, driver_profiles.requires_verification
  INTO last_verified, requires_verification
  FROM driver_profiles
  WHERE id = driver_id;
  
  -- If no record found or verification is not required
  IF NOT FOUND OR NOT requires_verification THEN
    RETURN false;
  END IF;
  
  -- If never verified
  IF last_verified IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if last verification was more than 24 hours ago
  RETURN (NOW() - last_verified) > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION needs_facial_verification(UUID) TO authenticated;

COMMENT ON COLUMN driver_profiles.last_verification_at IS 'Timestamp of last facial verification';
COMMENT ON COLUMN driver_profiles.verification_photo_url IS 'URL to most recent verification photo';
COMMENT ON COLUMN driver_profiles.requires_verification IS 'Whether this driver needs to complete facial verification';
COMMENT ON FUNCTION needs_facial_verification(UUID) IS 'Check if driver needs to complete facial verification (every 24 hours)';
