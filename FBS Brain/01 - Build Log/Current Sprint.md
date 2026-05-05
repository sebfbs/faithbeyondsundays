# Current Sprint

## Status: White-label audit COMPLETE ✅. Next: platform dashboard walkthrough + church logo upload.

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

## What's Next

1. **Platform dashboard walkthrough** — Log into `/platform` with Sebastian, walk every screen, then add church logo upload to the New Church form (file input + Supabase Storage + `logo_url` column on `churches` table)
2. **White-label sign-up screen** — *(blocked until QR code + logo upload are built)* Auth screen reads `church_id` from URL, fetches and shows that church's logo + name. Spec in backlog below.
2. **Platform owner dashboard walkthrough** — Log into `/platform`, walk every screen with Sebastian, then add church logo upload to the "New Church" form. Logo upload needs: file input in `PlatformChurches.tsx` create dialog + Supabase Storage bucket for church logos + `logo_url` column on `churches` table.
3. **Email hook setup** — Re-configure Resend + Supabase auth email hook on the new project. Currently broken — "Hook requires authorization token." Blocks password reset and admin invite emails.
4. **End-to-end app walkthrough** — Walk through every screen as a member, document what works vs what's broken.
5. **QR code → church landing page flow** — PWA install wizard per device type.

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
