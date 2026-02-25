-- Uppi Database Schema - Seed Data

-- Insert sample achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points, badge_color) VALUES
  ('Primeira Corrida', 'Complete sua primeira corrida', '🚗', 'rides', 'total_rides', 1, 10, '#4CAF50'),
  ('10 Corridas', 'Complete 10 corridas', '⭐', 'rides', 'total_rides', 10, 50, '#2196F3'),
  ('50 Corridas', 'Complete 50 corridas', '🏆', 'rides', 'total_rides', 50, 200, '#FF9800'),
  ('100 Corridas', 'Complete 100 corridas', '👑', 'rides', 'total_rides', 100, 500, '#9C27B0'),
  ('500 Corridas', 'Complete 500 corridas', '💎', 'rides', 'total_rides', 500, 2000, '#FFD700'),
  ('Madrugador', 'Complete 5 corridas antes das 6h', '🌅', 'rides', 'early_morning_rides', 5, 100, '#FF5722'),
  ('Noturno', 'Complete 10 corridas após 22h', '🌙', 'rides', 'night_rides', 10, 100, '#673AB7'),
  ('Fim de Semana', 'Complete 20 corridas no fim de semana', '🎉', 'rides', 'weekend_rides', 20, 150, '#E91E63'),
  ('Avaliação 5 Estrelas', 'Mantenha avaliação 5.0 por 10 corridas', '⭐⭐⭐⭐⭐', 'social', 'perfect_rating_streak', 10, 300, '#FFD700'),
  ('Social', 'Faça 5 posts no feed', '📱', 'social', 'total_posts', 5, 50, '#00BCD4'),
  ('Influencer', 'Receba 100 likes', '❤️', 'social', 'total_likes', 100, 200, '#F44336'),
  ('Indicador', 'Indique 5 amigos', '🤝', 'social', 'successful_referrals', 5, 250, '#4CAF50'),
  ('Ganhos R$ 100', 'Ganhe R$ 100', '💰', 'earnings', 'total_earnings', 10000, 100, '#4CAF50'),
  ('Ganhos R$ 500', 'Ganhe R$ 500', '💵', 'earnings', 'total_earnings', 50000, 500, '#2196F3'),
  ('Ganhos R$ 1000', 'Ganhe R$ 1000', '💸', 'earnings', 'total_earnings', 100000, 1000, '#FF9800'),
  ('Sequência 7 dias', 'Use o app por 7 dias consecutivos', '🔥', 'streak', 'consecutive_days', 7, 150, '#FF5722'),
  ('Sequência 30 dias', 'Use o app por 30 dias consecutivos', '🔥🔥', 'streak', 'consecutive_days', 30, 500, '#FF0000'),
  ('Explorador', 'Visite 10 bairros diferentes', '🗺️', 'rides', 'unique_neighborhoods', 10, 100, '#9C27B0'),
  ('Longa Distância', 'Complete uma corrida de mais de 50km', '🛣️', 'rides', 'long_distance_ride', 1, 150, '#607D8B'),
  ('Econômico', 'Use 5 cupons de desconto', '🎟️', 'rides', 'coupons_used', 5, 75, '#8BC34A');

-- Insert sample coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_ride_amount, max_discount_amount, valid_from, valid_until, max_uses, is_active, user_type) VALUES
  ('BEMVINDO', 'Desconto de boas-vindas para novos usuários', 'percentage', 50.00, 10.00, 20.00, NOW(), NOW() + INTERVAL '30 days', 1000, true, 'new'),
  ('PRIMEIRA', 'Primeira corrida grátis até R$ 15', 'fixed', 15.00, 0, 15.00, NOW(), NOW() + INTERVAL '60 days', 5000, true, 'new'),
  ('FIDELIDADE10', '10% de desconto', 'percentage', 10.00, 15.00, 10.00, NOW(), NOW() + INTERVAL '90 days', NULL, true, 'existing'),
  ('FIDELIDADE20', '20% de desconto', 'percentage', 20.00, 30.00, 20.00, NOW(), NOW() + INTERVAL '90 days', NULL, true, 'existing'),
  ('WEEKEND', 'Desconto de fim de semana', 'percentage', 15.00, 20.00, 15.00, NOW(), NOW() + INTERVAL '30 days', NULL, true, 'all'),
  ('BLACKFRIDAY', 'Black Friday - 50% OFF', 'percentage', 50.00, 25.00, 30.00, NOW(), NOW() + INTERVAL '7 days', 10000, true, 'all'),
  ('NATAL2024', 'Natal - R$ 10 OFF', 'fixed', 10.00, 20.00, 10.00, NOW(), NOW() + INTERVAL '15 days', 5000, true, 'all'),
  ('MOTORISTA50', 'Desconto especial para motoristas', 'percentage', 50.00, 10.00, 25.00, NOW(), NOW() + INTERVAL '60 days', 1000, true, 'driver');

