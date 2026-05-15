[[09 - Code Review]]

# FBS Daily Code Review — 2026-05-11

## What Was Pushed

Two commits landed today for Session 15. The main work eliminates the "churchless signup" problem by routing visitors to a Find Your Church search screen when they arrive at the root URL without a church code. A new `send-church-request` Edge Function writes church requests to the database and emails Sebastian when someone submits a request for their church to be added. The Platform Dashboard now shows those incoming requests with a "Mark Contacted" toggle.

---

## Automated Scan Results

- **TypeScript:** PASSED — 0 errors
- **New dependencies:** None
- **Hardcoded localhost/URLs:** None found
- **Secrets in client code:** `SUPABASE_SERVICE_ROLE_KEY` appears in diff — correctly located inside `supabase/functions/send-church-request/index.ts` (Edge Function only). Not a violation.
- **Unsafe VITE_ variables:** None found
- **Sensitive data in logs:** None found
- **Debug artifacts left in code:** None found
- **.env modified:** Not touched
- **New migrations added:** None committed — SQL was run manually in Supabase SQL Editor this session (see Migrations Reminder below)
- **Edge Functions changed (need deploy):** `send-church-request` — NEW, must be deployed manually before the church request form works

---

## 🔴 Critical Issues — Fix Before Next Push

None found.

---

## 🟡 High Issues

### 1. `send-church-request` Edge Function is NOT deployed — church request form is broken right now

**What's wrong:** The new Edge Function (`supabase/functions/send-church-request/index.ts`) was committed to the repo and is wired up in the app, but it has never been deployed to Supabase. Edge Functions do NOT deploy automatically when you push to GitHub — they require a separate manual command.

**Where:** `src/components/fbs/FindChurchScreen.tsx` line 60 calls `supabase.functions.invoke("send-church-request", ...)`.

**What a real user experiences:** A visitor opens the Find Your Church screen, fills in the "Don't see your church?" form, and clicks "Request My Church." They see a spinner for several seconds, then see: "Something went wrong. Please try again." Their request is never saved and Sebastian never receives the email. This is the live state of the app right now until you run the deploy command.

**Fix:** Run this command in your terminal:
```bash
npx supabase functions deploy send-church-request
```

---

### 2. Church branding won't show for first-time visitors arriving via QR code

**What's wrong:** When a new member scans a church QR code (`/?church=overflow`), `ChurchGateway` passes them straight to `Index.tsx`. `Index.tsx` has a `useEffect` that fires a database call to look up the church name and save it to localStorage. But `AuthScreen` reads from localStorage during its very first render — before that database call has come back. So `AuthScreen` finds nothing in localStorage and shows the generic text "Stay connected to Sunday's message all week long" instead of the church logo and "Welcome to Overflow Church."

**Where:** `src/pages/Index.tsx` line 98–113 (the `useEffect` that sets `fbs_church_name` in localStorage) vs. `src/components/fbs/AuthScreen.tsx` line 17 (the `useState(getChurchBranding)` call that reads localStorage once and never updates).

**What a real user experiences:** A pastor shares the QR code with their congregation. A member scans it. They land on the sign-up screen and see a generic sky gradient with "Stay connected to Sunday's message all week long" — no church logo, no church name. The white-label experience that Session 15 was meant to deliver does not appear. (The branding DOES appear on any *return* visit after localStorage has been populated, so this only affects the critical first impression.)

**Why this happens technically:** React's `useState(initializer)` only runs the initializer function once, at mount time. By the time the async DB call in `Index.tsx` writes the church name to localStorage 200–500ms later, `AuthScreen` is already rendered and its state is frozen. It never re-reads localStorage.

**Fix options (for the next session):** The cleanest fix is to activate `ChurchLandingPage.tsx` (which writes to localStorage *before* navigating to the app) as the landing page for `/?church=overflow`. This is already planned as the next session's task. Alternatively, pass the church name down as a prop instead of relying on localStorage.

