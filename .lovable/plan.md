

## Redesign Approval Wizard + 7 Daily Sparks + Editable/Regenerable Content

### Overview
Five changes: (1) replace the right-side Sheet with a centered wizard Dialog, (2) remove weekly_challenge and weekend_reflection, (3) generate 7 daily sparks instead of 1, (4) make all content editable inline, and (5) add per-section regeneration.

---

### 1. Remove Weekly Challenge & Weekend Reflection

**Edge function (`process-sermon/index.ts`):**
- Remove `weekly_challenge` and `weekend_reflection` from the `allContentTypes` array (lines 193-194)
- Remove `buildChallengePrompt` and `buildWeekendReflectionPrompt` functions (lines 640-656)
- Remove their tool schemas from `buildToolSchema` (lines 530-567)

**Admin UI (`AdminSermons.tsx`):**
- Remove `weekly_challenge` and `weekend_reflection` from `CONTENT_TYPE_LABELS` (lines 51-52)
- Remove the `.concat(["weekly_challenge", "weekend_reflection"])` on line 527

---

### 2. Generate 7 Daily Sparks (One Per Day of the Week)

**Edge function (`process-sermon/index.ts`):**
- Update `buildSparkPrompt()` to ask for 7 sparks -- one for each day of the week (Monday through Sunday)
- Update the `spark` tool schema to return an array of 7 spark objects, each with `day`, `title`, and `summary` fields
- Schema becomes: `{ sparks: [{ day: "Monday", title: "...", summary: "..." }, ...] }`

**Admin UI:** The spark step in the wizard will show all 7 sparks, one card per day, each individually editable.

**Member UI:** The existing `SermonTab.tsx` will need to pick the correct spark for today's day of the week from the array. This is a display-side change to read `spark.sparks[dayIndex]` instead of `spark.title`.

---

### 3. Centered Wizard Dialog for Approval

Replace the `ReviewSheet` (right-side Sheet) with a `ReviewWizard` that uses the `Dialog` component, centered on screen with `max-w-2xl`.

**Wizard steps with progress dots:**
1. **Thumbnail** -- Pick video thumbnail (skip if none available)
2. **Daily Sparks** -- Review/edit all 7 sparks
3. **Key Takeaways** -- Review/edit each takeaway
4. **Reflection Questions** -- Review/edit each question
5. **Scripture References** -- Review/edit references
6. **Sermon Chapters** -- Review/edit chapters with timestamps
7. **Confirm** -- Summary with "Approve & Schedule" button

Each step shows progress dots at the top (like onboarding), Back/Next buttons at the bottom.

---

### 4. Inline Editing

Each content step has an "Edit" toggle button. When activated:
- Text fields become `<Input>` or `<Textarea>` components
- Changes are tracked in local state
- On "Next" or "Save", changed content is written back to the `sermon_content` table via an update mutation

---

### 5. Per-Section Regeneration

Each content step has a "Regenerate" button with a refresh icon. When clicked:
- Calls `process-sermon` edge function with a new `regenerate_type` body parameter
- The edge function detects this parameter and only regenerates that single content type
- Deletes the old `sermon_content` row and inserts the fresh one
- UI shows a spinner during regeneration, then refreshes the content

**Edge function changes for regeneration:**
- At the top of the handler, check for `regenerate_type` in the request body
- If present, skip the job queue entirely: look up the sermon's transcript, run just that one prompt, delete+insert the content row, and return
- This requires the edge function to accept direct calls (not just job-based), authenticated with the admin's token or service role key

---

### Technical Summary

| File | Changes |
|------|---------|
| `supabase/functions/process-sermon/index.ts` | Remove weekly_challenge + weekend_reflection; update spark schema to 7 items with day field; update spark prompt for 7 days; add `regenerate_type` direct-call path |
| `src/pages/admin/AdminSermons.tsx` | Replace ReviewSheet with ReviewWizard dialog; remove weekly_challenge/weekend_reflection; wizard steps with progress dots, inline editing, regenerate buttons; update spark preview for 7 items |
| `src/components/fbs/SermonTab.tsx` | Update spark display to read from `sparks` array using current day of week |
| `src/components/fbs/PreviousSermonDetailScreen.tsx` | Same spark array update |
| `sermon_content` table | Needs an RLS policy allowing church admins to UPDATE content (currently only SELECT is allowed) -- will add via migration |

**New migration:** Add UPDATE policy on `sermon_content` for church admins so they can save edits and delete+reinsert for regeneration.

```sql
CREATE POLICY "Church admins can update sermon content"
  ON public.sermon_content FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sermons s
    WHERE s.id = sermon_content.sermon_id
    AND (has_role_in_church(auth.uid(), s.church_id, 'admin') 
      OR has_role_in_church(auth.uid(), s.church_id, 'owner')
      OR has_role_in_church(auth.uid(), s.church_id, 'pastor'))
  ));

CREATE POLICY "Church admins can delete sermon content"
  ON public.sermon_content FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sermons s
    WHERE s.id = sermon_content.sermon_id
    AND (has_role_in_church(auth.uid(), s.church_id, 'admin')
      OR has_role_in_church(auth.uid(), s.church_id, 'owner')
      OR has_role_in_church(auth.uid(), s.church_id, 'pastor'))
  ));
```

