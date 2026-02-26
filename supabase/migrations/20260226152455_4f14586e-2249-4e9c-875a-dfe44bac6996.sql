
-- Create a secure view that masks phone_number for other users
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT
  id, user_id, church_id, username, first_name, last_name, avatar_url,
  bio, instagram_handle, show_phone_number, is_private, is_email_verified,
  onboarding_complete, streak_current, streak_longest, challenges_completed,
  created_at, updated_at,
  CASE
    WHEN user_id = auth.uid() THEN phone_number
    WHEN show_phone_number = true THEN phone_number
    ELSE NULL
  END AS phone_number
FROM public.profiles;
