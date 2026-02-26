

## Lock Down Prayer Request Visibility

### Problem
The current RLS policy "Members can view church prayer requests" allows any authenticated church member to SELECT prayer requests with `visibility = 'church'` in their church. While the app UI only shows users their own prayers, the database layer permits broader access. Prayer requests should be strictly private -- only visible to the person who submitted them and to church admins/owners/pastors.

### Changes

**1. Database migration: Replace the member-visible policy with an admin-only policy**

- **DROP** the existing policy "Members can view church prayer requests" on `prayer_requests` -- this is the one that lets any church member read `visibility = 'church'` prayers
- **CREATE** a new policy "Church admins can view all prayer requests" that grants SELECT access only to users with `admin`, `owner`, or `pastor` roles in the prayer's church
- The existing "Users can manage their own prayers" policy remains unchanged -- users can still see and manage their own prayer requests

```sql
-- Remove the policy that lets all church members see prayers
DROP POLICY IF EXISTS "Members can view church prayer requests" ON public.prayer_requests;

-- Allow church leadership to see all prayers in their church
CREATE POLICY "Church admins can view all prayer requests"
  ON public.prayer_requests FOR SELECT
  USING (
    has_role_in_church(auth.uid(), church_id, 'admin'::app_role) OR
    has_role_in_church(auth.uid(), church_id, 'owner'::app_role) OR
    has_role_in_church(auth.uid(), church_id, 'pastor'::app_role)
  );
```

**No frontend changes needed.** The PrayerScreen already filters by `user_id = authUser.id`, and AdminPrayer already queries by `church_id`. Once the RLS is updated, both will continue working correctly -- members see only their own, admins see all.

### Result after fix

| Who | What they can see |
|-----|-------------------|
| Regular member | Only their own prayer requests |
| Admin / Owner / Pastor | All prayer requests in their church |
| Other churches | Nothing -- church_id scoping prevents cross-church access |

### Files Changed

| File | Change |
|------|--------|
| Database migration | Drop member SELECT policy, add admin-only SELECT policy on `prayer_requests` |

