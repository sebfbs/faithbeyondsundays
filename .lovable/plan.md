

## Make YouTube Transcript Fetching Bulletproof

### The Problem

The current code scrapes YouTube's full HTML watch page and tries to regex out caption data. YouTube actively blocks this with bot detection, making it fundamentally unreliable from a server environment.

### Why "Tries" Keeps Failing

YouTube serves different HTML to server requests vs browsers. The `ytInitialPlayerResponse` JSON blob that contains caption URLs is often stripped or obfuscated when the request comes from a server IP. No amount of User-Agent spoofing fixes this reliably.

### The Fix: Two Guaranteed Paths

**Path 1 (Primary) -- YouTube Innertube API**

YouTube's own internal API endpoint (`POST /youtubei/v1/player`) returns structured JSON with caption track URLs. This is what every major YouTube transcript library (youtube-transcript, youtubei.js) uses under the hood. It does NOT require authentication or an API key. It works reliably from servers because it's a proper API endpoint, not HTML scraping.

- Send a POST request with the video ID and a standard web client context
- Get back structured JSON with `captions.playerCaptionsTracklistRenderer.captionTracks`
- Fetch the caption XML from the track URL
- Parse segments into timestamped transcript

This works for any video that has captions enabled (manual or auto-generated).

**Path 2 (Fallback) -- Download Audio, Transcribe with ElevenLabs**

For videos where captions genuinely don't exist (rare but possible), we download the audio and run it through ElevenLabs Scribe -- the same proven flow that already works for file uploads.

To download YouTube audio server-side, we'll use the Cobalt API (`cobalt.tools`), an open-source media extraction service with a public API. It returns a direct download URL for the audio track.

If Cobalt is unavailable, the system will clearly tell the admin: "This video has no captions. Please upload the audio/video file directly instead."

### What Changes

**File: `supabase/functions/process-sermon/index.ts`**

Replace the `fetchYouTubeTranscript` function (~lines 918-1053) with:

1. **`fetchYouTubeTranscript(videoId)` rewritten** to:
   - Call YouTube Innertube API (`POST https://www.youtube.com/youtubei/v1/player`) with proper client context
   - Extract caption tracks from the structured JSON response
   - Find English track (prefer manual over auto-generated)
   - Fetch caption XML and parse into timestamped transcript
   - On success: return the transcript text with timing markers (same format as before)

2. **New `downloadYouTubeAudio(videoId)` function** as fallback:
   - Call Cobalt API (`POST https://api.cobalt.tools/`) requesting audio-only extraction
   - Download the returned audio file as a Blob
   - Return the Blob for transcription

3. **Updated YouTube processing block** (~lines 120-170):
   - Try `fetchYouTubeTranscript` first (Innertube captions)
   - If it fails (no captions on the video), try `downloadYouTubeAudio` then transcribe with ElevenLabs Scribe (reusing the exact same ElevenLabs logic from the file upload path)
   - If both fail, set sermon status to `"failed"` with a clear error message: "Could not extract transcript. Please upload the video file directly."
   - Never silently fall back to title-only generation

4. **Remove the title-only fallback** (~lines 141-143): No more generating fake content from just a title. If we can't get a real transcript, we fail explicitly so the admin knows and can take action.

### Why This Works

- The Innertube API is YouTube's own internal API -- it's what the YouTube website itself calls. It returns clean JSON, not HTML to parse.
- ElevenLabs Scribe is already proven in the file upload flow -- we're just reusing it as a safety net.
- Clear failure messaging means admins are never left wondering why content looks wrong.

### No New Dependencies or API Keys Needed

- Innertube API: No key required (public endpoint)
- Cobalt API: No key required (open-source public API)
- ElevenLabs: Already configured (`ELEVENLABS_API_KEY` secret exists)
