
-- Explicitly deny INSERT for authenticated users on daily_content
-- Only service role (which bypasses RLS) should insert
CREATE POLICY "Deny authenticated inserts on daily content"
  ON public.daily_content FOR INSERT
  TO authenticated
  WITH CHECK (false);
