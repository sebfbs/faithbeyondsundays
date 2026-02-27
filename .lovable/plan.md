

## Add Upload Progress Bar with Friendly Messages

### What Changes
Update the sermon upload form in `AdminSermons.tsx` to show a real percentage progress bar during file upload, with fun, friendly step messages instead of technical jargon.

### Friendly Messages
Instead of "Uploading file..." and "Creating sermon record...", the UI will show playful rotating messages like:
- During upload: "Sending your sermon to the cloud...", "Almost there, hang tight!", "Your sermon is on its way..."
- After upload completes: "Finishing up the magic...", "Just a few more seconds..."
- On success (brief flash before dialog closes): "You're all set!"

The message will change as the upload progresses through percentage milestones (e.g., new message every ~25%).

### Visual Design
- A `<Progress>` bar component (already exists in the project) showing 0-100%
- Percentage text displayed alongside (e.g., "64%")
- A friendly message below the bar that rotates as progress increases
- The submit button area is replaced with this progress UI while uploading
- Dialog stays open until complete, then auto-closes

### Technical Approach

**Single file modified: `src/pages/admin/AdminSermons.tsx`**

- Replace `supabase.storage.upload()` with an `XMLHttpRequest` to the Supabase Storage REST API, which provides `xhr.upload.onprogress` events with `loaded`/`total` bytes for real percentage tracking
- Add `uploadPercent` (number 0-100) and `uploadStep` ("idle" | "uploading" | "finalizing" | "done") state variables
- Show the `<Progress />` component (from `src/components/ui/progress.tsx`) with the current percentage
- Display a friendly message that changes at 0%, 25%, 50%, 75%, and 100% milestones
- After the edge function call succeeds, briefly show "You're all set!" before closing the dialog
- No backend or database changes needed

