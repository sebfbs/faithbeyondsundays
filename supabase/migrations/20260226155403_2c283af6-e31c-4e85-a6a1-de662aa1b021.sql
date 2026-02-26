-- Remove the policy that lets all church members see prayers
DROP POLICY IF EXISTS "Members can view church prayer requests" ON public.prayer_requests;

-- Allow church leadership to see all prayers in their church
CREATE POLICY "Church admins can view all prayer requests"
  ON public.prayer_requests FOR SELECT
  USING (
    has_role_in_church(auth.uid(), church_id, 'admin'::app_role) OR
    has_role_in_church(auth.uid(), church_id, 'owner'::app_role) OR
    has_role_in_church(auth.uid(), church_id, 'pastor'::app_role)
  );