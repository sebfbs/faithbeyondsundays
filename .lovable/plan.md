# Church Admin Panel

## Overview
Separate admin experience at `/admin` for church leaders (owner/admin/pastor roles) to manage their church's content, members, and settings. Uses the member app's design system (light theme with amber accents).

## Architecture
- **Route**: `/admin` with nested routes, dedicated login at `/admin/login`
- **Auth**: Role-gated — requires `owner`, `admin`, or `pastor` role in `user_roles` table
- **Layout**: Responsive sidebar (collapsible on mobile) with 7 nav items
- **Design**: Uses member app's semantic design tokens (not dark theme)

## Phases — All Complete ✅

### Phase 1 — Foundation & Auth ✅
- `useChurchAdminAuth` hook — checks user_roles for admin/owner/pastor
- `/admin/login` — dedicated login page with access denied handling
- `AdminLayout` — sidebar nav, mobile hamburger menu, sign out

### Phase 2 — Sermon Management ✅
- Sermon list with status badges, publish/draft toggle, set current
- Upload dialog with file upload or YouTube link modes
- Calls existing `upload-sermon` edge function

### Phase 3 — Member Management ✅
- Member list with search
- Role assignment via dropdown (owner/admin/pastor/leader/member)

### Phase 4 — Church Settings ✅
- Edit church profile (name, city, state, website, Instagram, giving URL)

### Phase 5 — Groups, Prayer, Notifications ✅
- Community groups CRUD with active/inactive toggle
- Feature flags management (community, prayer, giving)
- Prayer request moderation view
- Push notification composer with recent log history
- New `church_feature_flags` table with RLS

### Phase 6 — Church Analytics ✅
- Dashboard with summary cards (sermons, members, active 7d/30d)
- 14-day daily active users bar chart
- Content stats and top event types (30d)

## Files
- `src/hooks/useChurchAdminAuth.ts`
- `src/pages/admin/AdminLogin.tsx`
- `src/pages/admin/AdminLayout.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminSermons.tsx`
- `src/pages/admin/AdminMembers.tsx`
- `src/pages/admin/AdminGroups.tsx`
- `src/pages/admin/AdminPrayer.tsx`
- `src/pages/admin/AdminNotifications.tsx`
- `src/pages/admin/AdminSettings.tsx`
