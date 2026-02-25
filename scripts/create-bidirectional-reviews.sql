-- Sistema de Avaliações Bidirecionais
-- Passageiros avaliam motoristas E motoristas avaliam passageiros

-- Criar tabela de reviews (já existe ratings, vamos expandir)
CREATE TABLE IF NOT EXISTS driver_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Review do passageiro sobre o motorista
  passenger_rating INT CHECK (passenger_rating >= 1 AND passenger_rating <= 5),
  passenger_comment TEXT,
  passenger_tags TEXT[], -- ['pontual', 'educado', 'carro_limpo', 'direcao_segura']
  passenger_reviewed_at TIMESTAMPTZ,
  
  -- Review do motorista sobre o passageiro
  driver_rating INT CHECK (driver_rating >= 1 AND driver_rating <= 5),
  driver_comment TEXT,
  driver_tags TEXT[], -- ['educado', 'pontual', 'respeitoso', 'conversou_bem']
  driver_reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que cada corrida tenha apenas um review
  UNIQUE(ride_id)
);

-- Indexes
CREATE INDEX idx_driver_reviews_driver ON driver_reviews(driver_id);
CREATE INDEX idx_driver_reviews_passenger ON driver_reviews(passenger_id);
CREATE INDEX idx_driver_reviews_ride ON driver_reviews(ride_id);

-- RLS Policies
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;

-- Passageiros podem ver suas próprias reviews
CREATE POLICY "Passengers can view their reviews"
  ON driver_reviews FOR SELECT
  USING (passenger_id = auth.uid());

-- Motoristas podem ver suas próprias reviews  
CREATE POLICY "Drivers can view their reviews"
  ON driver_reviews FOR SELECT
  USING (driver_id = auth.uid());

-- Passageiros podem criar/atualizar review do motorista
CREATE POLICY "Passengers can review drivers"
  ON driver_reviews FOR INSERT
  WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "Passengers can update their driver reviews"
  ON driver_reviews FOR UPDATE
  USING (passenger_id = auth.uid())
  WITH CHECK (passenger_id = auth.uid());

-- Motoristas podem criar/atualizar review do passageiro
CREATE POLICY "Drivers can review passengers"
  ON driver_reviews FOR UPDATE
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_driver_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER driver_reviews_updated_at
  BEFORE UPDATE ON driver_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_reviews_updated_at();

-- Função para calcular estatísticas de reviews
CREATE OR REPLACE FUNCTION get_review_stats(entity_type TEXT, entity_id UUID)
RETURNS TABLE (
  avg_rating NUMERIC,
  total_reviews BIGINT,
  rating_1 BIGINT,
  rating_2 BIGINT,
  rating_3 BIGINT,
  rating_4 BIGINT,
  rating_5 BIGINT,
  top_tags TEXT[]
) AS $$
BEGIN
  IF entity_type = 'driver' THEN
    RETURN QUERY
    SELECT 
      ROUND(AVG(passenger_rating), 2) as avg_rating,
      COUNT(passenger_rating) as total_reviews,
      COUNT(*) FILTER (WHERE passenger_rating = 1) as rating_1,
      COUNT(*) FILTER (WHERE passenger_rating = 2) as rating_2,
      COUNT(*) FILTER (WHERE passenger_rating = 3) as rating_3,
      COUNT(*) FILTER (WHERE passenger_rating = 4) as rating_4,
      COUNT(*) FILTER (WHERE passenger_rating = 5) as rating_5,
      (
        SELECT ARRAY_AGG(tag ORDER BY count DESC)
        FROM (
          SELECT UNNEST(passenger_tags) as tag, COUNT(*) as count
          FROM driver_reviews
          WHERE driver_id = entity_id AND passenger_tags IS NOT NULL
          GROUP BY tag
          ORDER BY count DESC
          LIMIT 5
        ) top_tags_subquery
      ) as top_tags
    FROM driver_reviews
    WHERE driver_id = entity_id AND passenger_rating IS NOT NULL;
    
  ELSIF entity_type = 'passenger' THEN
    RETURN QUERY
    SELECT 
      ROUND(AVG(driver_rating), 2) as avg_rating,
      COUNT(driver_rating) as total_reviews,
      COUNT(*) FILTER (WHERE driver_rating = 1) as rating_1,
      COUNT(*) FILTER (WHERE driver_rating = 2) as rating_2,
      COUNT(*) FILTER (WHERE driver_rating = 3) as rating_3,
      COUNT(*) FILTER (WHERE driver_rating = 4) as rating_4,
      COUNT(*) FILTER (WHERE driver_rating = 5) as rating_5,
      (
        SELECT ARRAY_AGG(tag ORDER BY count DESC)
        FROM (
          SELECT UNNEST(driver_tags) as tag, COUNT(*) as count
          FROM driver_reviews
          WHERE passenger_id = entity_id AND driver_tags IS NOT NULL
          GROUP BY tag
          ORDER BY count DESC
          LIMIT 5
        ) top_tags_subquery
      ) as top_tags
    FROM driver_reviews
    WHERE passenger_id = entity_id AND driver_rating IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para obter reviews pendentes de uma corrida
CREATE OR REPLACE FUNCTION get_pending_reviews(user_id_param UUID)
RETURNS TABLE (
  ride_id UUID,
  review_id UUID,
  needs_passenger_review BOOLEAN,
  needs_driver_review BOOLEAN,
  ride_completed_at TIMESTAMPTZ,
  other_party_name TEXT,
  other_party_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as ride_id,
    dr.id as review_id,
    (dr.passenger_reviewed_at IS NULL AND r.passenger_id = user_id_param) as needs_passenger_review,
    (dr.driver_reviewed_at IS NULL AND r.driver_id = user_id_param) as needs_driver_review,
    r.completed_at as ride_completed_at,
    CASE 
      WHEN r.passenger_id = user_id_param THEN p_driver.full_name
      ELSE p_passenger.full_name
    END as other_party_name,
    CASE 
      WHEN r.passenger_id = user_id_param THEN p_driver.avatar_url
      ELSE p_passenger.avatar_url
    END as other_party_avatar
  FROM rides r
  LEFT JOIN driver_reviews dr ON dr.ride_id = r.id
  LEFT JOIN profiles p_driver ON r.driver_id = p_driver.id
  LEFT JOIN profiles p_passenger ON r.passenger_id = p_passenger.id
  WHERE 
    r.status = 'completed'
    AND r.completed_at > NOW() - INTERVAL '7 days' -- Reviews válidos por 7 dias
    AND (
      (r.passenger_id = user_id_param AND (dr.id IS NULL OR dr.passenger_reviewed_at IS NULL))
      OR 
      (r.driver_id = user_id_param AND (dr.id IS NULL OR dr.driver_reviewed_at IS NULL))
    )
  ORDER BY r.completed_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE driver_reviews IS 'Sistema de avaliações bidirecionais entre passageiros e motoristas';
COMMENT ON FUNCTION get_review_stats IS 'Calcula estatísticas de avaliações para motoristas ou passageiros';
COMMENT ON FUNCTION get_pending_reviews IS 'Retorna corridas que ainda precisam de avaliação do usuário';
