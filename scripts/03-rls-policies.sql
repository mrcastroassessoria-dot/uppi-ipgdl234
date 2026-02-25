-- =====================================================
-- UPPI - Row Level Security (RLS) Policies
-- Data: 19/02/2026
-- =====================================================

-- Habilitar RLS em todas as tabelas
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ride_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
-- =====================================================

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view public user info"
  ON users FOR SELECT
  USING (true);

-- Políticas para PROFILES
-- =====================================================

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para DRIVERS
-- =====================================================

CREATE POLICY "Drivers can view their own data"
  ON drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own data"
  ON drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved drivers"
  ON drivers FOR SELECT
  USING (background_check_status = 'approved');

-- Políticas para VEHICLES
-- =====================================================

CREATE POLICY "Drivers can view their own vehicles"
  ON vehicles FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can insert their own vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update their own vehicles"
  ON vehicles FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active vehicles"
  ON vehicles FOR SELECT
  USING (is_active = true);

-- Políticas para RIDES
-- =====================================================

CREATE POLICY "Passengers can view their rides"
  ON rides FOR SELECT
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view assigned rides"
  ON rides FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Passengers can create rides"
  ON rides FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Passengers can update their rides"
  ON rides FOR UPDATE
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update assigned rides"
  ON rides FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Políticas para RIDE_OFFERS
-- =====================================================

CREATE POLICY "Drivers can view their offers"
  ON ride_offers FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Passengers can view offers for their rides"
  ON ride_offers FOR SELECT
  USING (
    ride_id IN (
      SELECT id FROM rides WHERE passenger_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can create offers"
  ON ride_offers FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update their offers"
  ON ride_offers FOR UPDATE
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Passengers can update offers for their rides"
  ON ride_offers FOR UPDATE
  USING (
    ride_id IN (
      SELECT id FROM rides WHERE passenger_id = auth.uid()
    )
  );

-- Políticas para RIDE_TRACKING
-- =====================================================

CREATE POLICY "Drivers can insert tracking for their rides"
  ON ride_tracking FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Passengers can view tracking for their rides"
  ON ride_tracking FOR SELECT
  USING (
    ride_id IN (
      SELECT id FROM rides WHERE passenger_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view tracking for their rides"
  ON ride_tracking FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Políticas para MESSAGES
-- =====================================================

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Políticas para REVIEWS
-- =====================================================

CREATE POLICY "Users can view reviews about them"
  ON reviews FOR SELECT
  USING (auth.uid() = reviewed_id);

CREATE POLICY "Users can view reviews they made"
  ON reviews FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Anyone can view all reviews"
  ON reviews FOR SELECT
  USING (true);

-- Políticas para WALLET_TRANSACTIONS
-- =====================================================

CREATE POLICY "Users can view their transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para COUPONS
-- =====================================================

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

-- Políticas para COUPON_USAGE
-- =====================================================

CREATE POLICY "Users can view their coupon usage"
  ON coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert coupon usage"
  ON coupon_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para ACHIEVEMENTS
-- =====================================================

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- Políticas para USER_ACHIEVEMENTS
-- =====================================================

CREATE POLICY "Users can view their achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para LEADERBOARD
-- =====================================================

CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Políticas para SOCIAL_POSTS
-- =====================================================

CREATE POLICY "Anyone can view posts"
  ON social_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their posts"
  ON social_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their posts"
  ON social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para SOCIAL_LIKES
-- =====================================================

CREATE POLICY "Anyone can view likes"
  ON social_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON social_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON social_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para SOCIAL_COMMENTS
-- =====================================================

CREATE POLICY "Anyone can view comments"
  ON social_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON social_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comments"
  ON social_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments"
  ON social_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para GROUP_RIDES
-- =====================================================

CREATE POLICY "Creators can view their group rides"
  ON group_rides FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Participants can view group rides"
  ON group_rides FOR SELECT
  USING (
    id IN (
      SELECT group_ride_id FROM group_ride_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create group rides"
  ON group_rides FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Políticas para GROUP_RIDE_PARTICIPANTS
-- =====================================================

CREATE POLICY "Participants can view group ride info"
  ON group_ride_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    group_ride_id IN (
      SELECT id FROM group_rides WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can join group rides"
  ON group_ride_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON group_ride_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para EMERGENCY_CONTACTS
-- =====================================================

CREATE POLICY "Users can view their emergency contacts"
  ON emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their emergency contacts"
  ON emergency_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para EMERGENCY_ALERTS
-- =====================================================

CREATE POLICY "Users can view their alerts"
  ON emergency_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create alerts"
  ON emergency_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para SUPPORT_TICKETS
-- =====================================================

CREATE POLICY "Users can view their tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their tickets"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para SUPPORT_MESSAGES
-- =====================================================

CREATE POLICY "Users can view messages in their tickets"
  ON support_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Políticas para REPORTS
-- =====================================================

CREATE POLICY "Users can view their reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id OR auth.uid() = reported_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Políticas para USER_SETTINGS
-- =====================================================

CREATE POLICY "Users can view their settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para SUBSCRIPTIONS
-- =====================================================

CREATE POLICY "Users can view their subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their subscriptions"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para PROMOTIONS
-- =====================================================

CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

-- Políticas para HOT_ZONES
-- =====================================================

CREATE POLICY "Anyone can view active hot zones"
  ON hot_zones FOR SELECT
  USING (is_active = true);

-- Políticas para NOTIFICATIONS
-- =====================================================

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
