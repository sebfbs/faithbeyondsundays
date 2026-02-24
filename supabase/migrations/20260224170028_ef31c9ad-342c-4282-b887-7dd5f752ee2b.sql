
-- Fix 1: Restrict sermon-media storage to same-church members for published sermons
DROP POLICY IF EXISTS "Authenticated users can view sermon media" ON storage.objects;

CREATE POLICY "Members can view sermon media for their church"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sermon-media'
    AND (
      -- Church admins can see all their church's files (folder = church_id)
      (storage.foldername(name))[1] IN (
        SELECT church_id::text FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'pastor')
      )
      OR
      -- Members can see published sermons from their church only
      EXISTS (
        SELECT 1 FROM public.sermons s
        WHERE s.storage_path = name
          AND s.church_id = public.get_user_church_id(auth.uid())
          AND s.is_published = true
      )
    )
  );
