

## Fix Chapter Generation: Full Duration Coverage + New Prompt

### Problem
The `embedTimingMarkers` function builds the timestamped transcript by splitting the plain text transcript into words and trying to align them with the ElevenLabs word-timing array by index. Because word counts drift (punctuation, contractions), timestamps become inaccurate or stuck after the first ~15 minutes. The AI then has no timing context for the rest of the sermon, so it stops generating chapters.

### Changes

#### 1. Rewrite `embedTimingMarkers` (lines 672-698)

Instead of splitting the plain text and aligning by index, build the transcript directly from the `wordTimings` array. Each word object already has `.text`, `.start`, and `.end`. Simply iterate through `wordTimings`, inserting a `[MM:SS]` marker whenever 60+ seconds have passed since the last marker. This guarantees 100% accurate timestamps across the entire sermon duration.

```text
Before (broken):
  Split transcript.split(/\s+/) -> words[]
  Try to match words[i] with wordTimings[i] (drifts)

After (correct):
  Iterate wordTimings[] directly
  Each word has its own accurate .start time
  Insert [MM:SS] marker every 60s
```

#### 2. Update `buildChaptersPrompt` (lines 911-929)

Replace the current chapter prompt with the user's framework, keeping the tool schema fields (title, summary, order, timestamp):

- Role: "You are a sermon chapter generator"
- Instruction: Identify only main structural chapters -- introduction, scripture reading, sermon title, each main point, major illustrative stories, closing prayer/altar call
- Exclusion: Do not include sub-points, illustrations, or transitions as their own chapters
- Count: Keep total between 6-10 chapters
- Keep existing rules about using timing markers for timestamps and covering the full duration

#### 3. Update chapter tool schema (lines 813-840)

Minor tweak to the schema description to align with the new prompt (reinforce 6-10 chapters, structural focus).

### Files Modified

| File | What changes |
|------|-------------|
| `supabase/functions/process-sermon/index.ts` | Rewrite `embedTimingMarkers` to use wordTimings directly; update `buildChaptersPrompt` with new instructions; tweak chapter schema description |

After these changes, the edge function will be redeployed automatically.

