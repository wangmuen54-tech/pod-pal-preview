
-- Create podcast_entries table
CREATE TABLE public.podcast_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  show_name TEXT DEFAULT '',
  category TEXT,
  pinned BOOLEAN DEFAULT false,
  brief TEXT NOT NULL DEFAULT '',
  background TEXT,
  listen_guide JSONB DEFAULT '[]'::jsonb,
  key_people JSONB DEFAULT '[]'::jsonb,
  key_concepts JSONB DEFAULT '[]'::jsonb,
  key_events JSONB DEFAULT '[]'::jsonb,
  controversies JSONB DEFAULT '[]'::jsonb,
  related_resources JSONB DEFAULT '[]'::jsonb,
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.podcast_entries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own entries
CREATE POLICY "Users can view own entries"
  ON public.podcast_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert own entries"
  ON public.podcast_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own entries"
  ON public.podcast_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own entries"
  ON public.podcast_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
