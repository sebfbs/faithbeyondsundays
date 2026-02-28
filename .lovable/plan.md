

## Fix: YouTube Sermon Processing Stuck at "Pending"

### Root Cause
The `sermon_jobs` table has Row Level Security (RLS) enabled with only a SELECT policy for church admins. There is **no INSERT policy**, so when the admin uploads a YouTube sermon and the frontend tries to create a processing job, the insert silently fails. Without a job in the queue, the `process-sermon` function has nothing to pick up, and the sermon stays at "pending" indefinitely.

The 85% cap on the progress bar is by design (simulated progress), but the real issue is the backend never starts.

### Fix

**1. Add INSERT policy for sermon_jobs (database migration)**

Add an RLS policy allowing church admins/owners/pastors to insert jobs for their church:

```sql
CREATE POLICY "Admins can create jobs in their church"
  ON public.sermon_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role_in_church(auth.uid(), church_id, 'admin')
    OR public.has_role_in_church(auth.uid(), church_id, 'owner')
    OR public.has_role_in_church(auth.uid(), church_id, 'pastor')
  );
```

**2. Fix the stuck sermon**

Run a one-time migration to create the missing job for the currently stuck sermon so it can be processed without needing to delete and re-upload:

```sql
INSERT INTO public.sermon_jobs (sermon_id, church_id, job_type, status, priority)
SELECT id, church_id, 'full_pipeline', 'queued', 0
FROM public.sermons
WHERE status = 'pending'
  AND source_type = 'youtube'
  AND id NOT IN (SELECT sermon_id FROM public.sermon_jobs);
```

**3. Re-trigger processing**

After the migration, the admin page's polling will detect the job exists. We should also ensure the `process-sermon` function is invoked. The existing code already calls `supabase.functions.invoke("process-sermon")` after insert -- once the INSERT policy is in place, this will work on future uploads automatically.

### Files Changed
- **Database migration only** -- no frontend code changes needed. The UI code is already correct; it just needs the RLS policy to allow the insert to succeed.
