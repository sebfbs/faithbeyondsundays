

# Fix Sermon Processing: Under 2 Minutes Every Time

## What's Actually Wrong

Your edge function currently **downloads the entire 400MB video into its own memory** (which only has ~150MB), causing it to crash silently. The job then sits in "processing" forever.

## The Fix (Simple and Elegant)

ElevenLabs has a `cloud_storage_url` parameter that accepts any HTTPS URL. Instead of downloading the video file, we just generate a temporary signed URL pointing to the file in your storage and hand that URL to ElevenLabs. **ElevenLabs downloads and processes it directly** -- your edge function never touches the file at all.

You don't even need to extract audio separately. ElevenLabs handles video files natively and extracts the audio internally. The HD video stays in storage untouched for church members to watch.

```text
Current (broken):
  Storage --[408MB download]--> Edge Function memory (crashes) --> ElevenLabs

Fixed:
  Storage --[signed URL string]--> Edge Function --[URL string]--> ElevenLabs downloads directly
  Edge function memory usage: ~0 MB
```

## What This Means for Speed

- **Video upload**: Depends on admin's internet speed (unchanged)
- **Transcription**: ElevenLabs processes a 1-hour sermon in ~30-60 seconds via URL
- **AI content generation**: 5 parallel calls instead of sequential = ~15-20 seconds total
- **Total processing after upload completes**: Under 2 minutes

## Changes

### 1. `supabase/functions/process-sermon/index.ts`

**Replace the download + FormData upload block** (lines 121-146) with:
- Generate a 1-hour signed URL for the file in storage using `supabase.storage.from("sermon-media").createSignedUrl()`
- Pass the signed URL to ElevenLabs using the `cloud_storage_url` parameter instead of the `file` parameter
- This eliminates all memory issues regardless of file size (works up to 2GB per ElevenLabs limits)

**Parallelize AI content generation** (lines 215-266):
- Currently generates 5 content types sequentially (one after another)
- Change to `Promise.all()` so all 5 AI calls run simultaneously
- This cuts ~45 seconds of sequential waiting down to ~10-15 seconds

**Add lease heartbeats**:
- Set `locked_until` when claiming a job
- Refresh the lease before each major stage so stale job recovery works

### 2. `supabase/functions/process-sermon/index.ts` -- Stale job recovery

At the start of the function (before claiming a new job):
- Find any jobs stuck in `processing` where `locked_until` has passed
- Reset them to `queued` so they get retried automatically
- This prevents permanently stuck jobs

### 3. `src/pages/admin/AdminSermons.tsx` -- Progress display

Replace the fake `TranscribingProgress` timer (lines 103-130) with a real status tracker:
- Poll the sermon's actual `status` field every 3 seconds
- During `transcribing`: show "Transcribing audio..." with a pulsing/indeterminate bar
- During `generating`: show real progress based on `sermon_content` row count (already partially implemented for the generating phase)
- Add a "Retry" button if a sermon has been stuck for more than 10 minutes

### 4. Database migration

- Add `current_stage` text column to `sermon_jobs` for tracking which step the worker is on (optional but helpful for debugging)

## Scaling to 1,000+ Churches on Sundays

This fix handles the immediate crash and speed problem. The signed URL approach means file size no longer matters -- a 100MB file and a 2GB file take the same edge function resources (near zero).

For the parallel worker fan-out system (pump-sermon-queue) discussed earlier, that remains a future enhancement for when you have hundreds of simultaneous uploads. The current fix ensures each individual sermon processes reliably in under 2 minutes.

## Files to modify

| File | Change |
|------|--------|
| `supabase/functions/process-sermon/index.ts` | Signed URL + parallel AI generation + lease heartbeats + stale recovery |
| `src/pages/admin/AdminSermons.tsx` | Replace fake timer with real status display + retry button |
| Database migration | Add `current_stage` column to `sermon_jobs` |

