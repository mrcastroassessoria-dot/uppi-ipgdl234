-- ============================================================
-- UPPI - Fase 4: Group rides + recordings + SMS + webhooks
-- ============================================================

-- ============================================================
-- Group Rides (2 tables)
-- ============================================================

-- Generate invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE code TEXT;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.group_rides WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- Table 25: group_rides
CREATE TABLE IF NOT EXISTS public.group_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  ride_id UUID REFERENCES public.rides(id),
  invite_code TEXT UNIQUE DEFAULT public.generate_invite_code(),
  max_participants INTEGER DEFAULT 4,
  split_type TEXT CHECK (split_type IN ('equal', 'custom', 'distance')) DEFAULT 'equal',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.group_rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_rides_select" ON public.group_rides
  FOR SELECT USING (
    auth.uid() = creator_id
    OR EXISTS (SELECT 1 FROM public.group_ride_participants WHERE group_ride_id = group_rides.id AND user_id = auth.uid())
  );
CREATE POLICY "group_rides_insert" ON public.group_rides
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "group_rides_update" ON public.group_rides
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "group_rides_delete" ON public.group_rides
  FOR DELETE USING (auth.uid() = creator_id);

-- Table 26: group_ride_participants
CREATE TABLE IF NOT EXISTS public.group_ride_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_ride_id UUID NOT NULL REFERENCES public.group_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  pickup_address TEXT,
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  share_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_ride_id, user_id)
);

ALTER TABLE public.group_ride_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants_select" ON public.group_ride_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_rides WHERE id = group_ride_participants.group_ride_id AND (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.group_ride_participants p2 WHERE p2.group_ride_id = group_ride_participants.group_ride_id AND p2.user_id = auth.uid())))
  );
CREATE POLICY "participants_insert" ON public.group_ride_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participants_update" ON public.group_ride_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Calculate split
CREATE OR REPLACE FUNCTION public.calculate_group_split(group_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  group_rec RECORD;
  participant_count INTEGER;
  total_price DECIMAL;
  split_amount DECIMAL;
BEGIN
  SELECT gr.*, r.final_price INTO group_rec
  FROM public.group_rides gr
  LEFT JOIN public.rides r ON r.id = gr.ride_id
  WHERE gr.id = group_id;

  SELECT COUNT(*) INTO participant_count FROM public.group_ride_participants WHERE group_ride_id = group_id;
  total_price := COALESCE(group_rec.final_price, 0);

  IF group_rec.split_type = 'equal' AND participant_count > 0 THEN
    split_amount := total_price / participant_count;
    UPDATE public.group_ride_participants SET share_amount = split_amount WHERE group_ride_id = group_id;
  END IF;

  RETURN json_build_object('total', total_price, 'participants', participant_count, 'split_amount', split_amount);
END;
$$;

-- ============================================================
-- Ride Recordings (2 tables)
-- ============================================================

-- Table 31: ride_recordings
CREATE TABLE IF NOT EXISTS public.ride_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  storage_path TEXT,
  encryption_key_hash TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  status TEXT DEFAULT 'recording',
  auto_delete_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ride_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recordings_select_own" ON public.ride_recordings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recordings_insert_own" ON public.ride_recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recordings_update_own" ON public.ride_recordings
  FOR UPDATE USING (auth.uid() = user_id);

-- Table 32: recording_consents
CREATE TABLE IF NOT EXISTS public.recording_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  consented BOOLEAN DEFAULT false,
  consented_at TIMESTAMPTZ,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, user_id)
);

ALTER TABLE public.recording_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consents_select_own" ON public.recording_consents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consents_insert_own" ON public.recording_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-delete expired recordings
CREATE OR REPLACE FUNCTION public.cleanup_expired_recordings()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.ride_recordings WHERE auto_delete_at < NOW();
END;
$$;

-- ============================================================
-- SMS Fallback (2 tables)
-- ============================================================

-- Table 29: sms_templates
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  template TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_templates_select" ON public.sms_templates
  FOR SELECT USING (is_active = true);

-- Table 30: sms_deliveries
CREATE TABLE IF NOT EXISTS public.sms_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  template_id UUID REFERENCES public.sms_templates(id),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  provider TEXT DEFAULT 'twilio',
  provider_message_id TEXT,
  error_message TEXT,
  cost DECIMAL(10,4),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sms_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_deliveries_select_own" ON public.sms_deliveries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sms_deliveries_insert" ON public.sms_deliveries
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- Webhooks (2 tables)
-- ============================================================

-- Table 27: webhook_endpoints
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_manage_own" ON public.webhook_endpoints
  FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhook_endpoints;
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 28: webhook_deliveries
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  success BOOLEAN,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.webhook_endpoints WHERE id = webhook_deliveries.webhook_id AND user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id, created_at DESC);

-- Webhook signature generator
CREATE OR REPLACE FUNCTION public.generate_webhook_signature(payload TEXT, secret TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN encode(hmac(payload::bytea, secret::bytea, 'sha256'), 'hex');
END;
$$;
