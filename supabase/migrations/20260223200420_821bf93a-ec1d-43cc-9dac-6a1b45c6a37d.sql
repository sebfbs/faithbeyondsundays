
-- Allow authenticated users to discover/search all profiles (for social follow feature)
CREATE POLICY "Authenticated users can search profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
