-- Wallet transactions table (para cashback, saldo, adicionar dinheiro)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'withdrawal', 'cashback', 'bonus', 'referral')),
  description TEXT NOT NULL,
  ride_id UUID REFERENCES rides(id),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User wallet balance (cache table para performance)
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_earned NUMERIC(10,2) DEFAULT 0.00,
  total_spent NUMERIC(10,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Coupons table (melhorar o sistema de cupons)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_ride_value NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  user_specific UUID REFERENCES auth.users(id),
  first_ride_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  discount_applied NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, user_id, ride_id)
);

-- Ride stops table (paradas multiplas)
CREATE TABLE IF NOT EXISTS ride_stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL,
  address TEXT NOT NULL,
  arrived_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_stops_ride ON ride_stops(ride_id, stop_order);

-- Enable RLS
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_stops ENABLE ROW LEVEL SECURITY;

-- RLS Policies: wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies: user_wallets
CREATE POLICY "Users can view own wallet" ON user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage wallets" ON user_wallets
  FOR ALL USING (true);

-- RLS Policies: coupons
CREATE POLICY "Users can view active coupons" ON coupons
  FOR SELECT USING (active = true);

-- RLS Policies: coupon_usage
CREATE POLICY "Users can view own coupon usage" ON coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can track coupon usage" ON coupon_usage
  FOR INSERT WITH CHECK (true);

-- RLS Policies: ride_stops
CREATE POLICY "Users can view stops for their rides" ON ride_stops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = ride_stops.ride_id
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can create stops for their rides" ON ride_stops
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = ride_stops.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );

-- Trigger to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Create wallet if doesn't exist
  INSERT INTO user_wallets (user_id, balance, total_earned, total_spent)
  VALUES (NEW.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update balance and totals
  IF NEW.type IN ('credit', 'cashback', 'bonus', 'referral', 'refund') THEN
    UPDATE user_wallets
    SET 
      balance = balance + NEW.amount,
      total_earned = total_earned + NEW.amount,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.type IN ('debit', 'withdrawal') THEN
    UPDATE user_wallets
    SET 
      balance = balance - NEW.amount,
      total_spent = total_spent + NEW.amount,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_wallet_balance_trigger
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

-- Trigger to increment coupon uses
CREATE OR REPLACE FUNCTION increment_coupon_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_coupon_uses_trigger
  AFTER INSERT ON coupon_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_coupon_uses();
