-- Script para criar sistema de rotas populares usadas por motoristas
-- Inspirado na funcionalidade do app 99

-- Tabela para rastrear segmentos de rotas usados por motoristas
CREATE TABLE IF NOT EXISTS driver_route_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  
  -- Origem e destino do segmento
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lng DECIMAL(11, 8) NOT NULL,
  origin_address TEXT NOT NULL,
  
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  
  -- Dados da rota usada
  route_polyline TEXT NOT NULL, -- Polyline encoded da rota
  distance_km DECIMAL(10, 2) NOT NULL,
  duration_min INTEGER NOT NULL,
  traffic_level TEXT CHECK (traffic_level IN ('low', 'moderate', 'heavy', 'very_heavy')) DEFAULT 'moderate',
  
  -- Dados de performance
  fuel_efficiency DECIMAL(5, 2), -- km/l estimado
  cost_per_km DECIMAL(5, 2), -- Custo por km
  toll_count INTEGER DEFAULT 0, -- Número de pedágios
  toll_cost DECIMAL(10, 2) DEFAULT 0, -- Custo total de pedágios
  
  -- Classificação da rota
  route_quality INTEGER CHECK (route_quality BETWEEN 1 AND 5), -- Qualidade da rota (1-5)
  road_conditions TEXT CHECK (road_conditions IN ('excellent', 'good', 'fair', 'poor')),
  safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5), -- Segurança (1-5)
  
  -- Contexto temporal
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night', 'dawn')),
  day_of_week TEXT CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para busca geográfica
  CONSTRAINT valid_coordinates CHECK (
    origin_lat BETWEEN -90 AND 90 AND
    origin_lng BETWEEN -180 AND 180 AND
    destination_lat BETWEEN -90 AND 90 AND
    destination_lng BETWEEN -180 AND 180
  )
);

-- Tabela agregada de rotas populares (atualizada periodicamente)
CREATE TABLE IF NOT EXISTS popular_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Área geográfica (definida por bounding box)
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lng DECIMAL(11, 8) NOT NULL,
  origin_address TEXT NOT NULL,
  origin_radius_km DECIMAL(5, 2) DEFAULT 0.5, -- Raio de tolerância
  
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_radius_km DECIMAL(5, 2) DEFAULT 0.5,
  
  -- Rota mais popular (baseada em uso)
  recommended_polyline TEXT NOT NULL,
  avg_distance_km DECIMAL(10, 2) NOT NULL,
  avg_duration_min INTEGER NOT NULL,
  
  -- Estatísticas de uso
  usage_count INTEGER DEFAULT 0, -- Quantas vezes foi usada
  unique_drivers INTEGER DEFAULT 0, -- Quantos motoristas diferentes
  avg_rating DECIMAL(3, 2), -- Avaliação média da rota
  
  -- Melhores horários
  best_time_of_day TEXT[],
  worst_time_of_day TEXT[],
  
  -- Contexto
  avg_traffic_level TEXT,
  has_tolls BOOLEAN DEFAULT FALSE,
  avg_toll_cost DECIMAL(10, 2) DEFAULT 0,
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_route_segments_driver ON driver_route_segments(driver_id);
CREATE INDEX IF NOT EXISTS idx_route_segments_ride ON driver_route_segments(ride_id);
CREATE INDEX IF NOT EXISTS idx_route_segments_time ON driver_route_segments(time_of_day, day_of_week);
CREATE INDEX IF NOT EXISTS idx_route_segments_created ON driver_route_segments(created_at DESC);

-- Índices geográficos usando PostGIS
CREATE INDEX IF NOT EXISTS idx_route_segments_origin_geo 
ON driver_route_segments USING GIST (
  ST_SetSRID(ST_MakePoint(origin_lng, origin_lat), 4326)
);

CREATE INDEX IF NOT EXISTS idx_route_segments_dest_geo 
ON driver_route_segments USING GIST (
  ST_SetSRID(ST_MakePoint(destination_lng, destination_lat), 4326)
);

CREATE INDEX IF NOT EXISTS idx_popular_routes_origin_geo 
ON popular_routes USING GIST (
  ST_SetSRID(ST_MakePoint(origin_lng, origin_lat), 4326)
);

