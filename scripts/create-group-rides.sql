-- Group Rides & Split Payment
-- Allows multiple passengers to share a ride and split costs

-- Group Rides table
CREATE TABLE IF NOT EXISTS group_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL, -- 6-digit code to join
  max_passengers INTEGER DEFAULT 4,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'active', 'completed', 'cancelled')),
  split_method TEXT DEFAULT 'equal' CHECK (split_method IN ('equal', 'custom', 'by_distance')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Ride Participants
CREATE TABLE IF NOT EXISTS group_ride_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_ride_id UUID REFERENCES group_rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'paid')),
  amount_owed DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  pickup_lat DECIMAL(10,6),
  pickup_lng DECIMAL(10,6),
  pickup_address TEXT,
  dropoff_lat DECIMAL(10,6),
  dropoff_lng DECIMAL(10,6),
  dropoff_address TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  UNIQUE(group_ride_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_rides_ride_id ON group_rides(ride_id);
CREATE INDEX IF NOT EXISTS idx_group_rides_invite_code ON group_rides(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_rides_status ON group_rides(status);
CREATE INDEX IF NOT EXISTS idx_group_rides_expires_at ON group_rides(expires_at);
CREATE INDEX IF NOT EXISTS idx_group_ride_participants_group ON group_ride_participants(group_ride_id);
CREATE INDEX IF NOT EXISTS idx_group_ride_participants_user ON group_ride_participants(user_id);

-- RLS Policies
ALTER TABLE group_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ride_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view open group rides
CREATE POLICY "Anyone can view open group rides"
  ON group_rides FOR SELECT
  USING (status = 'open' OR created_by = auth.uid());

-- Only creator can update group ride
CREATE POLICY "Creator can update group ride"
  ON group_rides FOR UPDATE
  USING (created_by = auth.uid());

-- Only creator can delete group ride
CREATE POLICY "Creator can delete group ride"
  ON group_rides FOR DELETE
  USING (created_by = auth.uid());

-- Anyone can create group ride
CREATE POLICY "Anyone can create group ride"
  ON group_rides FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Participants can view their group rides
CREATE POLICY "Participants can view group rides"
  ON group_ride_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    group_ride_id IN (SELECT id FROM group_rides WHERE created_by = auth.uid())
  );

-- Users can join group rides
CREATE POLICY "Users can join group rides"
  ON group_ride_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own participation
CREATE POLICY "Users can update their participation"
  ON group_ride_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Function to generate unique 6-digit invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM group_rides WHERE invite_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate split amounts
CREATE OR REPLACE FUNCTION calculate_split_amounts(
  p_group_ride_id UUID,
  p_total_price DECIMAL
)
RETURNS TABLE (
  user_id UUID,
  amount DECIMAL
) AS $$
DECLARE
  v_split_method TEXT;
  v_participant_count INTEGER;
BEGIN
  SELECT split_method INTO v_split_method
  FROM group_rides WHERE id = p_group_ride_id;

  SELECT COUNT(*) INTO v_participant_count
  FROM group_ride_participants
  WHERE group_ride_id = p_group_ride_id AND status IN ('accepted', 'paid');

  IF v_participant_count = 0 THEN
    RETURN;
  END IF;

  IF v_split_method = 'equal' THEN
    -- Split equally among all participants
    RETURN QUERY
    SELECT 
      grp.user_id,
      ROUND(p_total_price / v_participant_count, 2)
    FROM group_ride_participants grp
    WHERE grp.group_ride_id = p_group_ride_id 
      AND grp.status IN ('accepted', 'paid');
  
  ELSIF v_split_method = 'by_distance' THEN
    -- Calculate based on individual pickup/dropoff distances
    -- For now, fall back to equal split (needs routing API integration)
    RETURN QUERY
    SELECT 
      grp.user_id,
      ROUND(p_total_price / v_participant_count, 2)
    FROM group_ride_participants grp
    WHERE grp.group_ride_id = p_group_ride_id 
      AND grp.status IN ('accepted', 'paid');
  
  ELSE -- 'custom'
    -- Use custom amounts set by creator
    RETURN QUERY
    SELECT 
      grp.user_id,
      grp.amount_owed
    FROM group_ride_participants grp
    WHERE grp.group_ride_id = p_group_ride_id 
      AND grp.status IN ('accepted', 'paid');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-expire group rides
CREATE OR REPLACE FUNCTION auto_expire_group_rides()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at < NOW() AND NEW.status = 'open' THEN
    NEW.status := 'cancelled';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_group_rides
  BEFORE UPDATE ON group_rides
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_group_rides();

-- Trigger to update participant count
CREATE OR REPLACE FUNCTION update_group_ride_status()
RETURNS TRIGGER AS $$
DECLARE
  v_participant_count INTEGER;
  v_max_passengers INTEGER;
BEGIN
  SELECT COUNT(*), gr.max_passengers INTO v_participant_count, v_max_passengers
  FROM group_ride_participants grp
  JOIN group_rides gr ON grp.group_ride_id = gr.id
  WHERE grp.group_ride_id = NEW.group_ride_id 
    AND grp.status = 'accepted'
  GROUP BY gr.max_passengers;

  IF v_participant_count >= v_max_passengers THEN
    UPDATE group_rides 
    SET status = 'full', updated_at = NOW()
    WHERE id = NEW.group_ride_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_ride_status
  AFTER INSERT OR UPDATE ON group_ride_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_group_ride_status();
