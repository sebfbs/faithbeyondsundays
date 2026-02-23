CREATE TABLE public.daily_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_date date NOT NULL UNIQUE,
  spark_message text NOT NULL,
  reflection_prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily content"
  ON public.daily_content FOR SELECT
  USING (true);