CREATE INDEX IF NOT EXISTS idx_popular_routes_dest_geo 
ON popular_routes USING GIST (
  ST_SetSRID(ST_MakePoint(destination_lng, destination_lat), 4326)
);

CREATE INDEX IF NOT EXISTS idx_popular_routes_usage ON popular_routes(usage_count DESC);

-- Função para encontrar rotas populares próximas
CREATE OR REPLACE FUNCTION get_popular_routes_nearby(
  p_origin_lat DECIMAL,
  p_origin_lng DECIMAL,
  p_dest_lat DECIMAL,
  p_dest_lng DECIMAL,
  p_radius_km DECIMAL DEFAULT 2.0
)
RETURNS TABLE (
  route_id UUID,
  origin_address TEXT,
  destination_address TEXT,
  polyline TEXT,
  avg_distance_km DECIMAL,
  avg_duration_min INTEGER,
  usage_count INTEGER,
  unique_drivers INTEGER,
  avg_rating DECIMAL,
  has_tolls BOOLEAN,
  avg_toll_cost DECIMAL,
  best_times TEXT[],
  distance_from_origin_km DECIMAL,
  distance_from_dest_km DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.origin_address,
    pr.destination_address,
    pr.recommended_polyline,
    pr.avg_distance_km,
    pr.avg_duration_min,
    pr.usage_count,
    pr.unique_drivers,
    pr.avg_rating,
    pr.has_tolls,
    pr.avg_toll_cost,
    pr.best_time_of_day,
    -- Calcular distância da origem
    (ST_Distance(
      ST_SetSRID(ST_MakePoint(pr.origin_lng, pr.origin_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography
    ) / 1000) AS distance_from_origin_km,
    -- Calcular distância do destino
    (ST_Distance(
      ST_SetSRID(ST_MakePoint(pr.destination_lng, pr.destination_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography
    ) / 1000) AS distance_from_dest_km
  FROM popular_routes pr
  WHERE 
    -- Origem dentro do raio
    ST_DWithin(
      ST_SetSRID(ST_MakePoint(pr.origin_lng, pr.origin_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography,
      p_radius_km * 1000
    )
    AND
    -- Destino dentro do raio
    ST_DWithin(
      ST_SetSRID(ST_MakePoint(pr.destination_lng, pr.destination_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography,
      p_radius_km * 1000
    )
  ORDER BY pr.usage_count DESC, pr.avg_rating DESC NULLS LAST
  LIMIT 5;
END;
$$;

-- Função para registrar segmento de rota após corrida
CREATE OR REPLACE FUNCTION record_driver_route_segment(
  p_driver_id UUID,
  p_ride_id UUID,
  p_origin_lat DECIMAL,
  p_origin_lng DECIMAL,
  p_origin_address TEXT,
  p_dest_lat DECIMAL,
  p_dest_lng DECIMAL,
  p_dest_address TEXT,
  p_polyline TEXT,
  p_distance_km DECIMAL,
  p_duration_min INTEGER,
  p_traffic_level TEXT DEFAULT 'moderate',
  p_route_quality INTEGER DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_segment_id UUID;
  v_time_of_day TEXT;
  v_day_of_week TEXT;
BEGIN
  -- Determinar período do dia
  v_time_of_day := CASE 
    WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 5 AND 11 THEN 'morning'
    WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 12 AND 17 THEN 'afternoon'
    WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 18 AND 21 THEN 'evening'
    WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 22 AND 23 OR EXTRACT(HOUR FROM NOW()) BETWEEN 0 AND 4 THEN 'night'
    ELSE 'dawn'
  END;
  
  -- Determinar dia da semana
  v_day_of_week := LOWER(TO_CHAR(NOW(), 'Day'));
  
  -- Inserir segmento
  INSERT INTO driver_route_segments (
    driver_id, ride_id,
    origin_lat, origin_lng, origin_address,
    destination_lat, destination_lng, destination_address,
    route_polyline, distance_km, duration_min,
    traffic_level, route_quality,
    time_of_day, day_of_week
  ) VALUES (
    p_driver_id, p_ride_id,
    p_origin_lat, p_origin_lng, p_origin_address,
    p_dest_lat, p_dest_lng, p_dest_address,
    p_polyline, p_distance_km, p_duration_min,
    p_traffic_level, p_route_quality,
    v_time_of_day, v_day_of_week
  )
  RETURNING id INTO v_segment_id;
  
  RETURN v_segment_id;
END;
$$;

-- Função para atualizar rotas populares (rodar periodicamente via cron)
CREATE OR REPLACE FUNCTION update_popular_routes()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Limpar rotas populares antigas
  DELETE FROM popular_routes 
  WHERE last_updated < NOW() - INTERVAL '7 days';
  
  -- Inserir/atualizar rotas populares baseadas em segmentos
  INSERT INTO popular_routes (
    origin_lat, origin_lng, origin_address,
    destination_lat, destination_lng, destination_address,
    recommended_polyline,
    avg_distance_km, avg_duration_min,
    usage_count, unique_drivers, avg_rating,
    best_time_of_day, avg_traffic_level, has_tolls, avg_toll_cost
  )
  SELECT 
    -- Agregar origem (média de coordenadas próximas)
    AVG(origin_lat) AS origin_lat,
    AVG(origin_lng) AS origin_lng,
    MODE() WITHIN GROUP (ORDER BY origin_address) AS origin_address,
    
    -- Agregar destino
    AVG(destination_lat) AS destination_lat,
    AVG(destination_lng) AS destination_lng,
    MODE() WITHIN GROUP (ORDER BY destination_address) AS destination_address,
    
    -- Rota mais usada (polyline mais comum)
    MODE() WITHIN GROUP (ORDER BY route_polyline) AS recommended_polyline,
    
    -- Estatísticas
    AVG(distance_km) AS avg_distance_km,
    AVG(duration_min)::INTEGER AS avg_duration_min,
    COUNT(*) AS usage_count,
    COUNT(DISTINCT driver_id) AS unique_drivers,
    AVG(route_quality) AS avg_rating,
    
    -- Melhores horários
    ARRAY_AGG(DISTINCT time_of_day ORDER BY time_of_day) AS best_time_of_day,
    MODE() WITHIN GROUP (ORDER BY traffic_level) AS avg_traffic_level,
    BOOL_OR(toll_count > 0) AS has_tolls,
    AVG(COALESCE(toll_cost, 0)) AS avg_toll_cost
  FROM driver_route_segments
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY 
    -- Agrupar por origem/destino aproximados (arredondamento)
    ROUND(origin_lat::NUMERIC, 3),
    ROUND(origin_lng::NUMERIC, 3),
    ROUND(destination_lat::NUMERIC, 3),
    ROUND(destination_lng::NUMERIC, 3)
  HAVING COUNT(*) >= 5 -- Mínimo 5 usos para ser considerado popular
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$;

-- RLS Policies
ALTER TABLE driver_route_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_routes ENABLE ROW LEVEL SECURITY;

-- Motoristas podem criar seus próprios segmentos
CREATE POLICY "Drivers can insert their own route segments"
  ON driver_route_segments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

-- Motoristas podem ver seus próprios segmentos
CREATE POLICY "Drivers can view their own route segments"
  ON driver_route_segments FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

-- Todos podem ver rotas populares
CREATE POLICY "Everyone can view popular routes"
  ON popular_routes FOR SELECT
  TO authenticated
  USING (true);

-- Service role pode gerenciar tudo
CREATE POLICY "Service role can manage route segments"
  ON driver_route_segments FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can manage popular routes"
  ON popular_routes FOR ALL
  TO service_role
  USING (true);

-- Comentários
COMMENT ON TABLE driver_route_segments IS 'Armazena segmentos de rotas usadas por motoristas para análise e recomendação';
COMMENT ON TABLE popular_routes IS 'Rotas populares agregadas baseadas em uso real de motoristas';
COMMENT ON FUNCTION get_popular_routes_nearby IS 'Busca rotas populares próximas a origem/destino especificados';
COMMENT ON FUNCTION record_driver_route_segment IS 'Registra um segmento de rota usado por motorista após corrida';
COMMENT ON FUNCTION update_popular_routes IS 'Atualiza tabela de rotas populares baseada em dados recentes';
