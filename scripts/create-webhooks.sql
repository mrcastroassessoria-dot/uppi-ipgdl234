-- Webhooks System: Event-driven architecture for external integrations
-- Supports: ride events, payment events, driver events, user events

-- Webhook endpoints table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  secret TEXT NOT NULL, -- HMAC secret for signature verification
  is_active BOOLEAN DEFAULT true,
  max_retries INT DEFAULT 3,
  timeout_seconds INT DEFAULT 10,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  response_status_code INT,
  response_body TEXT,
  error_message TEXT,
  attempt_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_user ON webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON webhook_endpoints(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- RLS Policies
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Users can manage their own webhooks
CREATE POLICY webhook_endpoints_user_policy ON webhook_endpoints
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their own delivery logs
CREATE POLICY webhook_deliveries_user_policy ON webhook_deliveries
  FOR SELECT USING (
    endpoint_id IN (SELECT id FROM webhook_endpoints WHERE user_id = auth.uid())
  );

-- Function to trigger webhooks on ride events
CREATE OR REPLACE FUNCTION trigger_ride_webhooks()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  event_name TEXT;
BEGIN
  -- Determine event name based on operation
  event_name := CASE 
    WHEN TG_OP = 'INSERT' THEN 'ride.created'
    WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'ride.status_changed'
    WHEN TG_OP = 'DELETE' THEN 'ride.cancelled'
    ELSE NULL
  END;

  -- Skip if no relevant event
  IF event_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find all active webhooks subscribed to this event
  FOR webhook_record IN 
    SELECT id, url, secret 
    FROM webhook_endpoints 
    WHERE is_active = true 
    AND event_name = ANY(events)
    AND (user_id = NEW.passenger_id OR user_id = NEW.driver_id)
  LOOP
    -- Create delivery record
    INSERT INTO webhook_deliveries (endpoint_id, event_type, payload, status)
    VALUES (
      webhook_record.id,
      event_name,
      jsonb_build_object(
        'event', event_name,
        'timestamp', now(),
        'data', CASE 
          WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
          ELSE to_jsonb(NEW)
        END
      ),
      'pending'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for ride events
DROP TRIGGER IF EXISTS ride_webhook_trigger ON rides;
CREATE TRIGGER ride_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ride_webhooks();

-- Function to trigger webhooks on payment events
CREATE OR REPLACE FUNCTION trigger_payment_webhooks()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  event_name TEXT := 'payment.' || TG_OP;
  ride_passenger_id UUID;
BEGIN
  -- Get passenger_id from ride
  SELECT passenger_id INTO ride_passenger_id FROM rides WHERE id = NEW.ride_id;

  -- Find all active webhooks subscribed to this event
  FOR webhook_record IN 
    SELECT id, url, secret 
    FROM webhook_endpoints 
    WHERE is_active = true 
    AND event_name = ANY(events)
    AND user_id = ride_passenger_id
  LOOP
    -- Create delivery record
    INSERT INTO webhook_deliveries (endpoint_id, event_type, payload, status)
    VALUES (
      webhook_record.id,
      event_name,
      jsonb_build_object(
        'event', event_name,
        'timestamp', now(),
        'data', to_jsonb(NEW)
      ),
      'pending'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for payment events
DROP TRIGGER IF EXISTS payment_webhook_trigger ON payments;
CREATE TRIGGER payment_webhook_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_payment_webhooks();

-- Function to get pending webhook deliveries for processing
CREATE OR REPLACE FUNCTION get_pending_webhooks(limit_count INT DEFAULT 100)
RETURNS TABLE (
  delivery_id UUID,
  endpoint_url TEXT,
  endpoint_secret TEXT,
  event_type TEXT,
  payload JSONB,
  attempt_count INT,
  max_retries INT,
  timeout_seconds INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    e.url,
    e.secret,
    d.event_type,
    d.payload,
    d.attempt_count,
    e.max_retries,
    e.timeout_seconds
  FROM webhook_deliveries d
  JOIN webhook_endpoints e ON d.endpoint_id = e.id
  WHERE d.status IN ('pending', 'retrying')
    AND (d.next_retry_at IS NULL OR d.next_retry_at <= now())
    AND e.is_active = true
  ORDER BY d.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update webhook delivery status
CREATE OR REPLACE FUNCTION update_webhook_delivery(
  delivery_id UUID,
  new_status TEXT,
  status_code INT DEFAULT NULL,
  response TEXT DEFAULT NULL,
  error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_attempt INT;
  endpoint_max_retries INT;
BEGIN
  -- Get current attempt and max retries
  SELECT d.attempt_count + 1, e.max_retries 
  INTO current_attempt, endpoint_max_retries
  FROM webhook_deliveries d
  JOIN webhook_endpoints e ON d.endpoint_id = e.id
  WHERE d.id = delivery_id;

  -- Update delivery record
  UPDATE webhook_deliveries
  SET 
    status = CASE 
      WHEN new_status = 'failed' AND current_attempt < endpoint_max_retries THEN 'retrying'
      ELSE new_status
    END,
    response_status_code = status_code,
    response_body = response,
    error_message = error,
    attempt_count = current_attempt,
    next_retry_at = CASE 
      WHEN new_status = 'failed' AND current_attempt < endpoint_max_retries 
      THEN now() + (INTERVAL '1 minute' * (2 ^ current_attempt)) -- Exponential backoff
      ELSE NULL
    END,
    delivered_at = CASE WHEN new_status = 'success' THEN now() ELSE NULL END
  WHERE id = delivery_id;

  -- Update endpoint last triggered time
  IF new_status = 'success' THEN
    UPDATE webhook_endpoints 
    SET last_triggered_at = now()
    WHERE id = (SELECT endpoint_id FROM webhook_deliveries WHERE id = delivery_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
