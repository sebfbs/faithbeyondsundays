# Current Sprint

## Status: Session 14 complete (2026-05-10). Verified checkmark now shows in community member list AND on public profile screen ✅. iOS safe area padding fixed for all onboarding steps ✅. Church logo replaces FBS logo on public profile username pill ✅. Next session: churchless signup investigation + white-label sign-up screen + QR code flow.

---

## Issues Found During Session 12 Testing (fix next session)

### ~~1. Verified Profile Badge shows earned immediately~~ — FIXED ✅ (Session 13)
- `manually_verified boolean default false` added to `profiles`
- Badge reads `manually_verified` via React Query (not `email_confirmed_at`)
- Full email → `/verify-profile` landing page flow built and tested

### ~~2. Verified checkmark missing from Community page member list~~ — FIXED ✅ (Session 14)
- Blue BadgeCheck now shows in community list (`CommunityScreen.tsx`) and on the public profile screen (`PublicProfileScreen.tsx`)
- `profiles_safe` view updated to expose `manually_verified`
- `CommunityMember` type updated

### 3. Churchless signup — new accounts created without a church
- **Problem:** Signing up directly (not via a church QR code URL) creates an account with no church attached. Prayer and Give pages remain locked after manually joining a church.
- **Note:** This will likely resolve once the QR code → `?church=overflow` URL flow is built. Needs verification after QR flow is implemented.
- **Investigate:** Why do Prayer/Give pages stay locked after a user manually searches and joins a church mid-session?

### ~~4. Onboarding banners cut off — iOS safe area padding needed~~ — FIXED ✅ (Session 14)
- All 4 `pt-14` containers in `OnboardingScreen.tsx` now use `calc(env(safe-area-inset-top, 0px) + 3.5rem)`

### ~~5. Onboarding wizard progress dots cut off~~ — FIXED ✅ (Session 14)
- Same fix as #4 — progress dots now clear the notch/Dynamic Island on all steps

---

## Completed This Sprint (2026-05-05, Session 9)

### Platform Dashboard — Full Audit + Fixes ✅
- Confirmed all 7 tables have correct RLS — platform admin sees data across ALL churches
- **Give Taps fixed** — `give_tap` event now fires in `TabletSidebar.tsx` + `MoreSheet.tsx` via `handleGiveTap` in `Index.tsx`; was always 0 before, will now track correctly
- **Financial Overview fixed** — cost config key mismatch resolved; was reading `lovable_plan_monthly` (not in DB, hardcoded $100 fallback); now reads `base_hosting_monthly` from DB ($25). Labels renamed: "Lovable Plan" → "Vercel + Supabase", "Lovable AI" → "Claude AI"
- **Real storage** — `get_storage_usage_bytes()` SQL function queries actual Supabase Storage; Platform Health card now shows real MB (was estimated guess × sermon count)
- **App Opens note** — small label added: "counts sessions, not raw opens"
- **Sermon pipeline auto-refresh** — `sermon_jobs` query polls every 30 seconds automatically
- **Failures dialog** — "View all N" button on Platform Health opens a dialog showing every failed sermon job with church name, error message, and timestamp. Data refreshes every 30s.

### Church Logo Upload — BUILT, NOT YET TESTED ⚠️
- `logo_url`, `logo_192_url`, `logo_512_url` columns added to `churches` table
- `church-logos` Supabase Storage bucket created (public read, platform-admin write)
- New Church form now has logo upload field with preview thumbnail
- Existing churches: hover over the logo thumbnail in the table → upload icon appears → click to replace logo
- Client-side resize: original PNG + 192×192 + 512×512 generated in browser (HTML Canvas), all 3 uploaded to Supabase Storage
- **NEEDS TESTING:** Create a new church with a logo. Also test updating logo on Overflow Church row.
- **NOTE:** Logo edit for existing churches IS built (hover the thumbnail in the Churches table). No new form needed — uploading a new logo updates all 3 URLs and the manifest auto-serves the new icon.

### Dynamic PWA Manifest — BUILT, NOT YET TESTED ⚠️
- `api/manifest.ts` — Vercel serverless function at `/api/manifest?church=overflow`; reads church name + logo from Supabase, returns per-church `manifest.json` with correct icons
- `index.html` — manifest link is now dynamic; reads `?church=` from URL (or `fbs_church_code` from localStorage), points to `/api/manifest?church=X` when church is known; falls back to static `/manifest.json`
- Also stores church code in localStorage so future visits (e.g. from home screen icon) still get the right manifest
- **NEEDS TESTING:** Visit `[vercel-url]/?church=overflow` → DevTools → Application → Manifest → should show Overflow Church name + logo

### Architecture Documented in Brain ✅
- `Decisions Log.md` — new entry (2026-05-05) explaining how logo upload + dynamic manifest + QR code are one interconnected flow
- `PWA Install Flow.md` — white labeling section updated (was hardcoded config file, now Supabase); manifest section updated to show dynamic approach
- Platform admin login: created `sebastian@faithbeyondsundays.com` account, added to `platform_admins` table

