
-- Add is_email_verified to profiles for the verified badge feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_email_verified boolean NOT NULL DEFAULT false;

-- Create trigger to auto-assign 'member' role when a profile is created
CREATE OR REPLACE FUNCTION public.auto_assign_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, church_id, role)
  VALUES (NEW.user_id, NEW.church_id, 'member')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_member_role();
