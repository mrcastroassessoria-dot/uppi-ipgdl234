-- ================================================================
-- FCM Tokens Table
-- Stores Firebase Cloud Messaging tokens for push notifications
-- ================================================================

-- Drop existing if recreating
DROP TABLE IF EXISTS fcm_tokens CASCADE;

-- Create fcm_tokens table
CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'web', -- 'web', 'android', 'ios'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  
  UNIQUE(user_id, token)
);

-- Indexes for performance
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);
CREATE INDEX idx_fcm_tokens_updated_at ON fcm_tokens(updated_at DESC);

-- RLS Policies
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY fcm_tokens_select_own
  ON fcm_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY fcm_tokens_insert_own
  ON fcm_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY fcm_tokens_update_own
  ON fcm_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY fcm_tokens_delete_own
  ON fcm_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean old tokens (optional - run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_fcm_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM fcm_tokens
  WHERE updated_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Grant permissions
GRANT ALL ON fcm_tokens TO authenticated;
GRANT ALL ON fcm_tokens TO service_role;
