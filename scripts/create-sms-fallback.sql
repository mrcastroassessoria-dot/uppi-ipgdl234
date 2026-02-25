-- SMS Fallback System for Push Notifications
-- Sends SMS when push notifications fail to deliver

-- SMS delivery tracking
CREATE TABLE IF NOT EXISTS sms_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  
  -- Delivery tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
  provider TEXT NOT NULL DEFAULT 'twilio' CHECK (provider IN ('twilio', 'aws-sns', 'vonage')),
  provider_message_id TEXT,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  
  -- Metadata
  cost_cents INTEGER, -- Cost in cents (e.g., 7 cents = 7)
  segments INTEGER DEFAULT 1, -- SMS segments (160 chars each)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- User SMS preferences
CREATE TABLE IF NOT EXISTS user_sms_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Opt-in settings
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  fallback_only BOOLEAN NOT NULL DEFAULT TRUE, -- Only send SMS if push fails
  
  -- Event preferences
  ride_updates BOOLEAN NOT NULL DEFAULT TRUE,
  price_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  driver_arrival BOOLEAN NOT NULL DEFAULT TRUE,
  payment_updates BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_deliveries_user_id ON sms_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_deliveries_status ON sms_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_sms_deliveries_notification_id ON sms_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_sms_deliveries_created_at ON sms_deliveries(created_at DESC);

-- RLS Policies
ALTER TABLE sms_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sms_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own SMS deliveries
CREATE POLICY "Users can view own SMS deliveries"
  ON sms_deliveries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own SMS preferences
CREATE POLICY "Users can view own SMS preferences"
  ON user_sms_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS preferences"
  ON user_sms_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS preferences"
  ON user_sms_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to process pending SMS
CREATE OR REPLACE FUNCTION process_pending_sms()
RETURNS TABLE(
  sms_id UUID,
  phone_number TEXT,
  message TEXT,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sd.id,
    sd.phone_number,
    sd.message,
    sd.retry_count
  FROM sms_deliveries sd
  WHERE sd.status = 'pending'
    AND sd.retry_count < sd.max_retries
    AND (sd.created_at > NOW() - INTERVAL '1 hour') -- Only retry recent messages
  ORDER BY sd.created_at ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if SMS should be sent (fallback logic)
CREATE OR REPLACE FUNCTION should_send_sms_fallback(
  p_user_id UUID,
  p_notification_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_preferences RECORD;
  v_push_failed BOOLEAN;
BEGIN
  -- Check user SMS preferences
  SELECT * INTO v_preferences
  FROM user_sms_preferences
  WHERE user_id = p_user_id
    AND enabled = TRUE
    AND phone_verified = TRUE;
  
  -- If no preferences or not enabled, don't send
  IF v_preferences IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if specific event type is enabled
  CASE p_notification_type
    WHEN 'ride_accepted', 'ride_started', 'ride_completed' THEN
      IF NOT v_preferences.ride_updates THEN
        RETURN FALSE;
      END IF;
    WHEN 'offer_received', 'price_changed' THEN
      IF NOT v_preferences.price_alerts THEN
        RETURN FALSE;
      END IF;
    WHEN 'driver_nearby', 'driver_arrived' THEN
      IF NOT v_preferences.driver_arrival THEN
        RETURN FALSE;
      END IF;
    WHEN 'payment_success', 'payment_failed' THEN
      IF NOT v_preferences.payment_updates THEN
        RETURN FALSE;
      END IF;
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- If fallback_only, only send if push notification failed
  IF v_preferences.fallback_only THEN
    -- Check if a recent push notification for this user failed
    SELECT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = p_user_id
        AND type = p_notification_type
        AND created_at > NOW() - INTERVAL '5 minutes'
        AND read = FALSE -- Assume unread means not delivered via push
    ) INTO v_push_failed;
    
    RETURN v_push_failed;
  END IF;
  
  -- If not fallback_only, always send
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_sms_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sms_preferences_timestamp
  BEFORE UPDATE ON user_sms_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_preferences_timestamp();
