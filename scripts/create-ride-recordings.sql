-- Ride Audio Recordings
-- Opt-in encrypted audio recordings for safety

-- Ride recordings table
CREATE TABLE IF NOT EXISTS ride_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recording_url TEXT, -- Encrypted blob storage URL
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  encryption_key_hash TEXT, -- Hash of encryption key (not the key itself)
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'completed', 'failed', 'deleted')),
  auto_delete_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- Auto-delete after 7 days
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User recording preferences
CREATE TABLE IF NOT EXISTS user_recording_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  auto_start BOOLEAN DEFAULT true, -- Auto-start recording when ride begins
  retention_days INTEGER DEFAULT 7, -- How long to keep recordings
  notify_on_recording BOOLEAN DEFAULT true, -- Notify other party when recording
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ride_recordings_ride_id ON ride_recordings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_recordings_user_id ON ride_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_recordings_status ON ride_recordings(status);
CREATE INDEX IF NOT EXISTS idx_ride_recordings_auto_delete ON ride_recordings(auto_delete_at);

-- RLS Policies
ALTER TABLE ride_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recording_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only view their own recordings
CREATE POLICY "Users can view own recordings"
  ON ride_recordings FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own recordings
CREATE POLICY "Users can create recordings"
  ON ride_recordings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own recordings
CREATE POLICY "Users can update own recordings"
  ON ride_recordings FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own recordings
CREATE POLICY "Users can delete own recordings"
  ON ride_recordings FOR DELETE
  USING (user_id = auth.uid());

-- Users can manage their own preferences
CREATE POLICY "Users can manage preferences"
  ON user_recording_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to auto-delete expired recordings
CREATE OR REPLACE FUNCTION delete_expired_recordings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM ride_recordings
    WHERE auto_delete_at < NOW() AND status = 'completed'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run via cron or Edge Function)
COMMENT ON FUNCTION delete_expired_recordings() IS 'Call this function periodically to delete expired recordings';

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_recording_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recording_timestamp
  BEFORE UPDATE ON ride_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_recording_timestamp();

CREATE TRIGGER trigger_update_preferences_timestamp
  BEFORE UPDATE ON user_recording_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_recording_timestamp();
