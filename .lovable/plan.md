

## Redesign Sermon List Page -- Clear Status, Sections, Delete, and Click-to-View

### Problems
- All sermons look identical when they share the same title -- no upload timestamp visible
- No way to delete unwanted sermons
- No visual sectioning by status -- everything blends together
- The "CURRENT" badge is small and easy to miss
- No way to click into a published sermon to view/edit its content after approval
- Action buttons are cluttered and unclear

### Solution

**1. Section sermons into clear groups with headers**

Three sections, each with a bold header and distinct styling:

- **Live Now** (green accent) -- the sermon marked `is_current`. Gets a prominent highlighted card with a green left border and "LIVE ON YOUR APP" label. Only one sermon can be here.
- **Needs Attention** (amber/purple accent) -- sermons in `review` or `failed` status. Shows at the top so the admin sees what needs action.
- **Processing** -- sermons in `pending`, `uploading`, `transcribing`, or `generating` status. Shows animated progress indicators.
- **All Sermons** -- all remaining `complete` sermons (published or draft), sorted by `created_at` descending.

Empty sections are hidden entirely.

**2. Show upload timestamp on every card**

Display "Uploaded Feb 27 at 3:05 PM" (using `created_at`) underneath the existing speaker/date line. Sort within each section by `created_at` descending so the most recent upload is always first.

**3. Add delete functionality**

- Add a three-dot dropdown menu (`DropdownMenu`) on each sermon card with: "View Content", "Edit Details", "Set as Current", "Publish/Unpublish", and "Delete"
- Delete shows an `AlertDialog` confirmation: "This will permanently delete the sermon and all its generated content."
- Delete mutation: removes `sermon_content` rows, removes storage file (if exists), then deletes the sermon row
- Requires no new RLS policy -- admins already have ALL access on sermons table

**4. Click-to-view/edit published sermon content**

- Clicking a sermon card (or "View Content" from the dropdown) opens the same wizard dialog but in a **view/edit mode** (not approval mode)
- For `complete` sermons, the wizard opens without the "Approve & Schedule" button -- instead shows "Save Changes" if edits were made
- This lets admins review and edit content post-publication

**5. Prominent "Live" indicator**

The current live sermon gets a visually distinct card:
- Green left border with a pulsing green dot and "LIVE ON YOUR APP" badge
- Slightly larger card with the sermon title more prominent
- Quick action button to swap which sermon is live

### Technical Changes

| File | Changes |
|------|---------|
| `src/pages/admin/AdminSermons.tsx` | Add DropdownMenu import; add delete mutation with AlertDialog; group sermons into sections; add `created_at` display with `formatDistanceToNow`; add "Live Now" highlighted card; make cards clickable to open wizard in view mode; add three-dot menu with actions; sort by `created_at` desc |

### Card Layout (per sermon)

```text
+---+------------------------------------------+-----+
| G |  "I'm Goin In"                           | ... |
| R |  Luke Chafin · Feb 26, 2026              |     |
| E |  Uploaded 2 hours ago · File Upload       |     |
| E |                                           |     |
| N |  [Ready for Review]  [Review & Approve]   |     |
+---+------------------------------------------+-----+
```

The green left border only appears on the LIVE sermon. The three-dot menu (`...`) contains secondary actions. Primary actions (Review & Approve) stay inline.

### Delete Flow

1. Admin clicks `...` menu, then "Delete"
2. AlertDialog appears: "Delete this sermon? This will permanently remove the sermon and all generated content. This cannot be undone."
3. On confirm: delete `sermon_content` where `sermon_id`, delete storage file via `supabase.storage.from('sermon-media').remove([path])`, delete sermon row
4. Toast: "Sermon deleted"

### View Mode for Published Sermons

When a `complete` sermon card is clicked, open the ReviewWizard with a new `mode` prop:
- `mode="review"` -- current behavior with "Approve & Schedule"  
- `mode="view"` -- same wizard steps but final step shows "Save Changes" instead of "Approve & Schedule", and only saves edited content without changing sermon status

This reuses all existing wizard step components (SparkEditor, TakeawaysEditor, etc.) with no duplication.

