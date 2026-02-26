

## Add Prayer Notification Badge + "Prayed" Toggle for Admin Dashboard

### Part 1: Red notification badge on the Prayer nav item

Add a red dot with a count of unanswered prayer requests next to the "Prayer" link in the admin sidebar navigation.

**File: `src/pages/admin/AdminLayout.tsx`**
- Add a `useQuery` hook to fetch the count of unanswered prayers (`is_answered = false`) for the current `church_id`
- Refetch every 60 seconds to stay current
- In the nav loop, when the item is "Prayer" and count > 0, render a small red pill badge with the number (e.g. "3") using `ml-auto`
- Cap display at "99+" for large counts

### Part 2: "Mark as Prayed" toggle on each prayer card

Add a button on each prayer request card in the admin prayer page that lets the admin mark it as "answered/prayed for", visually moving it to a completed state.

**File: `src/pages/admin/AdminPrayer.tsx`**
- Add a `useMutation` that updates `prayer_requests.is_answered = true` and `answered_at = now()` for the given prayer ID
- Render a toggle button on each unanswered prayer card (right side) -- a small "Mark as Prayed" button
- When clicked, optimistically update the UI and mark the prayer as answered
- Already-answered prayers show the existing green "Answered" badge (no button needed)
- Invalidate both the prayer list query and the admin prayer count query on success so the red badge updates immediately

### Technical details

| File | Change |
|------|--------|
| `src/pages/admin/AdminLayout.tsx` | Add `useQuery` for unanswered prayer count; render red badge pill next to Prayer nav item |
| `src/pages/admin/AdminPrayer.tsx` | Add `useMutation` to mark prayers as answered; render "Mark as Prayed" button on unanswered cards |

**Badge styling:**
```
bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center ml-auto
```

**Prayer toggle button styling:**
A compact button with a checkmark icon, labeled "Mark as Prayed". Once clicked, the prayer gets the green "Answered" badge and the button disappears. The red nav badge count decreases accordingly.

No database schema changes needed -- the `is_answered` and `answered_at` columns already exist on `prayer_requests`, and the existing RLS policies allow church admins (owner/admin/pastor roles) to read all prayers. However, admins currently cannot UPDATE prayers they don't own, so we need to add an RLS policy allowing church admins to update `is_answered` on prayers in their church.

**Database migration needed:**
- Add an RLS UPDATE policy on `prayer_requests` for church admins/owners/pastors so they can mark prayers as answered

