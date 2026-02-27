
-- Allow church admins/pastors/owners to upload files to sermon-media bucket
-- scoped to their church_id path prefix
CREATE POLICY "Church admins can upload sermon media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sermon-media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (
    has_role_in_church(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin'::app_role)
    OR has_role_in_church(auth.uid(), (storage.foldername(name))[1]::uuid, 'owner'::app_role)
    OR has_role_in_church(auth.uid(), (storage.foldername(name))[1]::uuid, 'pastor'::app_role)
  )
);
