-- ============================================================
-- UPPI - Fase 3: Bidirectional reviews + enhanced reviews + social feed
-- ============================================================

-- ============================================================
-- Table 38: driver_reviews_of_passengers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_reviews_of_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id),
  passenger_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[],
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, driver_id)
);

ALTER TABLE public.driver_reviews_of_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "driver_reviews_select_driver" ON public.driver_reviews_of_passengers
  FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "driver_reviews_select_passenger" ON public.driver_reviews_of_passengers
  FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "driver_reviews_insert" ON public.driver_reviews_of_passengers
  FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "driver_reviews_update" ON public.driver_reviews_of_passengers
  FOR UPDATE USING (auth.uid() = driver_id);

-- Update passenger rating from driver review
CREATE OR REPLACE FUNCTION public.update_passenger_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET rating = (
    SELECT COALESCE(AVG(rating), 5.0)
    FROM (
      SELECT rating FROM public.ratings WHERE reviewed_id = NEW.passenger_id
      UNION ALL
      SELECT rating FROM public.driver_reviews_of_passengers WHERE passenger_id = NEW.passenger_id
    ) all_ratings
  )
  WHERE id = NEW.passenger_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_driver_review ON public.driver_reviews_of_passengers;
CREATE TRIGGER on_driver_review
  AFTER INSERT ON public.driver_reviews_of_passengers
  FOR EACH ROW EXECUTE FUNCTION public.update_passenger_rating();

-- ============================================================
-- Enhanced Reviews (3 tables)
-- ============================================================

-- Table 22: review_categories
CREATE TABLE IF NOT EXISTS public.review_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  applies_to TEXT CHECK (applies_to IN ('driver', 'passenger', 'both')),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);

ALTER TABLE public.review_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_categories_select" ON public.review_categories FOR SELECT USING (true);

-- Table 23: review_tags
CREATE TABLE IF NOT EXISTS public.review_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.review_categories(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_positive BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);

ALTER TABLE public.review_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_tags_select" ON public.review_tags FOR SELECT USING (true);

-- Table 24: enhanced_reviews
CREATE TABLE IF NOT EXISTS public.enhanced_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  category_ratings JSONB,
  selected_tags UUID[],
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, reviewer_id)
);

ALTER TABLE public.enhanced_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enhanced_reviews_select" ON public.enhanced_reviews
  FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id);
CREATE POLICY "enhanced_reviews_insert" ON public.enhanced_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- Social Feed (5 tables)
-- ============================================================

-- Table 14: social_posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('savings', 'achievement', 'ride_milestone', 'referral')),
  content TEXT,
  data JSONB,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_select_public" ON public.social_posts
  FOR SELECT USING (is_public = true);
CREATE POLICY "social_posts_insert_own" ON public.social_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "social_posts_update_own" ON public.social_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_created ON public.social_posts(created_at DESC);

-- Table 15: social_post_likes
CREATE TABLE IF NOT EXISTS public.social_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.social_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select" ON public.social_post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON public.social_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON public.social_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Like count triggers
CREATE OR REPLACE FUNCTION public.increment_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.social_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_like_insert ON public.social_post_likes;
CREATE TRIGGER on_like_insert
  AFTER INSERT ON public.social_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.increment_likes_count();

DROP TRIGGER IF EXISTS on_like_delete ON public.social_post_likes;
CREATE TRIGGER on_like_delete
  AFTER DELETE ON public.social_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_likes_count();

-- Table 16: social_post_comments
CREATE TABLE IF NOT EXISTS public.social_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON public.social_post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.social_post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON public.social_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Comment count trigger
CREATE OR REPLACE FUNCTION public.increment_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_insert ON public.social_post_comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.social_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.increment_comments_count();

-- Table 17: user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_icon TEXT,
  category TEXT CHECK (category IN ('rides', 'savings', 'social', 'rating')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  shared BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_select_own" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "achievements_insert" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "achievements_update_own" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Table 18: user_streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_ride_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select_own" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks_insert" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Check achievements function
CREATE OR REPLACE FUNCTION public.check_achievements(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ride_count INTEGER;
  total_savings DECIMAL;
  user_rating DECIMAL;
  new_achievements JSON[];
  result JSON;
BEGIN
  SELECT total_rides, rating INTO ride_count, user_rating
  FROM public.profiles WHERE id = user_uuid;

  SELECT COALESCE(SUM(passenger_price_offer - final_price), 0) INTO total_savings
  FROM public.rides
  WHERE passenger_id = user_uuid AND status = 'completed' AND final_price < passenger_price_offer;

  -- Return list of eligible achievements
  SELECT json_build_object(
    'ride_count', ride_count,
    'total_savings', total_savings,
    'user_rating', user_rating
  ) INTO result;

  RETURN result;
END;
$$;
