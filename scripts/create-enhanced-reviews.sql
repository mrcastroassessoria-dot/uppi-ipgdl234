-- Enhanced bidirectional review system with detailed feedback

-- Add detailed rating categories to ratings table
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS category_ratings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Table for rating category templates (different for driver vs passenger)
CREATE TABLE IF NOT EXISTS rating_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('driver', 'passenger')),
  category_key TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_type, category_key)
);

-- Insert default categories for drivers
INSERT INTO rating_categories (user_type, category_key, category_name, category_icon, display_order) VALUES
('driver', 'driving', 'Direção', '🚗', 1),
('driver', 'cleanliness', 'Limpeza', '✨', 2),
('driver', 'communication', 'Comunicação', '💬', 3),
('driver', 'route', 'Rota', '🗺️', 4),
('driver', 'safety', 'Segurança', '🛡️', 5)
ON CONFLICT (user_type, category_key) DO NOTHING;

-- Insert default categories for passengers
INSERT INTO rating_categories (user_type, category_key, category_name, category_icon, display_order) VALUES
('passenger', 'punctuality', 'Pontualidade', '⏰', 1),
('passenger', 'communication', 'Comunicação', '💬', 2),
('passenger', 'behavior', 'Comportamento', '🤝', 3),
('passenger', 'cleanliness', 'Limpeza', '✨', 4),
('passenger', 'payment', 'Pagamento', '💳', 5)
ON CONFLICT (user_type, category_key) DO NOTHING;

-- Table for review helpfulness votes
CREATE TABLE IF NOT EXISTS rating_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rating_id, user_id)
);

-- Table for review reports
CREATE TABLE IF NOT EXISTS rating_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rating_id, reporter_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rating_helpful_votes_rating ON rating_helpful_votes(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_reports_rating ON rating_reports(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_reports_status ON rating_reports(status);

-- Function to get rating summary for a user
CREATE OR REPLACE FUNCTION get_rating_summary(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'overall_rating', COALESCE(AVG(rating), 0),
    'total_reviews', COUNT(*),
    'five_star', COUNT(*) FILTER (WHERE rating = 5),
    'four_star', COUNT(*) FILTER (WHERE rating = 4),
    'three_star', COUNT(*) FILTER (WHERE rating = 3),
    'two_star', COUNT(*) FILTER (WHERE rating = 2),
    'one_star', COUNT(*) FILTER (WHERE rating = 1),
    'category_averages', (
      SELECT jsonb_object_agg(
        key,
        AVG((value::text)::numeric)
      )
      FROM ratings r,
      LATERAL jsonb_each_text(r.category_ratings)
      WHERE r.reviewed_id = user_uuid
    ),
    'common_tags', (
      SELECT jsonb_agg(DISTINCT tag)
      FROM ratings r,
      LATERAL unnest(r.tags) AS tag
      WHERE r.reviewed_id = user_uuid
      AND rating >= 4
      LIMIT 10
    )
  ) INTO result
  FROM ratings
  WHERE reviewed_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE rating_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote on ratings"
  ON rating_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view helpful votes"
  ON rating_helpful_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can report ratings"
  ON rating_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their reports"
  ON rating_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Trigger to update helpful_count
CREATE OR REPLACE FUNCTION update_rating_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ratings 
    SET helpful_count = helpful_count + CASE WHEN NEW.is_helpful THEN 1 ELSE -1 END
    WHERE id = NEW.rating_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE ratings 
    SET helpful_count = helpful_count + 
      CASE WHEN NEW.is_helpful THEN 1 ELSE -1 END -
      CASE WHEN OLD.is_helpful THEN 1 ELSE -1 END
    WHERE id = NEW.rating_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ratings 
    SET helpful_count = helpful_count - CASE WHEN OLD.is_helpful THEN 1 ELSE -1 END
    WHERE id = OLD.rating_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rating_helpful_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON rating_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_rating_helpful_count();

-- Trigger to update report_count
CREATE OR REPLACE FUNCTION update_rating_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ratings SET report_count = report_count + 1 WHERE id = NEW.rating_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ratings SET report_count = report_count - 1 WHERE id = OLD.rating_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rating_reports_trigger
AFTER INSERT OR DELETE ON rating_reports
FOR EACH ROW EXECUTE FUNCTION update_rating_report_count();

COMMENT ON TABLE rating_categories IS 'Templates de categorias de avaliação para motoristas e passageiros';
COMMENT ON TABLE rating_helpful_votes IS 'Votos de utilidade em avaliações (like/dislike)';
COMMENT ON TABLE rating_reports IS 'Denúncias de avaliações inadequadas';
