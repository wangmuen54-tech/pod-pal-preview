
-- Review items table
CREATE TABLE public.review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.podcast_entries(id) ON DELETE CASCADE,
  weight integer NOT NULL DEFAULT 0,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  review_count integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_id)
);

ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own review items" ON public.review_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own review items" ON public.review_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review items" ON public.review_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own review items" ON public.review_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Listen logs table
CREATE TABLE public.listen_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.listen_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own listen logs" ON public.listen_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own listen logs" ON public.listen_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listen logs" ON public.listen_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listen logs" ON public.listen_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Listen stats override table
CREATE TABLE public.listen_stats_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  minutes_offset integer NOT NULL DEFAULT 0,
  days_offset integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listen_stats_override ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats override" ON public.listen_stats_override FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats override" ON public.listen_stats_override FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats override" ON public.listen_stats_override FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stats override" ON public.listen_stats_override FOR DELETE TO authenticated USING (auth.uid() = user_id);
