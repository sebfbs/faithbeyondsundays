
CREATE POLICY "Church admins can update sermon content"
  ON public.sermon_content FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sermons s
    WHERE s.id = sermon_content.sermon_id
    AND (has_role_in_church(auth.uid(), s.church_id, 'admin'::app_role) 
      OR has_role_in_church(auth.uid(), s.church_id, 'owner'::app_role)
      OR has_role_in_church(auth.uid(), s.church_id, 'pastor'::app_role))
  ));

CREATE POLICY "Church admins can delete sermon content"
  ON public.sermon_content FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sermons s
    WHERE s.id = sermon_content.sermon_id
    AND (has_role_in_church(auth.uid(), s.church_id, 'admin'::app_role)
      OR has_role_in_church(auth.uid(), s.church_id, 'owner'::app_role)
      OR has_role_in_church(auth.uid(), s.church_id, 'pastor'::app_role))
  ));

CREATE POLICY "Church admins can insert sermon content"
  ON public.sermon_content FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sermons s
    WHERE s.id = sermon_content.sermon_id
    AND (has_role_in_church(auth.uid(), s.church_id, 'admin'::app_role)
      OR has_role_in_church(auth.uid(), s.church_id, 'owner'::app_role)
      OR has_role_in_church(auth.uid(), s.church_id, 'pastor'::app_role))
  ));
