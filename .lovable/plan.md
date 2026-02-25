

## Add "Team" Page to Church Admin Dashboard

### Overview
A new "Team" tab in the church admin sidebar lets existing owners/admins invite additional team members (admin or pastor roles) by email. Invited people receive a branded email and go through the existing admin onboarding flow at `/admin/setup`.

### What you'll see
- A new "Team" item in the admin sidebar (between Notifications and Settings)
- A page showing all current team members (owners, admins, pastors) with their name, email, role, and join date
- An "Invite Team Member" button that opens a dialog where you enter an email and pick a role (Admin or Pastor)
- The invited person gets a branded email saying they've been invited to help manage the church, with a "Get Started" button
- Clicking the link takes them through the existing admin setup flow (name, password, username)

### Changes

**1. New backend function: `supabase/functions/invite-church-admin/index.ts`**
- Accepts `church_id`, `email`, and `role` (admin or pastor)
- Verifies the caller has owner or admin role in that specific church (not platform admin -- church-level authorization)
- Uses service role to find or create the user account
- Assigns the chosen role + creates a profile row (with `onboarding_complete: false`)
- Generates a recovery link pointing to `/admin/setup`
- Sends a branded invite email via Resend with the church name, matching the existing email style (gradient background, white card, amber CTA button)
- Registered in `supabase/config.toml` with `verify_jwt = false`

**2. New page: `src/pages/admin/AdminTeam.tsx`**
- Lists all users with owner/admin/pastor roles for this church
- Each row shows: name (from profiles), role badge (color-coded), and join date
- Email is fetched via the existing `get-user-email` edge function (same pattern used in platform church detail)
- "Invite Team Member" button opens a dialog with email input and role selector (Admin / Pastor)
- Only owners and admins can invite; the invite button is visible to both
- Owners can remove admins/pastors (delete their role row); nobody can remove an owner

**3. Update sidebar: `src/pages/admin/AdminLayout.tsx`**
- Add `{ title: "Team", url: "/admin/team", icon: UserCog }` to the nav items array, placed after Notifications

**4. Add route: `src/App.tsx`**
- Lazy-load `AdminTeam` and add `<Route path="team" element={<AdminTeam />} />` inside the admin layout routes

### Security
- The edge function validates the caller's role server-side using `has_role_in_church` before proceeding
- Only owners and admins can invite (pastors cannot invite others)
- Only owners can remove team members
- Uses existing RLS policies on `user_roles` (admins can manage roles in their church)
- No new database tables needed -- uses existing `user_roles` and `profiles` tables

### No database migration needed
All required tables (`user_roles`, `profiles`) and the `app_role` enum (which already includes admin and pastor) exist. The existing RLS policy "Admins can manage roles in their church" already allows owners/admins to insert/delete role rows.

