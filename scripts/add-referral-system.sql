-- Add referral system to Uppi
-- Sistema agressivo de indicação com tracking e gamificação

-- Add referral columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS referral_credits DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  bonus_paid BOOLEAN DEFAULT FALSE,
  bonus_amount DECIMAL(10,2) DEFAULT 10.00,
  first_ride_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_id, referred_id)
);

-- Create referral achievements table
CREATE TABLE IF NOT EXISTS referral_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON referral_achievements(user_id);

-- RLS Policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
CREATE POLICY "Users can view their referrals"
  ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "Users can view their achievements" ON referral_achievements;
CREATE POLICY "Users can view their achievements"
  ON referral_achievements FOR SELECT USING (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      -- Generate 6 character code: first 3 letters of name + 3 random chars
      new_code := UPPER(
        SUBSTRING(REGEXP_REPLACE(NEW.full_name, '[^a-zA-Z]', '', 'g'), 1, 3) ||
        SUBSTRING(MD5(RANDOM()::TEXT), 1, 3)
      );
      
      -- Check if code exists
      SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_referral_code_trigger ON profiles;
CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Function to process referral on first ride
CREATE OR REPLACE FUNCTION process_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- When a ride is completed for the first time by a referred user
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check if this is user's first ride and they were referred
    IF EXISTS (
      SELECT 1 FROM referrals 
      WHERE referred_id = NEW.passenger_id 
      AND first_ride_completed = FALSE
    ) THEN
      -- Mark referral as completed
      UPDATE referrals 
      SET 
        first_ride_completed = TRUE,
        bonus_paid = TRUE,
        completed_at = NOW()
      WHERE referred_id = NEW.passenger_id;
      
      -- Add credits to referrer (quem indicou)
      UPDATE profiles
      SET 
        referral_credits = referral_credits + 10.00,
        total_referrals = total_referrals + 1
      WHERE id = (
        SELECT referrer_id FROM referrals WHERE referred_id = NEW.passenger_id LIMIT 1
      );
      
      -- Add credits to referred (quem foi indicado)
      UPDATE profiles
      SET referral_credits = referral_credits + 10.00
      WHERE id = NEW.passenger_id;
      
      -- Check for achievements
      PERFORM check_referral_achievements((
        SELECT referrer_id FROM referrals WHERE referred_id = NEW.passenger_id LIMIT 1
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS process_referral_bonus_trigger ON rides;
CREATE TRIGGER process_referral_bonus_trigger
  AFTER UPDATE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION process_referral_bonus();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_referral_achievements(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  total_refs INTEGER;
BEGIN
  SELECT total_referrals INTO total_refs FROM profiles WHERE id = user_uuid;
  
  -- First referral achievement
  IF total_refs = 1 THEN
    INSERT INTO referral_achievements (user_id, achievement_type, achievement_name, description, icon)
    VALUES (user_uuid, 'first_referral', 'Primeiro Amigo', 'Você indicou seu primeiro amigo!', '🎉')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 5 referrals achievement
  IF total_refs = 5 THEN
    INSERT INTO referral_achievements (user_id, achievement_type, achievement_name, description, icon)
    VALUES (user_uuid, 'five_referrals', 'Influenciador', 'Você indicou 5 amigos!', '⭐')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 10 referrals achievement
  IF total_refs = 10 THEN
    INSERT INTO referral_achievements (user_id, achievement_type, achievement_name, description, icon)
    VALUES (user_uuid, 'ten_referrals', 'Super Influenciador', 'Você indicou 10 amigos!', '🚀')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 25 referrals achievement
  IF total_refs = 25 THEN
    INSERT INTO referral_achievements (user_id, achievement_type, achievement_name, description, icon)
    VALUES (user_uuid, 'twentyfive_referrals', 'Embaixador Uppi', 'Você indicou 25 amigos!', '👑')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 50 referrals achievement
  IF total_refs = 50 THEN
    INSERT INTO referral_achievements (user_id, achievement_type, achievement_name, description, icon)
    VALUES (user_uuid, 'fifty_referrals', 'Lenda Uppi', 'Você indicou 50 amigos! Incrível!', '💎')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing users with referral codes
UPDATE profiles SET referral_code = NULL WHERE referral_code IS NULL;
