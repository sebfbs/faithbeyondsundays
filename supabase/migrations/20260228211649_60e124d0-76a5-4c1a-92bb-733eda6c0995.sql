CREATE POLICY "Admins can create jobs in their church"
  ON public.sermon_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role_in_church(auth.uid(), church_id, 'admin')
    OR public.has_role_in_church(auth.uid(), church_id, 'owner')
    OR public.has_role_in_church(auth.uid(), church_id, 'pastor')
  );