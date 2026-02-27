

## Fix Sermon Upload: Memory Limit Exceeded

### Root Cause

The `upload-sermon` edge function receives the entire file via `FormData`, loads it fully into memory with `file.arrayBuffer()`, then re-uploads it to storage. Edge functions have a ~150MB memory limit, so any sermon file over that size crashes the function.

### Solution: Client-Side Direct Upload

Instead of routing the file through the edge function, upload it directly from the browser to the `sermon-media` storage bucket, then create the sermon + job records via a streamlined edge function (no file in the payload).

### Changes

**1. Add Storage RLS Policy for `sermon-media` bucket**

Create a migration that allows authenticated church admins/pastors/owners to upload files to the `sermon-media` bucket scoped to their `church_id` path prefix:

```sql
CREATE POLICY "Church admins can upload sermon media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sermon-media'
  AND (storage.foldername(name))[1]::uuid IS NOT NULL
  AND has_role_in_church(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin')
  OR has_role_in_church(auth.uid(), (storage.foldername(name))[1]::uuid, 'owner')
  OR has_role_in_church(auth.uid(), (storage.foldername(name))[1]::uuid, 'pastor')
);
```

**2. Update `AdminSermons.tsx` upload flow**

Change the file upload handler to:
1. Get the user's `church_id` from their role
2. Upload the file directly to `sermon-media/{church_id}/{timestamp}-{filename}` using `supabase.storage.from('sermon-media').upload(...)`
3. Call a new lightweight `create-sermon` edge function (or rewrite `upload-sermon`) with just the metadata (title, speaker, date, storage_path) -- no file data

**3. Rewrite `upload-sermon` edge function (or create `create-sermon`)**

Strip out all file handling. The function now:
- Receives JSON body: `{ title, speaker, sermon_date, storage_path }`
- Verifies the user has admin/pastor/owner role
- Creates the `sermons` record
- Creates the `sermon_jobs` record
- Fire-and-forget triggers `process-sermon`

This keeps the function lightweight (a few KB of JSON) and will never hit memory limits.

### Technical Details

**Files to modify:**
- `src/pages/admin/AdminSermons.tsx` -- update `handleSubmit` to upload file via Storage SDK, then call edge function with metadata only
- `supabase/functions/upload-sermon/index.ts` -- remove file handling, accept JSON metadata + storage_path instead
- New DB migration -- add storage RLS policies for `sermon-media` bucket

**How it works end-to-end:**
1. Admin fills form, picks file, clicks "Upload & Process"
2. Browser uploads file directly to `sermon-media/{churchId}/{timestamp}-{filename}`
3. Browser calls `upload-sermon` with `{ title, speaker, sermon_date, storage_path }`
4. Edge function creates sermon + job records, triggers processing
5. `process-sermon` downloads file from storage (using service role key) and proceeds as before

This approach eliminates the memory bottleneck entirely -- the edge function never touches the file.
