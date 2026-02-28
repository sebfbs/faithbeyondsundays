

## Remove YouTube Upload Flow + Add Audio-Only Player Support

### Overview
Remove the entire YouTube sermon upload path from both the admin UI and backend processing. Keep only file upload (video or audio). For audio-only uploads, skip the thumbnail step in the review wizard and show a styled audio player on the member-facing app instead of a video player.

### Changes

**1. Admin Upload Form (`src/pages/admin/AdminSermons.tsx`)**
- Delete the `SourceMode` type, `mode` state, and `youtubeUrl` state
- Remove the "Upload File" / "YouTube Link" toggle buttons (lines 1554-1575)
- Remove the YouTube URL input (lines 1622-1632)
- Remove the YouTube submit branch (lines 1512-1539)
- Remove `PendingProgress` component (lines 98-125, YouTube-specific)
- Remove YouTube source label in sermon cards (line 298)
- Remove YouTube pending progress check (lines 345-348)
- Remove `LinkIcon` import
- Change submit button text from conditional to just "Upload & Process"

**2. Thumbnail Step -- Skip for Audio (`src/pages/admin/AdminSermons.tsx`)**
- Detect if the uploaded file is audio-only by checking `storage_path` extension (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`)
- In the `ReviewWizard`, auto-skip the thumbnail step when the sermon is audio-only (start wizard at step 1 instead of 0)
- Remove YouTube thumbnail logic (lines 681-688) and `isYoutube` prop from `ThumbnailStep`
- When thumbnail extraction fails for video files (e.g., CORS issues), still show the step but with a "Skip" option

**3. Sermon Player -- Audio Mode (`src/components/fbs/SermonVideoPlayer.tsx`)**
- Add a `mediaType` prop (optional) to detect audio files
- Also detect audio from the URL/storagePath extension as a fallback
- When audio is detected, render a styled audio player instead of the video player:
  - A gradient card (Horizon blue theme) with a subtle cross watermark
  - Native HTML5 `<audio controls>` element
  - Duration displayed if available
  - No aspect-video container, no thumbnail needed
- Keep YouTube embed support for backward compatibility with any existing YouTube sermons

**4. Database -- Track Media Type**
- Add a nullable `media_type` text column to the `sermons` table via migration
- This stores the MIME type (e.g., "audio/mpeg", "video/mp4") so the frontend knows what player to show

**5. Upload Sermon Edge Function (`supabase/functions/upload-sermon/index.ts`)**
- Accept the `media_type` parameter from the frontend and save it to the sermon row on insert

**6. Process Sermon Edge Function (`supabase/functions/process-sermon/index.ts`)**
- Delete the entire YouTube processing branch (lines 120-224)
- Delete all YouTube helper functions (lines 964-1269): `extractYouTubeId`, `fetchYouTubeTranscript`, `downloadYouTubeAudio`, `parseTimedTextXml`, `fetchAndParseCaptionXml`, `_lastStreamingData`
- Keep only the file upload transcription path
- This removes approximately 350 lines of code

**7. Member-Facing Screens**
- `SermonTab.tsx` and `PreviousSermonDetailScreen.tsx` already delegate to `SermonVideoPlayer` -- no changes needed since the player component will handle audio/video distinction automatically

### Audio Player Design
A compact, themed card replacing the video player for audio files:
- Blue gradient background matching the app's Horizon theme
- Subtle cross icon watermark (same as the "Video coming soon" fallback)
- Native `<audio controls>` with full-width styling
- Duration badge if available
- No play-button overlay -- native audio controls handle everything

### Migration
```sql
ALTER TABLE public.sermons ADD COLUMN media_type text;
```

### Code Reduction
- ~350 lines removed from process-sermon edge function
- ~80 lines removed from AdminSermons.tsx
- Net simpler, more reliable system

