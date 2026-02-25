-- Create price_offers table
CREATE TABLE IF NOT EXISTS price_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offered_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE price_offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own offers"
  ON price_offers FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Passengers can view offers for their rides"
  ON price_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = price_offers.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can create offers"
  ON price_offers FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own offers"
  ON price_offers FOR UPDATE
  USING (auth.uid() = driver_id);

CREATE POLICY "Passengers can update offers for their rides"
  ON price_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = price_offers.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_offers_ride_id ON price_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_driver_id ON price_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_status ON price_offers(status);
CREATE INDEX IF NOT EXISTS idx_price_offers_expires_at ON price_offers(expires_at);
