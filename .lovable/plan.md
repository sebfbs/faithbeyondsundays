

## Add Heart/Like to Sermon and Individual Takeaways

Bring Instagram-style engagement to the sermon page: a heart button on the sermon itself, plus individual heart buttons on each takeaway. Users see real-time like counts, creating social proof and encouraging interaction.

### How It Works

- **Sermon heart**: A heart icon next to the Share button in the sermon card header. Tapping it toggles the user's like on/off. Shows the total count (e.g., "24").
- **Takeaway hearts**: Each takeaway card gets a small heart icon in the bottom-right corner with a count. Users can heart individual takeaways that resonate with them. Seeing "15 likes" on one takeaway vs "3" on another creates that comment-section energy.
- One like per user per sermon, one like per user per takeaway. Tapping again unlikes.
- Counts are visible to everyone; liking requires being logged in.

### Technical Details

**1. Database: Create `sermon_likes` table**

A single table handles both sermon-level and takeaway-level likes:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| sermon_id | uuid | Which sermon |
| user_id | uuid | Who liked |
| target_type | text | `'sermon'` or `'takeaway'` |
| target_index | integer | null for sermon, 0-based index for takeaways |
| created_at | timestamptz | When liked |

- Unique constraint on `(sermon_id, user_id, target_type, target_index)` to prevent duplicate likes
- RLS: anyone authenticated can read counts; users can insert/delete their own likes

**2. New hook: `useSermonLikes`**

- Fetches all likes for a given sermon (both sermon-level and takeaway-level) in one query
- Returns: `{ sermonLikeCount, hasLikedSermon, takeawayLikes: { [index]: { count, hasLiked } }, toggleSermonLike(), toggleTakeawayLike(index) }`
- Uses `react-query` with optimistic updates for instant UI feedback

**3. UI updates to `SermonTab.tsx`**

- Add a Heart icon next to the existing Share icon in the sermon card header, with a count label
- On each takeaway card, add a small heart icon + count in the bottom-right
- Heart fills red when liked (using lucide `Heart` with `fill` prop), outline when not
- Subtle scale animation on tap for satisfying feedback

**4. UI updates to `PreviousSermonDetailScreen.tsx`**

- Same heart treatment on previous sermon detail pages so the feature is consistent across the app

**5. Files changed/created**

| File | Action |
|------|--------|
| `supabase/migrations/...` | Create `sermon_likes` table with RLS |
| `src/hooks/useSermonLikes.ts` | New hook for like state and mutations |
| `src/components/fbs/SermonTab.tsx` | Add heart buttons to sermon + takeaways |
| `src/components/fbs/PreviousSermonDetailScreen.tsx` | Add heart buttons (same pattern) |

