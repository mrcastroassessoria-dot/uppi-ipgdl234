-- =====================================================
-- HISTÓRICO DE ENDEREÇOS PESQUISADOS
-- Sistema de autocomplete inteligente tipo 99
-- =====================================================

-- Tabela de histórico de buscas de endereços
CREATE TABLE IF NOT EXISTS address_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados do endereço
  address TEXT NOT NULL,
  formatted_address TEXT NOT NULL,
  place_id TEXT,
  
  -- Localização
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  
  -- Componentes para busca inteligente
  street_name TEXT, -- Ex: "Travessa Uruguai"
  street_number TEXT, -- Ex: "2671"
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Tipo de uso
  address_type TEXT CHECK (address_type IN ('origin', 'destination', 'stop')),
  
  -- Estatísticas
  search_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_user_address UNIQUE (user_id, place_id)
);

-- Índices para busca rápida
CREATE INDEX idx_address_history_user ON address_search_history(user_id);
CREATE INDEX idx_address_history_last_used ON address_search_history(user_id, last_used_at DESC);
CREATE INDEX idx_address_history_count ON address_search_history(user_id, search_count DESC);
CREATE INDEX idx_address_history_location ON address_search_history USING GIST(location);

-- Índice para busca textual (GIN)
CREATE INDEX idx_address_history_search ON address_search_history USING GIN(
  to_tsvector('portuguese', 
    COALESCE(street_name, '') || ' ' || 
    COALESCE(street_number, '') || ' ' || 
    COALESCE(neighborhood, '') || ' ' ||
    COALESCE(formatted_address, '')
  )
);

-- =====================================================
-- FUNÇÃO: Registrar busca de endereço
-- =====================================================
CREATE OR REPLACE FUNCTION record_address_search(
  p_user_id UUID,
  p_address TEXT,
  p_formatted_address TEXT,
  p_place_id TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_street_name TEXT DEFAULT NULL,
  p_street_number TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_address_type TEXT DEFAULT 'destination'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_location GEOGRAPHY;
BEGIN
  -- Criar ponto geográfico
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  END IF;
  
  -- Inserir ou atualizar
  INSERT INTO address_search_history (
    user_id, address, formatted_address, place_id,
    lat, lng, location,
    street_name, street_number, neighborhood, city, state, postal_code,
    address_type, search_count, last_used_at
  ) VALUES (
    p_user_id, p_address, p_formatted_address, p_place_id,
    p_lat, p_lng, v_location,
    p_street_name, p_street_number, p_neighborhood, p_city, p_state, p_postal_code,
    p_address_type, 1, NOW()
  )
  ON CONFLICT (user_id, place_id) 
  DO UPDATE SET
    search_count = address_search_history.search_count + 1,
    last_used_at = NOW(),
    address_type = p_address_type
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: Buscar endereços no histórico
-- =====================================================
CREATE OR REPLACE FUNCTION search_address_history(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  id UUID,
  address TEXT,
  formatted_address TEXT,
  place_id TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  street_name TEXT,
  street_number TEXT,
  neighborhood TEXT,
  search_count INTEGER,
  last_used_at TIMESTAMPTZ,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.address,
    h.formatted_address,
    h.place_id,
    h.lat,
    h.lng,
    h.street_name,
    h.street_number,
    h.neighborhood,
    h.search_count,
    h.last_used_at,
    (
      -- Score baseado em:
      -- 1. Similaridade textual (60%)
      -- 2. Frequência de uso (30%)
      -- 3. Recência (10%)
      (similarity(LOWER(p_query), LOWER(h.formatted_address)) * 0.6) +
      (LEAST(h.search_count::REAL / 10.0, 1.0) * 0.3) +
      (EXTRACT(EPOCH FROM (NOW() - h.last_used_at)) / -86400.0 / 30.0 * 0.1)
    )::REAL as relevance_score
  FROM address_search_history h
  WHERE 
    h.user_id = p_user_id
    AND (
      -- Busca por texto completo
      to_tsvector('portuguese', 
        COALESCE(h.street_name, '') || ' ' || 
        COALESCE(h.street_number, '') || ' ' || 
        COALESCE(h.neighborhood, '') || ' ' ||
        COALESCE(h.formatted_address, '')
      ) @@ plainto_tsquery('portuguese', p_query)
      OR
      -- Busca por número exato
      h.street_number = p_query
      OR
      -- Busca por similaridade
      similarity(LOWER(p_query), LOWER(h.formatted_address)) > 0.2
      OR
      similarity(LOWER(p_query), LOWER(COALESCE(h.street_name, ''))) > 0.3
    )
  ORDER BY relevance_score DESC, h.last_used_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: Top endereços mais usados
-- =====================================================
CREATE OR REPLACE FUNCTION get_top_addresses(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  address TEXT,
  formatted_address TEXT,
  place_id TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  street_name TEXT,
  street_number TEXT,
  neighborhood TEXT,
  search_count INTEGER,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.address,
    h.formatted_address,
    h.place_id,
    h.lat,
    h.lng,
    h.street_name,
    h.street_number,
    h.neighborhood,
    h.search_count,
    h.last_used_at
  FROM address_search_history h
  WHERE h.user_id = p_user_id
  ORDER BY h.search_count DESC, h.last_used_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE address_search_history ENABLE ROW LEVEL SECURITY;

-- Usuários só veem seu próprio histórico
CREATE POLICY "Users can view own address history"
  ON address_search_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem inserir no próprio histórico
CREATE POLICY "Users can insert own address history"
  ON address_search_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar próprio histórico
CREATE POLICY "Users can update own address history"
  ON address_search_history FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Usuários podem deletar próprio histórico
CREATE POLICY "Users can delete own address history"
  ON address_search_history FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Habilitar extensão pg_trgm para similaridade
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON TABLE address_search_history IS 'Histórico de endereços pesquisados para autocomplete inteligente';
COMMENT ON FUNCTION record_address_search IS 'Registra ou atualiza uma busca de endereço no histórico do usuário';
COMMENT ON FUNCTION search_address_history IS 'Busca no histórico de endereços com ranking por relevância';
COMMENT ON FUNCTION get_top_addresses IS 'Retorna os endereços mais usados pelo usuário';
