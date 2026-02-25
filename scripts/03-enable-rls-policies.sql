-- Uppi Database Schema - Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can do anything
CREATE POLICY "Service role full access to users"
  ON public.users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- PROFILES TABLE POLICIES
-- ========================================

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ========================================
-- DRIVERS TABLE POLICIES
-- ========================================

CREATE POLICY "Drivers can read own data"
  ON public.drivers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Drivers can update own data"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Drivers can insert own data"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can manage all drivers
CREATE POLICY "Admins can manage all drivers"
  ON public.drivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- DRIVER DOCUMENTS POLICIES
-- ========================================

CREATE POLICY "Drivers can read own documents"
  ON public.driver_documents FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can upload documents"
  ON public.driver_documents FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins can manage all documents"
  ON public.driver_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- VEHICLES POLICIES
-- ========================================

CREATE POLICY "Drivers can manage own vehicles"
  ON public.vehicles FOR ALL
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- ========================================
-- RIDES POLICIES
-- ========================================

-- Passengers can read their rides
CREATE POLICY "Passengers can read own rides"
  ON public.rides FOR SELECT
  USING (auth.uid() = passenger_id);

-- Drivers can read their rides
CREATE POLICY "Drivers can read assigned rides"
  ON public.rides FOR SELECT
  USING (auth.uid() = driver_id);

-- Passengers can create rides
CREATE POLICY "Passengers can create rides"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

-- Passengers can update their rides (before accepted)
CREATE POLICY "Passengers can update own rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = passenger_id);

-- Drivers can update assigned rides
CREATE POLICY "Drivers can update assigned rides"
  ON public.rides FOR UPDATE
  USING (auth.uid() = driver_id);

-- Admins can manage all rides
CREATE POLICY "Admins can manage all rides"
  ON public.rides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- RIDE OFFERS POLICIES
-- ========================================

-- Drivers can create offers
CREATE POLICY "Drivers can create offers"
  ON public.ride_offers FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Drivers can read their offers
CREATE POLICY "Drivers can read own offers"
  ON public.ride_offers FOR SELECT
  USING (auth.uid() = driver_id);

-- Passengers can read offers for their rides
CREATE POLICY "Passengers can read offers for own rides"
  ON public.ride_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_offers.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );

-- Passengers can update offers (accept/reject)
CREATE POLICY "Passengers can update offers for own rides"
  ON public.ride_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_offers.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );

-- ========================================
-- RIDE TRACKING POLICIES
-- ========================================

-- Passengers can read tracking for their rides
CREATE POLICY "Passengers can read tracking for own rides"
  ON public.ride_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_tracking.ride_id
      AND rides.passenger_id = auth.uid()
    )
  );

-- Drivers can insert and read tracking for assigned rides
CREATE POLICY "Drivers can manage tracking for assigned rides"
  ON public.ride_tracking FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_tracking.ride_id
      AND rides.driver_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_tracking.ride_id
      AND rides.driver_id = auth.uid()
    )
  );

-- ========================================
-- MESSAGES POLICIES
-- ========================================

-- Users can read their messages
CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update their messages (mark as read)
CREATE POLICY "Users can update received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- ========================================
-- REVIEWS POLICIES
-- ========================================

-- Users can read reviews about them
CREATE POLICY "Users can read reviews about them"
  ON public.reviews FOR SELECT
  USING (auth.uid() = reviewee_id);

-- Users can create reviews
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Admins can read all reviews
CREATE POLICY "Admins can read all reviews"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- WALLET TRANSACTIONS POLICIES
-- ========================================

CREATE POLICY "Users can read own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions"
  ON public.wallet_transactions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- FAVORITES POLICIES
-- ========================================

CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- ACHIEVEMENTS POLICIES
-- ========================================

CREATE POLICY "Everyone can read achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (true);

-- ========================================
-- USER ACHIEVEMENTS POLICIES
-- ========================================

CREATE POLICY "Users can read own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user achievements"
  ON public.user_achievements FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- LEADERBOARD POLICIES
-- ========================================

CREATE POLICY "Everyone can read leaderboard"
  ON public.leaderboard FOR SELECT
  TO authenticated
  USING (true);

-- ========================================
-- SOCIAL POSTS POLICIES
-- ========================================

CREATE POLICY "Users can read public posts"
  ON public.social_posts FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can read own posts"
  ON public.social_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.social_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- SOCIAL POST LIKES POLICIES
-- ========================================

CREATE POLICY "Users can read all likes"
  ON public.social_post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON public.social_post_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- SOCIAL POST COMMENTS POLICIES
-- ========================================

CREATE POLICY "Users can read all comments"
  ON public.social_post_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.social_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- REFERRALS POLICIES
-- ========================================

CREATE POLICY "Users can read own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Service role can manage referrals"
  ON public.referrals FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- COUPONS POLICIES
-- ========================================

CREATE POLICY "Everyone can read active coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- USER COUPONS POLICIES
-- ========================================

CREATE POLICY "Users can read own coupons"
  ON public.user_coupons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user coupons"
  ON public.user_coupons FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- SUBSCRIPTIONS POLICIES
-- ========================================

CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- EMERGENCY CONTACTS POLICIES
-- ========================================

CREATE POLICY "Users can manage own emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- NOTIFICATIONS POLICIES
-- ========================================

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ========================================
-- HOT ZONES POLICIES
-- ========================================

CREATE POLICY "Everyone can read active hot zones"
  ON public.hot_zones FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage hot zones"
  ON public.hot_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- EMERGENCY RECORDS POLICIES
-- ========================================

CREATE POLICY "Users can read own emergency records"
  ON public.emergency_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create emergency records"
  ON public.emergency_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage emergency records"
  ON public.emergency_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- USER SETTINGS POLICIES
-- ========================================

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
