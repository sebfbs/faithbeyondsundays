

# Platform Owner Panel -- Build Plan

## Overview

Build your personal command center at `/platform/*` where you (Sebastian) get a complete top-down view of every church account, all members across the platform, and platform-wide analytics. This gets built first so you can create and manage church accounts before onboarding any churches.

## Database Changes

### 1. New table: `platform_admins`
Stores platform-level superadmin access, completely separate from church roles.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (unique) | Your auth user ID |
| created_at | timestamptz | Auto-set |

RLS policies:
- SELECT: Only rows where `is_platform_admin(auth.uid())` returns true
- No INSERT/UPDATE/DELETE from client (managed via backend only)

### 2. New function: `is_platform_admin(user_id)`
A security definer function that checks the `platform_admins` table. Used in RLS policies to gate platform-level access without recursion issues.

### 3. New table: `analytics_events`
Tracks member interactions for both church admin and platform dashboards.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| church_id | uuid | Which church the user belongs to |
| user_id | uuid | Who performed the action |
| event_type | text | e.g. `app_open`, `give_tap`, `sermon_view` |
| metadata | jsonb | Optional extra data |
| created_at | timestamptz | When it happened |

RLS policies:
- INSERT: Members can insert their own events (`user_id = auth.uid()`)
- SELECT: Platform admins can read all events; church admins can read their church's events
- No UPDATE/DELETE from client

### 4. Update churches table RLS
Add a SELECT policy so platform admins can view all churches (currently only publicly readable, but we need admin-level write access too). Add an ALL policy for platform admins to manage any church.

## Pages and Routes

| Route | Page | What it does |
|-------|------|-------------|
| `/platform` | Platform Login | Login screen, checks `platform_admins` table |
| `/platform/dashboard` | Dashboard | Platform-wide analytics |
| `/platform/churches` | Churches List | All church accounts with member counts |
| `/platform/churches/:id` | Church Detail | Deep-dive into a specific church |

## Platform Login Flow
1. You visit `/platform` and see a clean login form
2. You log in with `sebastian@faithbeyondsundays.com`
3. The app checks `platform_admins` for your user ID
4. If found, you're redirected to `/platform/dashboard`
5. If not found, you see "Access Denied" with a link back to the member app
6. After you sign up for the first time, I'll seed your account into `platform_admins` via a backend SQL command

## Platform Dashboard
- Total churches (active count)
- Total members across all churches
- New signups over time (line chart)
- Most active churches (ranked by member engagement)
- Platform-wide sermon count
- Platform-wide Give tap count
- App opens across all churches

## Churches Management
- Table listing all churches with: name, city/state, member count, active status, date created
- Click a church to see its detail page
- Create new church account (name, code, city, state)
- Activate / deactivate a church
- Church detail page shows that church's analytics (same data their admin would see)

## New Files

```text
src/pages/platform/PlatformLogin.tsx        -- Login gate with platform_admins check
src/pages/platform/PlatformLayout.tsx       -- Sidebar + content area wrapper
src/pages/platform/PlatformDashboard.tsx    -- Platform-wide analytics
src/pages/platform/PlatformChurches.tsx     -- Church accounts list
src/pages/platform/PlatformChurchDetail.tsx -- Individual church deep-dive
src/hooks/usePlatformAuth.ts               -- Hook: checks platform_admins table
src/hooks/usePlatformAnalytics.ts           -- Hook: fetches platform-level stats
```

## Route Updates in App.tsx
New routes added alongside existing member routes:
```text
/platform               -> PlatformLogin
/platform/dashboard     -> PlatformLayout > PlatformDashboard
/platform/churches      -> PlatformLayout > PlatformChurches
/platform/churches/:id  -> PlatformLayout > PlatformChurchDetail
```

## Design Approach
- Clean, professional design using existing Tailwind setup and shadcn/ui components
- Sidebar navigation with: Dashboard, Churches
- Your name and email shown in sidebar header
- Responsive layout (works on desktop and tablet)
- Uses existing `recharts` library for charts
- Color scheme: neutral/dark sidebar to visually distinguish from the member app

## Bootstrapping Your Account
1. You sign up at the member app with `sebastian@faithbeyondsundays.com`
2. I run a one-time SQL command: `INSERT INTO platform_admins (user_id) VALUES ('<your-user-id>')`
3. You can then access `/platform` and see everything

## Build Order
1. Database migration: `platform_admins` table, `is_platform_admin` function, `analytics_events` table, RLS policies
2. `usePlatformAuth` hook (checks platform admin status, redirects if unauthorized)
3. Platform Login page
4. Platform Layout (sidebar + outlet)
5. Platform Dashboard with analytics queries
6. Churches list page
7. Church detail page
8. Wire `app_open` event tracking in the member app (logs to `analytics_events` on app load)