---

## Completed This Sprint (2026-05-04, Session 7)

### Supabase URL Mismatch — RESOLVED ✅
- `.env` updated to point to the correct Supabase project
- `@seb` auth user re-created (UUID: `81555592-3f81-429e-ad7f-623b0e4b6014`)
- Profile + admin role re-wired to Overflow Church
- App now connects to the correct database

### Admin Login — Google OAuth Removed ✅
- Admin login is email/password only
- Cleaner, simpler, correct for a small known group (pastors/staff)

### Announcements — Fully Tested + Polished ✅
- End-to-end confirmed: post from admin → appears on member home screen → dismiss works → expiry works
- Added `title` column — bold title + muted body on both admin and member side
- Added `expires_at` column — dropdown (1 day / 3 days / 1 week / 2 weeks / No expiry), defaults to 1 week
- Member query filters out expired announcements automatically
- Admin list shows expiry time next to posted timestamp

---

## Completed This Sprint (2026-05-04, Session 6)

### Bible Reader Defaults + First-Open Tooltip — DONE
- Default reading preferences changed: Serif font, A+ size (20px), White background
- Defaults only apply to first-time users (localStorage values override for returning users)
- First-open tooltip added: "Tap Aa to customize your reading" bubble appears above the Aa button on first chapter open
- Text behind tooltip blurs (`filter: blur(3px)`) until dismissed — focus drawn to Aa button
- Tooltip dismisses on any tap (400ms delay before listener fires, prevents immediate dismissal from chapter-select tap)
- localStorage flag: `bible-tooltip-shown` — fires once per device, never again

### Admin Login Sky Gradient — DONE
- `AdminLogin.tsx` now uses `getSkyGradient()` imported from `HomeTab.tsx`
- Matches the member app's dynamic time-of-day sky gradient exactly

### Announcements Feature — BUILT ✅ (tested Session 7)
**DB:** `announcements` table with RLS, `title`, `body`, `link_url`, `expires_at` columns
**Admin dashboard:** `AdminAnnouncements.tsx` at `/admin/announcements` — title + body + link + expiry dropdown
**Member home screen:** Dismissible cards above Daily Spark — bold title, muted body, "Learn more" link, auto-expiry filter
**Push notifications:** Deferred — Web Push (VAPID) is the correct path, planned as dedicated sprint

### Overflow Church + Admin Account Setup — DONE
- Overflow Church in Supabase (`id: 5e7a9458-24e3-4ed9-b798-db629a2120a1`, code: `overflow`)
- `@seb` (Sebastian Perez, `sebmattiasperez@gmail.com`) linked to Overflow Church with admin role

---

## Completed This Sprint (2026-05-05, Session 8)

### White-Label Copy Audit — DONE ✅
- All hardcoded "Faith Beyond Sundays" strings removed from member-facing app and admin headlines
- `HomeTab` empty state now shows `{churchName}` dynamically (from `useProfile()` → `churches` join)
- `AuthScreen` welcome screen: FBS logo + title removed, "Try the Demo" link removed
- `AdminLogin` subtitle cleaned up: "Sign in to manage your church"
- Alt text cleaned on `TabletSidebar` and `PublicProfileScreen`
- White-label sign-up screen spec (with church logo + QR code) saved to backlog below

---

## Completed This Sprint (2026-05-07, Session 11)

### App Short Name + Church Onboarding SOP ✅
- `app_short_name VARCHAR(15)` column added to `churches` table
- **3-step name-check flow** on church detail page: Step 1 = copy name + test on real phone via Safari PWA; Step 2 = confirm fit or flag as too long; Step 3 = set short name with char counter + auto-save (green ✓ on save)
- `api/manifest.ts` now uses `app_short_name` if set, falls back to full name
- Long-name warning (>15 chars) in New Church form
- `FBS Brain/04 - Operations/Church Onboarding SOP.md` created — 4-phase onboarding checklist (platform setup → admin setup → internal PWA test → go live)

---

## Completed This Sprint (2026-05-07, Session 10)

### Church Logo Card on Detail Page ✅
- `PlatformChurchDetail.tsx` — new "Church Logo" card always visible between stats and Church Admin card
- Shows current logo (or "No logo" placeholder), status badge (green ✓ / amber), description, size note, and Change/Upload Logo button — always present regardless of whether a logo exists
- Upload resizes to 3 sizes, saves to Supabase Storage, updates DB, shows spinner during upload

### PWA Auto-Update Pipeline — Fixed ✅
- `vercel.json` — `no-cache` headers on `/`, `/index.html`, and `/sw.js`; `/assets/*` immutable
- `vite.config.ts` — removed `html` from SW precache glob so HTML is never served from cache
- `main.tsx` — `controllerchange` listener reloads page when new SW takes over (fixed broken `onNeedRefresh` approach)
- Root cause: `source: "/index.html"` didn't match requests to `/` — fixed by adding explicit `/` rule

