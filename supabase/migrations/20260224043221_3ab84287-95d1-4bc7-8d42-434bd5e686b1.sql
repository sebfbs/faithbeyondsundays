
-- Create sermon_likes table
CREATE TABLE public.sermon_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sermon_id uuid NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  target_type text NOT NULL DEFAULT 'sermon',
  target_index integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sermon_likes_unique UNIQUE (sermon_id, user_id, target_type, target_index),
  CONSTRAINT sermon_likes_target_type_check CHECK (target_type IN ('sermon', 'takeaway'))
);

-- RLS
ALTER TABLE public.sermon_likes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read likes
CREATE POLICY "Authenticated users can read sermon likes"
  ON public.sermon_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own likes
CREATE POLICY "Users can insert their own likes"
  ON public.sermon_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON public.sermon_likes FOR DELETE
  USING (user_id = auth.uid());