---

## 🟠 Medium Issues

### 1. No spam protection on the public `send-church-request` endpoint

**What's wrong:** The `send-church-request` Edge Function intentionally accepts requests from users who are not logged in — they don't have accounts yet. That's correct. But there is no rate limiting of any kind. Anyone who finds the endpoint URL (which is public in the JS bundle) could write a script that submits 500 fake church requests in 10 seconds. This would fill the `church_requests` database table with junk AND flood Sebastian's inbox via Resend, potentially exhausting any email quota.

**Where:** `supabase/functions/send-church-request/index.ts` — no rate limiting logic present.

**Impact:** Not urgent for a product this early, but should be addressed before public launch. A simple fix is to check the requester's IP address against a rate limit (Supabase Edge Functions have access to the request headers) or add a simple honeypot field to the form.

---

### 2. `toggleContacted` on Platform Dashboard has no error handling and no loading guard

**What's wrong:** When Sebastian clicks the circle/checkmark to mark a church request as contacted, it fires a Supabase update and then calls `refetchRequests()`. Two problems: (1) if the update fails, no error is shown — it silently does nothing and the UI might refetch and show the old state with no explanation; (2) there's no loading state, so clicking the button rapidly fires multiple simultaneous updates.

**Where:** `src/pages/platform/PlatformDashboard.tsx` line 48–51.

**What Sebastian experiences when it fails:** He clicks the checkmark, it doesn't change, and there's no error message. He'd click again, not knowing why it didn't work.

---

### 3. No timeout on the Resend API call inside `send-church-request`

**What's wrong:** The Edge Function makes a `fetch()` call to Resend with no timeout or `AbortController`. If Resend is slow or down, the fetch will hang until Supabase kills the Edge Function execution (typically 30–60 seconds). During that time, the user sees a spinner. The DB record was already saved (the insert happens before the email call, which is good design), but the user won't see a success response until the timeout.

**Where:** `supabase/functions/send-church-request/index.ts` line 49.

---

### 4. New database schema not tracked in migration files

**What's wrong:** Two schema changes were made this session by running SQL directly in Supabase SQL Editor:
- `ALTER TABLE profiles ADD COLUMN joined_via TEXT DEFAULT 'church_link'`
- New `church_requests` table with RLS and 3 policies

These changes are NOT recorded in any `supabase/migrations/` file. The code now depends on both of these (`OnboardingScreen.tsx` inserts `joined_via`, and `PlatformDashboard.tsx` queries `church_requests`). If the production database were ever reset or cloned, these columns/tables wouldn't exist and both features would break at the database level.

**Immediate risk:** Low — the SQL was already run in production. But worth adding migration files as a housekeeping task.

---

## 🔵 Low / Nice-to-Fix

- **`send-church-request/index.ts` — HTML injection in email body.** The church name, email, and requester name are directly interpolated into HTML (`<p>${church_name.trim()}</p>`) with no escaping. Someone could submit `<b>injected</b>` text and it would render as bold in Sebastian's email. The email only goes to Sebastian's inbox so there's no public exposure, and modern email clients handle this safely — but it's a code smell. Use a plain-text email format or HTML-encode the values.

- **`/app` route bypasses `ChurchGateway`.** `App.tsx` has a `<Route path="/app" element={<Index />} />` that goes straight to the main app without the church code check. A user who navigates directly to `/app` can access the member app with no church context. This is probably intentional as a developer/testing route, but it means the "churchless signup is architecturally impossible" claim in the build log isn't 100% accurate.

- **`Index.tsx` useEffect has an empty dependency array but reads `location.search`.** Line 98–113: `const churchCode = new URLSearchParams(location.search).get("church")` is inside a `useEffect(..., [])`. If `location.search` changes after mount (e.g., navigation within the same component), the effect won't re-run. In practice this is unlikely to cause problems, but `location` should be in the dependency array to be correct.

---