-- Insert sample hot zones (São Paulo coordinates as examples)
INSERT INTO public.hot_zones (name, location, radius_km, surge_multiplier, is_active) VALUES
  ('Aeroporto Guarulhos', ST_SetSRID(ST_MakePoint(-46.473057, -23.435556), 4326), 2.0, 1.5, true),
  ('Aeroporto Congonhas', ST_SetSRID(ST_MakePoint(-46.656389, -23.626667), 4326), 1.5, 1.4, true),
  ('Av. Paulista', ST_SetSRID(ST_MakePoint(-46.656452, -23.561414), 4326), 1.0, 1.3, true),
  ('Shopping Eldorado', ST_SetSRID(ST_MakePoint(-46.697344, -23.574639), 4326), 0.8, 1.2, true),
  ('Vila Madalena', ST_SetSRID(ST_MakePoint(-46.687222, -23.547778), 4326), 1.0, 1.3, true),
  ('Morumbi Shopping', ST_SetSRID(ST_MakePoint(-46.699167, -23.625833), 4326), 0.8, 1.2, true),
  ('Parque Ibirapuera', ST_SetSRID(ST_MakePoint(-46.657778, -23.587500), 4326), 1.2, 1.1, true),
  ('Centro Histórico', ST_SetSRID(ST_MakePoint(-46.636111, -23.550833), 4326), 1.5, 1.2, true);

-- Function to create user profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, referral_code)
  VALUES (
    NEW.id,
    UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8))
  );
  
  -- Insert user settings
  INSERT INTO public.user_settings (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update user rating after review
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_reviews INTEGER;
BEGIN
  -- Calculate new average rating for reviewee
  SELECT AVG(rating), COUNT(*)
  INTO avg_rating, total_reviews
  FROM public.reviews
  WHERE reviewee_id = NEW.reviewee_id;
  
  -- Update profiles table
  UPDATE public.profiles
  SET rating = avg_rating
  WHERE id = NEW.reviewee_id;
  
  -- If reviewee is a driver, also update drivers table
  IF EXISTS (SELECT 1 FROM public.drivers WHERE id = NEW.reviewee_id) THEN
    UPDATE public.drivers
    SET rating = avg_rating
    WHERE id = NEW.reviewee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating when review is created
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating();

-- Function to increment rides count
CREATE OR REPLACE FUNCTION public.increment_rides_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment when ride is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update passenger profile
    UPDATE public.profiles
    SET total_rides = total_rides + 1,
        total_spent = total_spent + NEW.final_price
    WHERE id = NEW.passenger_id;
    
    -- Update driver data
    IF NEW.driver_id IS NOT NULL THEN
      UPDATE public.drivers
      SET total_rides = total_rides + 1,
          total_earnings = total_earnings + NEW.final_price
      WHERE id = NEW.driver_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment rides count
DROP TRIGGER IF EXISTS on_ride_completed ON public.rides;
CREATE TRIGGER on_ride_completed
  AFTER UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_rides_count();

-- Function to update social post counts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes count
DROP TRIGGER IF EXISTS update_likes_count ON public.social_post_likes;
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.social_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comments count
DROP TRIGGER IF EXISTS update_comments_count ON public.social_post_comments;
CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON public.social_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  achievement RECORD;
  user_progress INTEGER;
BEGIN
  FOR achievement IN SELECT * FROM public.achievements LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = achievement.id AND completed = true
    ) THEN
      -- Calculate progress based on requirement type
      CASE achievement.requirement_type
        WHEN 'total_rides' THEN
          SELECT total_rides INTO user_progress
          FROM public.profiles
          WHERE id = p_user_id;
          
        WHEN 'total_earnings' THEN
          SELECT (total_earnings * 100)::INTEGER INTO user_progress
          FROM public.drivers
          WHERE id = p_user_id;
          
        ELSE
          user_progress := 0;
      END CASE;
      
      -- Insert or update user achievement
      INSERT INTO public.user_achievements (user_id, achievement_id, progress, completed, completed_at)
      VALUES (
        p_user_id,
        achievement.id,
        user_progress,
        user_progress >= achievement.requirement_value,
        CASE WHEN user_progress >= achievement.requirement_value THEN NOW() ELSE NULL END
      )
      ON CONFLICT (user_id, achievement_id)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        completed = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create indexes for geospatial queries
CREATE INDEX IF NOT EXISTS idx_drivers_location_gist ON public.drivers USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_gist ON public.rides USING GIST(pickup_location);
CREATE INDEX IF NOT EXISTS idx_hot_zones_location_gist ON public.hot_zones USING GIST(location);
