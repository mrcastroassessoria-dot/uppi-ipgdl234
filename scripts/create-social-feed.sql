-- Social Feed & Activity Sharing System
-- Permite usuários compartilhar economia, conquistas e atividades

-- Table: social_posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('savings_shared', 'achievement_unlocked', 'milestone_reached', 'ride_completed', 'club_joined')),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Metadata JSON
  metadata JSONB DEFAULT '{}'::jsonb,
  -- For savings_shared: { "amount": 25.50, "ride_count": 10, "comparison_service": "99" }
  -- For achievement_unlocked: { "achievement_id": "eco_warrior", "badge_url": "..." }
  -- For milestone_reached: { "milestone": "100_rides", "total_rides": 100 }
  
  -- Stats
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  
  -- Privacy
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: social_post_likes
CREATE TABLE IF NOT EXISTS social_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

-- Table: social_post_comments
CREATE TABLE IF NOT EXISTS social_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: social_follows
CREATE TABLE IF NOT EXISTS social_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Table: user_social_stats
CREATE TABLE IF NOT EXISTS user_social_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  total_likes_received INT DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(type);
CREATE INDEX IF NOT EXISTS idx_social_post_likes_post ON social_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_likes_user ON social_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_social_post_comments_post ON social_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_follower ON social_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_following ON social_follows(following_id);

-- RLS Policies
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_stats ENABLE ROW LEVEL SECURITY;

-- social_posts policies
CREATE POLICY "Users can view public posts" ON social_posts
  FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create their own posts" ON social_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON social_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON social_posts
  FOR DELETE USING (auth.uid() = user_id);

-- social_post_likes policies
CREATE POLICY "Anyone can view likes" ON social_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON social_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON social_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- social_post_comments policies
CREATE POLICY "Anyone can view comments" ON social_post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON social_post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comments" ON social_post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON social_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- social_follows policies
CREATE POLICY "Anyone can view follows" ON social_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON social_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON social_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- user_social_stats policies
CREATE POLICY "Anyone can view social stats" ON user_social_stats
  FOR SELECT USING (true);

-- Function: Get social feed for user
CREATE OR REPLACE FUNCTION get_social_feed(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  type TEXT,
  title TEXT,
  description TEXT,
  metadata JSONB,
  likes_count INT,
  comments_count INT,
  has_liked BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    p.full_name as user_name,
    p.avatar_url as user_avatar,
    sp.type,
    sp.title,
    sp.description,
    sp.metadata,
    sp.likes_count,
    sp.comments_count,
    EXISTS(SELECT 1 FROM social_post_likes spl WHERE spl.post_id = sp.id AND spl.user_id = p_user_id) as has_liked,
    sp.created_at
  FROM social_posts sp
  LEFT JOIN profiles p ON p.id = sp.user_id
  WHERE 
    sp.visibility = 'public' OR
    sp.user_id = p_user_id OR
    sp.user_id IN (SELECT following_id FROM social_follows WHERE follower_id = p_user_id)
  ORDER BY sp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    UPDATE user_social_stats SET total_likes_received = total_likes_received + 1 
    WHERE user_id = (SELECT user_id FROM social_posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    UPDATE user_social_stats SET total_likes_received = GREATEST(0, total_likes_received - 1)
    WHERE user_id = (SELECT user_id FROM social_posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON social_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger: Update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON social_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger: Update follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert stats if not exists
    INSERT INTO user_social_stats (user_id) VALUES (NEW.follower_id) ON CONFLICT DO NOTHING;
    INSERT INTO user_social_stats (user_id) VALUES (NEW.following_id) ON CONFLICT DO NOTHING;
    
    UPDATE user_social_stats SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    UPDATE user_social_stats SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_social_stats SET following_count = GREATEST(0, following_count - 1) WHERE user_id = OLD.follower_id;
    UPDATE user_social_stats SET followers_count = GREATEST(0, followers_count - 1) WHERE user_id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follow_counts
AFTER INSERT OR DELETE ON social_follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
