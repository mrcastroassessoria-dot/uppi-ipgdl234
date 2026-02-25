-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, from_user_id)
);

-- Enable Row Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view ratings they gave"
  ON ratings FOR SELECT
  USING (auth.uid() = from_user_id);

CREATE POLICY "Users can view ratings they received"
  ON ratings FOR SELECT
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = ratings.ride_id
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
      AND rides.status = 'completed'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ratings_ride_id ON ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ratings_from_user_id ON ratings(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);
