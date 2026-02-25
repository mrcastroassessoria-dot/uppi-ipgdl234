-- =====================================================
-- UPPI - Funções e Triggers
-- Data: 19/02/2026
-- =====================================================

-- =====================================================
-- FUNÇÕES HELPER
-- =====================================================

-- Função: Buscar motoristas próximos
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  radius_km DECIMAL DEFAULT 5,
  vehicle_type_filter vehicle_type DEFAULT NULL
)
RETURNS TABLE (
  driver_id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  rating DECIMAL,
  distance_km DECIMAL,
  vehicle_id UUID,
  vehicle_type vehicle_type,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_plate TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS driver_id,
    u.id AS user_id,
    u.full_name,
    u.avatar_url,
    d.rating,
    ROUND(
      ST_Distance(
        d.current_location,
        ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography
      ) / 1000,
      2
    ) AS distance_km,
    v.id AS vehicle_id,
    v.vehicle_type,
    v.brand AS vehicle_brand,
    v.model AS vehicle_model,
    v.color AS vehicle_color,
    v.plate AS vehicle_plate
  FROM drivers d
  INNER JOIN users u ON d.user_id = u.id
  INNER JOIN vehicles v ON v.driver_id = d.id AND v.is_active = TRUE
  WHERE
    d.is_online = TRUE
    AND d.background_check_status = 'approved'
    AND u.status = 'active'
    AND ST_DWithin(
      d.current_location,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
      radius_km * 1000
    )
    AND (vehicle_type_filter IS NULL OR v.vehicle_type = vehicle_type_filter)
  ORDER BY distance_km ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Função: Calcular preço da corrida
CREATE OR REPLACE FUNCTION calculate_ride_price(
  distance_km DECIMAL,
  duration_minutes INTEGER,
  vehicle_type_param vehicle_type,
  is_surge BOOLEAN DEFAULT FALSE,
  surge_multiplier DECIMAL DEFAULT 1.0
)
RETURNS DECIMAL AS $$
DECLARE
  base_price DECIMAL := 5.00;
  price_per_km DECIMAL;
  price_per_minute DECIMAL := 0.50;
  min_price DECIMAL;
  calculated_price DECIMAL;
BEGIN
  -- Definir preços por tipo de veículo
  CASE vehicle_type_param
    WHEN 'economy' THEN
      price_per_km := 2.00;
      min_price := 8.00;
    WHEN 'comfort' THEN
      price_per_km := 2.50;
      min_price := 10.00;
    WHEN 'premium' THEN
      price_per_km := 4.00;
      min_price := 15.00;
    WHEN 'suv' THEN
      price_per_km := 3.50;
      min_price := 18.00;
    WHEN 'van' THEN
      price_per_km := 3.00;
      min_price := 20.00;
    WHEN 'moto' THEN
      price_per_km := 1.50;
      min_price := 6.00;
    ELSE
      price_per_km := 2.00;
      min_price := 8.00;
  END CASE;

  -- Calcular preço
  calculated_price := base_price + (distance_km * price_per_km) + (duration_minutes * price_per_minute);
  
  -- Aplicar surge pricing
  IF is_surge THEN
    calculated_price := calculated_price * surge_multiplier;
  END IF;
  
  -- Garantir preço mínimo
  IF calculated_price < min_price THEN
    calculated_price := min_price;
  END IF;
  
  RETURN ROUND(calculated_price, 2);
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar se localização está em zona quente
CREATE OR REPLACE FUNCTION check_hot_zone(
  lat DECIMAL,
  lng DECIMAL
)
RETURNS TABLE (
  hot_zone_id UUID,
  hot_zone_name TEXT,
  multiplier DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hz.id AS hot_zone_id,
    hz.name AS hot_zone_name,
    hz.multiplier
  FROM hot_zones hz
  WHERE
    hz.is_active = TRUE
    AND (hz.active_from IS NULL OR hz.active_from <= NOW())
    AND (hz.active_until IS NULL OR hz.active_until >= NOW())
    AND ST_DWithin(
      hz.center_location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      hz.radius_km * 1000
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ride_offers_updated_at BEFORE UPDATE ON ride_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON user_achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_comments_updated_at BEFORE UPDATE ON social_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_rides_updated_at BEFORE UPDATE ON group_rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hot_zones_updated_at BEFORE UPDATE ON hot_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Atualizar rating do motorista após review
CREATE OR REPLACE FUNCTION update_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivers
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE reviewed_id = NEW.reviewed_id
  )
  WHERE user_id = NEW.reviewed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_driver_rating
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_driver_rating();

-- Trigger: Atualizar estatísticas do motorista após corrida
CREATE OR REPLACE FUNCTION update_ride_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE drivers
    SET
      total_rides = total_rides + 1,
      total_earnings = total_earnings + COALESCE(NEW.final_price, 0)
    WHERE user_id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ride_statistics
AFTER UPDATE ON rides
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_ride_statistics();

-- Trigger: Atualizar contadores de likes em posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON social_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Trigger: Atualizar contadores de comentários em posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts
    SET comments_count = comments_count - 1
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON social_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Trigger: Incrementar uso de cupons
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE id = NEW.coupon_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_coupon_usage
AFTER INSERT ON coupon_usage
FOR EACH ROW
EXECUTE FUNCTION increment_coupon_usage();

-- Trigger: Incrementar uso de promoções
CREATE OR REPLACE FUNCTION increment_promotion_usage()
RETURNS TRIGGER AS $$
DECLARE
  promo_id UUID;
BEGIN
  -- Buscar promoção ativa aplicável
  SELECT id INTO promo_id
  FROM promotions
  WHERE is_active = TRUE
    AND NOW() BETWEEN valid_from AND valid_until
    AND (max_uses IS NULL OR current_uses < max_uses)
  LIMIT 1;
  
  IF promo_id IS NOT NULL THEN
    UPDATE promotions
    SET current_uses = current_uses + 1
    WHERE id = promo_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_promotion_usage
AFTER INSERT ON rides
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION increment_promotion_usage();

-- Trigger: Atualizar participantes de corrida compartilhada
CREATE OR REPLACE FUNCTION update_group_ride_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE group_rides
    SET current_participants = current_participants + 1
    WHERE id = NEW.group_ride_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled') THEN
    UPDATE group_rides
    SET current_participants = current_participants - 1
    WHERE id = COALESCE(NEW.group_ride_id, OLD.group_ride_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_ride_participants
AFTER INSERT OR UPDATE OR DELETE ON group_ride_participants
FOR EACH ROW
EXECUTE FUNCTION update_group_ride_participants();

-- Trigger: Criar configurações padrão para novo usuário
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_user_settings
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_settings();

-- Trigger: Gerar código de referral único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      -- Gerar código aleatório de 6 caracteres
      code := upper(substring(md5(random()::text) from 1 for 6));
      
      -- Verificar se já existe
      SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    NEW.referral_code := code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();
