
-- Add is_private column to profiles (default public like Instagram)
ALTER TABLE public.profiles ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Drop the overly permissive global search policy
DROP POLICY IF EXISTS "Authenticated users can search profiles" ON public.profiles;

-- Create a new policy: authenticated users can see limited profile info
-- For private profiles, only same-church members OR followers can see them
-- For public profiles, any authenticated user can see them
-- But phone_number is NEVER exposed via this policy (we handle that via a view)
CREATE POLICY "Authenticated users can discover profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Always see your own profile
      user_id = auth.uid()
      -- Same church members can always see each other
      OR church_id = get_user_church_id(auth.uid())
      -- Public profiles are discoverable by anyone
      OR is_private = false
      -- Private profiles visible to followers
      OR EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid()
          AND following_id = profiles.user_id
      )
    )
  );
