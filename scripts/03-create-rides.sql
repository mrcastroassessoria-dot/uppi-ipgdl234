-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'negotiating', 'accepted', 'in_progress', 'completed', 'cancelled')),
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  vehicle_type TEXT CHECK (vehicle_type IN ('economy', 'electric', 'premium', 'suv', 'moto')),
  passenger_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'wallet')),
  notes TEXT,
  scheduled_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Passengers can view their own rides"
  ON rides FOR SELECT
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view their assigned rides"
  ON rides FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Passengers can create rides"
  ON rides FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Passengers can update their pending rides"
  ON rides FOR UPDATE
  USING (auth.uid() = passenger_id AND status = 'pending');

CREATE POLICY "Drivers can update accepted rides"
  ON rides FOR UPDATE
  USING (auth.uid() = driver_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);