### PWA Icon — Church Logo Now Shows ✅
- `index.html` — removed static `<link rel="apple-touch-icon">` that was overriding manifest icons on iOS
- `index.html` — cleared `apple-mobile-web-app-title` so manifest `short_name` wins
- `api/manifest.ts` — removed 12-char truncation on `short_name` so full church names display
- Tested: Overflow Church PWA icon shows OVF logo, name shows "Overflow Church" ✅

---

## What's Next

1. **`app_short_name` field for long church names** *(next task)*
   - Add optional `app_short_name` column to `churches` table
   - Edit field on `PlatformChurchDetail.tsx` church detail page (platform admin sets it)
   - `api/manifest.ts` uses `app_short_name` if set, falls back to first 2 words of church name
   - Example: "Cornerstone Community Church" → admin sets "Cornerstone" or "CCC"

2. **Email hook setup** — Re-configure Resend + Supabase auth email hook on the new project. Currently broken — "Hook requires authorization token." Blocks password reset and admin invite emails.

3. **White-label sign-up screen** — Auth screen reads `?church=` from URL, fetches and shows that church's logo + name. Member auto-linked to that church on sign-up.

4. **End-to-end app walkthrough** — Walk through every screen as a member, document what works vs what's broken.

5. **QR code → church landing page flow** — PWA install wizard per device type. Full spec in `02 - Backlog/PWA Install Flow.md`.

---

## Task Spec: Full White-Label Language Audit + Church Name Everywhere

**Decision (2026-04-30):** Every word a member reads inside the app should feel like it's coming from their church — not from Faith Beyond Sundays. FBS is the invisible engine. The church is the voice. This task is a full copy audit across the entire member-facing app.

### The principle
- ❌ "Welcome to Faith Beyond Sundays" 
- ✅ "Welcome to Overflow Church"
- ❌ "Faith Beyond Sundays helps you stay connected"
- ✅ "Stay connected with your church family"
- ❌ Any UI copy that names or implies FBS as the speaker
- ✅ Copy that sounds like the church speaking to its own congregation

### What to do
**Step 1 — Audit:** Search the entire `src/` directory for every instance of:
- `"Faith Beyond Sundays"` (hardcoded string)
- `"FBS"` (abbreviated brand name in UI copy)

Grep commands to run:
```bash
grep -r "Faith Beyond Sundays" src/
grep -r '"FBS"' src/
```

**Step 2 — Replace:** For every hardcoded "Faith Beyond Sundays" string:
- Replace with `{churchName}` pulled dynamically from the church's record in Supabase
- The church name lives on the `churches` table, accessible via the member's `church_id` on their `profiles` row
- If church name is already in context (AuthProvider or similar), use that — no redundant fetches

**Step 3 — Tone fixes:** Copy that doesn't name FBS but sounds corporate/SaaS-y should be rewritten to sound like the church is speaking.

### Key files to audit
- `src/components/fbs/HomeTab.tsx` — confirmed has hardcoded empty state
- `src/components/fbs/OnboardingScreen.tsx`
- `src/components/fbs/AuthScreen.tsx`
- `src/components/fbs/SermonTab.tsx`
- `src/components/fbs/JournalTab.tsx`
- `src/components/fbs/CommunityScreen.tsx`
- `src/components/fbs/PrayerScreen.tsx`

### Church name data flow
- `churches` table → `name` column = the church's display name
- Member's `profiles` row → `church_id` foreign key → look up church name once on app load
- Store in context (AuthProvider or new ChurchContext) so every component can access it without re-fetching
- Fallback: if church name is null, use `"your church"` — never "Faith Beyond Sundays"

### Acceptance criteria
- Zero instances of "Faith Beyond Sundays" visible to members
- Zero instances of "FBS" in member-facing UI copy
- All empty states use `{churchName}` or church-voiced generic language
- App builds clean with zero TypeScript errors

---

## Backlog — Church Identity Flow (Build After QR + Logo Upload)

### White-Label Sign-Up Screen
When a member scans a church's QR code, the sign-up screen should show that church's logo and name — not a generic screen. Full spec:
- QR code encodes `?church_id=xxx` in the URL
- Auth screen reads `church_id` from URL on load
- Fetches church name + logo from `churches` table
- Displays church logo + "Welcome to {churchName}" above the sign-in buttons
- Member who signs up is automatically linked to that church via `church_id`
- Requires: church logo upload (platform dashboard) + QR code flow to be built first

---

## Backlog (Do Not Touch Until App Is Functional)

### Kids Mode — Virtual Pet + Games
Build when V1 is fully launched. See previous sprint for full spec.

### Pastor Feed — Full Content Types (V2)
Expand V1 announcements into photos, videos, polls, feedback. Build when V1 announcements are live with real churches.

### PWA Install Flow — Landing Page + Device Wizard
Full game plan saved at: `FBS Brain/02 - Backlog/PWA Install Flow.md`
