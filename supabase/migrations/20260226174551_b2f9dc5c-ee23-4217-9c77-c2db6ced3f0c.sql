CREATE POLICY "Church admins can update prayer requests"
ON public.prayer_requests
FOR UPDATE
TO authenticated
USING (
  has_role_in_church(auth.uid(), church_id, 'admin'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'owner'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'pastor'::app_role)
)
WITH CHECK (
  has_role_in_church(auth.uid(), church_id, 'admin'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'owner'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'pastor'::app_role)
);