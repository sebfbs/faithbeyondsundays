CREATE POLICY "Members can view roles in their church"
ON public.user_roles
FOR SELECT
USING (church_id = get_user_church_id(auth.uid()));