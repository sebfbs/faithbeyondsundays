

## Individual Regeneration, Scrollable Wizard, and Thumbnail Refresh

### 1. Individual Regenerate Buttons Per Content Item

Currently there's one "Regenerate" button at the top of each wizard step that regenerates the entire section (all 7 sparks, all takeaways, etc.). This will be changed so each individual card has its own small regenerate icon button.

**Changes to `ContentEditStep`:** Remove the top-level "Regenerate" button. Pass `onRegenerateItem` callback instead of `onRegenerate`.

**Changes to each editor component (SparkEditor, TakeawaysEditor, ReflectionEditor, ScripturesEditor, ChaptersEditor):**
- Add a small refresh icon button on each individual card (top-right corner)
- When clicked, it calls the edge function with both the `regenerate_type` AND an `item_index` parameter so only that one item is regenerated
- Show a spinner on just that card while regenerating, leaving the rest untouched

**Changes to `process-sermon/index.ts`:**
- Accept an optional `item_index` parameter in the regeneration path
- When present, regenerate only that specific item within the content (e.g., just Tuesday's spark, or just takeaway #3)
- Merge the new item back into the existing content array, preserving all other items

### 2. Fix Scrolling in Wizard Cards

The `ScrollArea` on the content area doesn't have a constrained height, so it never actually scrolls. Fix this by giving the ScrollArea a proper flex layout with `overflow-y-auto` and ensuring the dialog's flex column layout constrains it.

**Change:** Replace `ScrollArea` with a plain `div` that has `className="flex-1 overflow-y-auto px-6 min-h-0"`. The `min-h-0` combined with the parent `flex flex-col` and `max-h-[90vh]` on the dialog will enable proper scrolling.

### 3. Thumbnail Regeneration with Different Timestamps

Add a "Regenerate Thumbnails" button on the thumbnail step. For uploaded videos, it picks 4 new random timestamp positions (different from the original 0.15, 0.35, 0.55, 0.75). For YouTube videos, there are only 4 fixed thumbnails available from YouTube's API, so the regenerate button won't apply there (will be hidden).

**Changes to `ThumbnailStep`:**
- Accept an `onRegenerate` callback and `regenerating` flag
- Show a "Regenerate" button (hidden for YouTube sources)
- When clicked, re-extract frames from different random positions

**Changes to `ReviewWizard`:**
- Add a `thumbnailSeed` state (a counter) that changes positions used for frame extraction
- When regenerating, increment the seed which triggers new positions like `[0.1, 0.3, 0.5, 0.7]` then `[0.2, 0.4, 0.6, 0.8]`, etc., using randomized offsets

### Technical Details

| File | Changes |
|------|---------|
| `src/pages/admin/AdminSermons.tsx` | Add per-item regenerate buttons to all editor components; fix scroll container; add thumbnail regeneration with randomized timestamps; update `handleRegenerate` to accept optional `item_index`; update edge function call to pass `item_index` |
| `supabase/functions/process-sermon/index.ts` | Handle `item_index` in regeneration path -- regenerate single item within a content type and merge it back into the existing array |

