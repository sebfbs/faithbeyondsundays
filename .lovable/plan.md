

## Auto-Pick YouTube Thumbnail

### Problem
When uploading a YouTube sermon, the thumbnail picker shows 4 identical-looking options (maxresdefault, sddefault, hqdefault, mqdefault) -- they're all the same YouTube thumbnail at different resolutions.

### Solution
For YouTube sermons, auto-select the best quality thumbnail and show a simple preview instead of a 4-option grid.

### Changes

**File: `src/pages/admin/AdminSermons.tsx`**

1. **Thumbnail generation `useEffect` (lines 681-692)**: Instead of setting 4 URLs, set only 1 (maxresdefault) and auto-select it:
   ```typescript
   if (sermon.source_type === "youtube" && sermon.source_url) {
     const match = ...;
     if (match?.[1]) {
       setThumbnails([`https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`]);
       setSelectedThumb(0); // Auto-select
       setLoadingThumbnails(false);
     }
   }
   ```

2. **`ThumbnailStep` component (lines 1011-1081)**: When `isYoutube` is true and there's 1 thumbnail, show a single centered preview with a checkmark and "YouTube thumbnail auto-selected" message instead of a 2x2 grid. Hide the "New Frames" button (already hidden for YouTube).

### Result
- YouTube uploads: Admin sees one auto-selected thumbnail preview, just clicks "Next"
- File uploads: Unchanged behavior (4 extracted frames, "New Frames" button)

