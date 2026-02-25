-- ============================================================
-- UPPI - Fase 5: Referral system + support chat
-- ============================================================

-- Table 35: referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending',
  referrer_bonus DECIMAL(10,2) DEFAULT 10.00,
  referred_bonus DECIMAL(10,2) DEFAULT 15.00,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Table 36: referral_rewards
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reward_type TEXT CHECK (reward_type IN ('bonus', 'discount', 'cashback')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_rewards_select_own" ON public.referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- Process referral completion
CREATE OR REPLACE FUNCTION public.process_referral_completion(referral_uuid UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE ref_rec RECORD;
BEGIN
  SELECT * INTO ref_rec FROM public.referrals WHERE id = referral_uuid AND status = 'pending';
  IF ref_rec IS NULL THEN RETURN; END IF;

  UPDATE public.referrals SET status = 'completed', completed_at = NOW() WHERE id = referral_uuid;

  INSERT INTO public.referral_rewards (referral_id, user_id, reward_type, amount, status, credited_at)
  VALUES
    (referral_uuid, ref_rec.referrer_id, 'bonus', ref_rec.referrer_bonus, 'credited', NOW()),
    (referral_uuid, ref_rec.referred_id, 'bonus', ref_rec.referred_bonus, 'credited', NOW());
END;
$$;

-- Table 33: support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  ride_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_select_own" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_insert_own" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table 34: support_messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type TEXT CHECK (sender_type IN ('user', 'agent', 'system')),
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_messages_select" ON public.support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid())
  );
CREATE POLICY "support_messages_insert" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = support_messages.ticket_id AND user_id = auth.uid())
  );