## Architectural Invariants Check

- **Invariant 1 (Secrets only in Edge Functions):** Checked — clean. `SUPABASE_SERVICE_ROLE_KEY` is only used inside `supabase/functions/`.
- **Invariant 2 (JWT validation before paid API calls):** The `send-church-request` function calls Resend (a paid email API) with no JWT validation. This is intentional by design (the requester has no account), but it means the invariant is technically not met. Flagged as Medium — needs spam protection before public launch.
- **Invariant 3 (RLS on every new table):** Checked — `church_requests` table has RLS enabled and 3 policies (documented in build log as run via SQL Editor). Clean in production.
- **Invariant 4 (VITE_ vars are public):** Checked — clean. No new VITE_ variables added.
- **Invariant 5 (Church data isolation):** Checked — clean. `FindChurchScreen` queries only public fields (name, code, logo). No cross-church data exposure.

---

## Product Rules Check

All CLAUDE.md hard rules checked — clean. No push happened without approval, `.env` was not touched, no DB schema changes were made without documentation (SQL was run manually and documented in the build log), no refactoring of working code, and no batching of unrelated tasks.

---

## Known Issues — Status Check

- **Churchless signup flow** — Improved. The new routing makes it architecturally harder to sign up without a church code. However, the `/app` route still bypasses ChurchGateway, and the timing issue with localStorage (High Issue #2) means a user who selects their church via FindChurchScreen and then creates their profile might still end up with `church_id = null` if the async DB lookup failed silently. The "Prayer/Give stay locked after joining mid-session" sub-issue is not addressed by this change.
- **`APNS_BUNDLE_ID` not set** — Unchanged.
- **Google OAuth users have no password** — Unchanged.
- **`monitor_log` table has no RLS** — Unchanged.
- **Old unused tables from Lovable build** — Unchanged.

---

## Stress Test Results

Checked all 10 scenarios for new code:

1. **Double-click upload** — Not applicable (no upload button changed).
2. **Network drop mid-upload** — Not applicable.
3. **AI generation partial failure** — Not applicable.
4. **Member opens app with no sermon** — Not changed.
5. **Edge Function timeout** — `send-church-request` has no fetch timeout on the Resend call. Flagged as Medium Issue #3.
6. **Demo mode leak** — Not applicable to these changes.
7. **Back-to-back uploads** — Not applicable.
8. **Member with no church assigned** — The new onboarding code reads `fbs_church_id` from localStorage, which is set by an async DB call in Index.tsx. If that call fails silently (network drop, Supabase down), the profile insert will create a churchless user with no visible error. Flagged as Medium Issue #4 (related).
9. **RLS blocking legitimate access** — `church_requests` RLS correctly allows anon inserts and platform-admin reads. Platform Dashboard query will work for Sebastian. Clean.
10. **Edge Function cold start** — `FindChurchScreen` correctly sets `submitting = true` before the async call, so the button is immediately disabled. Double-invocation is handled. Clean.

---

## Edge Functions Deployment Reminder

**⚠️ Action required — the church request form is broken until this is run:**

```bash
npx supabase functions deploy send-church-request
```

---

## Migrations Reminder

These schema changes were applied manually in the Supabase SQL Editor this session. They are NOT in any migration file. If needed for reference, here is the exact SQL that was run:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joined_via TEXT DEFAULT 'church_link';

CREATE TABLE IF NOT EXISTS church_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  contacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE church_requests ENABLE ROW LEVEL SECURITY;
-- 3 RLS policies: insert for anon, select for platform_admin, update for platform_admin
```

Consider adding these to `supabase/migrations/` as a record-keeping step.

---

## Verdict

The core app is safe in production — no data breach risks, no broken auth, no TypeScript errors. But the `send-church-request` Edge Function has not been deployed, which means the church request form (the "Don't see your church?" section) returns an error for every user who tries it right now. Deploy that function before sharing the Find Your Church screen with anyone.
