

## Sermon Experience Improvements -- 4 Issues

### Issue 1: Video Playback + Thumbnail Selection

**Member side:** Replace the static gradient placeholder in `SermonTab.tsx` and `PreviousSermonDetailScreen.tsx` with a functional video player:
- For uploaded files: generate a signed URL from the `sermon-media` storage bucket and render an HTML5 `<video>` element with controls
- For YouTube URLs: extract the video ID and embed a YouTube iframe player
- If a `thumbnail_url` exists on the sermon, show it as the video poster/cover image; otherwise fall back to the current gradient placeholder
- Tapping the thumbnail starts playback (show/hide player vs poster)

**Admin side (thumbnail picker):** After the sermon upload completes and enters the `review` state, present 3-4 AI-suggested thumbnail options in the Review Sheet:
- For uploaded videos: use the `process-sermon` edge function to extract frames at ~25%, 50%, 75% of the video duration using a lightweight approach -- since we can't run ffmpeg in edge functions, we'll generate thumbnails client-side instead: when the admin opens the Review Sheet for a sermon with an uploaded file, load the video in a hidden `<video>` element, seek to 3-4 positions, and capture frames via `<canvas>`. The admin picks one, it gets uploaded to the `sermon-media` bucket, and the `thumbnail_url` is saved on the sermon record.
- For YouTube: auto-extract the thumbnail from YouTube's thumbnail API (`https://img.youtube.com/vi/{id}/maxresdefault.jpg` etc.) and offer those as options.
- Add `thumbnail_url` column to the sermons table (it already exists in the schema).

### Issue 2: Chapter Timestamps + Tappable Seek

**Timestamp generation:** Update `process-sermon/index.ts` to capture word-level timing data from the ElevenLabs Scribe response (`transcription.words` array with `start`/`end` times). Before sending the transcript to the chapters AI prompt, embed periodic timing markers (e.g., `[00:05:23]`) into the text at regular intervals. Update the chapters tool schema to include a `timestamp` field (format `"MM:SS"` or `"HH:MM:SS"`). Update the chapters prompt to instruct the AI to assign the closest timing marker to each chapter boundary.

**Tappable timestamps:** In `SermonTab.tsx` and `PreviousSermonDetailScreen.tsx`, make chapter timestamps tappable buttons. When tapped, seek the video player to that timestamp. This requires lifting the video player ref up so the chapter section can call `videoRef.current.currentTime = seconds`.

**Files changed:**
- `supabase/functions/process-sermon/index.ts` -- capture word timestamps, embed timing markers, update chapters schema + prompt
- `src/components/fbs/SermonTab.tsx` -- make timestamps tappable, connect to video player ref
- `src/components/fbs/PreviousSermonDetailScreen.tsx` -- same timestamp interaction
- `src/hooks/useCurrentSermon.ts` -- no changes needed (already reads `timestamp` from chapters)

### Issue 3: Full Transcript for AI Content Generation

**Problem:** All prompts currently truncate the transcript to 8,000 characters (or 12,000 for chapters). This loses most of the sermon content, resulting in shallow/irrelevant takeaways.

**Fix:** Remove the `.slice()` truncation from all prompt builder functions. Send the full transcript to the AI. The model being used (Gemini 2.5 Flash) supports up to 1M tokens of context, so even a 2-hour sermon transcript (~20,000 words / ~80,000 characters) will fit comfortably.

Additionally, update prompt instructions to:
- Focus exclusively on spiritual, biblical, and faith-based insights
- Explicitly ignore logistical announcements, church business, administrative updates, and non-spiritual content
- Frame takeaways as actionable spiritual truths

**Files changed:**
- `supabase/functions/process-sermon/index.ts` -- remove all `.slice()` calls from prompt builders; rewrite prompt instructions for spiritual focus

### Issue 4: Scripture References as Clickable Pills that Open the Bible

**AI prompt change:** Update `buildScripturesPrompt()` to instruct the AI to return only the book/verse reference (e.g., "Luke 5:1-7") and a brief note about how it was used in the sermon -- no full scripture text. The `text` field in the schema will become a short context note instead of the full passage.

**UI change:** In `SermonTab.tsx` and `PreviousSermonDetailScreen.tsx`, render scripture references as compact tappable pills/chips instead of large text blocks. Each pill shows the reference (e.g., "Luke 5:1-7").

**Deep-link to Bible:** When a user taps a scripture pill:
- Parse the reference to extract book name, chapter, and verse
- Navigate to the Bible screen with query parameters (e.g., `/bible?book=Luke&chapter=5&verse=1`)
- Update `BibleScreen.tsx` to read these query params on mount and auto-navigate to the correct book/chapter, highlighting or scrolling to the specific verse

**Callback pattern:** Add an `onOpenBible` callback prop to `SermonTab` and `PreviousSermonDetailScreen`, which `Index.tsx` will wire up to navigate to `/bible?book=...&chapter=...&verse=...`. `BibleScreen` will check for URL params and auto-load the chapter.

**Files changed:**
- `supabase/functions/process-sermon/index.ts` -- update scriptures prompt + schema
- `src/components/fbs/SermonTab.tsx` -- scripture pills with `onOpenBible` callback
- `src/components/fbs/PreviousSermonDetailScreen.tsx` -- same
- `src/components/fbs/BibleScreen.tsx` -- read query params and auto-navigate to book/chapter/verse
- `src/pages/Index.tsx` -- wire up `onOpenBible` callback to navigate to Bible with params

---

### Technical Summary

| File | Changes |
|------|---------|
| `supabase/functions/process-sermon/index.ts` | Capture ElevenLabs word timestamps; embed timing markers in transcript; remove `.slice()` truncation from all prompts; rewrite prompts for spiritual focus; update chapters schema with `timestamp` field; update scriptures prompt to return references only |
| `src/components/fbs/SermonTab.tsx` | Add video player (HTML5 video + YouTube iframe); thumbnail poster image; tappable chapter timestamps that seek video; scripture reference pills with `onOpenBible` callback |
| `src/components/fbs/PreviousSermonDetailScreen.tsx` | Same video player, timestamps, and scripture pill changes |
| `src/hooks/useCurrentSermon.ts` | Add `thumbnailUrl` and `storagePath` to `SermonUIData` |
| `src/components/fbs/BibleScreen.tsx` | Accept URL query params to auto-navigate to a specific book/chapter/verse |
| `src/pages/Index.tsx` | Pass `onOpenBible` callback to SermonTab and PreviousSermonDetailScreen; wire navigation to Bible with query params |
| `src/pages/admin/AdminSermons.tsx` | Add client-side thumbnail extraction in ReviewSheet; thumbnail picker UI with 3-4 frame options; upload selected thumbnail to storage |
| Migration SQL | None needed -- `thumbnail_url` column already exists on sermons table |

**Note:** These changes to the AI prompts and timestamps only affect newly processed sermons. The existing Penhurst test sermon would need to be re-processed (delete its `sermon_content` rows and re-run the pipeline) to see improved results.

