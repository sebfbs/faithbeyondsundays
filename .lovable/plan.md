

## Add Progress Indicator for YouTube "Pending" State

### Problem
When a YouTube sermon is uploaded, it shows a static "Pending" badge with no visual feedback, making it look like nothing is happening.

### Solution
Replace the static "Pending" badge for YouTube sermons with a simulated progress bar (similar to the existing `TranscribingProgress` component) that shows "Fetching YouTube transcript..." with a percentage.

### Changes

**File: `src/pages/admin/AdminSermons.tsx`**

1. **Update `statusConfig`** (line 76): Change the pending label to something more active -- "Queued" with a spinning Loader2 icon instead of a static Clock.

2. **Create a `PendingProgress` component** (near the existing `TranscribingProgress`): A small component that shows a progress bar with "Processing YouTube video..." text and a simulated percentage (caps at ~85% over ~2 minutes). It will only render when `source_type === "youtube"`.

3. **Add the progress bar to the sermon card** (around line 306): Add a condition for `sermon.status === "pending" && sermon.source_type === "youtube"` that renders the new `PendingProgress` component, matching the visual style of the existing transcribing progress bar.

### Visual Result
Instead of a plain "Pending" badge, YouTube uploads will show:
- A spinning loader icon in the badge
- A blue progress bar with "Processing YouTube video..." and a percentage
- Smooth animation that fills over ~2 minutes before the status transitions to "generating"
