# Known Issues

## High Priority

- **Sermon pipeline step tracker not built yet** — Admin sees "Transcribing audio…" for 5-15 min with no progress indication. Spec is in Current Sprint. Build next session.

- **`send-church-request` Edge Function not deployed** — The church request form ("Don't see your church?") in FindChurchScreen returns an error for every user right now. Edge Functions are never deployed automatically on git push. Fix: run `npx supabase functions deploy send-church-request` in terminal. Found by automated review 2026-05-11.

- ~~**Church branding doesn't show for first-time QR code visitors**~~ — FIXED ✅ Session 16. `ChurchLandingPage` now renders for `/?church=` URLs and writes church info to localStorage before the user ever sees the sign-up screen.

- **Churchless signup flow** — New members signing up without a church QR code URL are created churchless. Prayer/Give pages stay locked even after manually joining a church mid-session. Likely resolves once QR code → `?church=` URL flow is built. Needs investigation.

- `APNS_BUNDLE_ID` not yet set in Supabase Edge Function secrets — iOS push notifications will error until configured. Note: APNS/FCM is wrong for a PWA anyway — Web Push (VAPID) is the correct path and is planned as a dedicated sprint.

## Medium Priority

- **Google OAuth users have no password** — If a user signs up via Google on the member app and later needs admin access, they won't have a password for the admin login. Workaround: use Forgot Password (once email hook is fixed) or set directly via SQL. In production this is rare since admins are invited via email.

## Low Priority

- `README.md` still contains Lovable links — should be replaced with real FBS readme
- `monitor_log` table has no RLS (`UNRESTRICTED` label visible in Supabase Table Editor) — low risk but should be addressed before production launch
- Old unused tables from original Lovable build still exist in the DB (SMS-related tables, etc.) — harmless but worth cleaning up eventually

---

## Unverified (Built, Not Tested)

_(nothing currently unverified)_

---

## Resolved

- ~~**Supabase URL mismatch**~~ — resolved 2026-05-04 (Session 7). `.env` now points to correct project.
- ~~**announcements_created_by_fkey constraint error**~~ — resolved 2026-05-04. FK referenced `profiles(id)` instead of `auth.users(id)`. Constraint dropped.
- ~~Lovable cloud auth dependency (`@lovable.dev/cloud-auth-js`)~~ — removed 2026-04-27.
- ~~`lovable-tagger` dev dependency~~ — removed 2026-04-27.
- ~~`auth-email-hook` using Lovable email service~~ — rewritten 2026-04-27, now uses Resend. (Note: needs re-wiring in new Supabase project.)
- ~~`process-sermon` using Lovable AI gateway~~ — rewritten 2026-04-27, now uses Anthropic API.
- ~~`generate-daily-content` using Lovable AI gateway~~ — rewritten 2026-04-27.
- ~~`transcribe-journal` using Lovable AI gateway~~ — rewritten 2026-04-27.
- ~~Streak badges won't fire~~ — resolved 2026-05-01.
- ~~Founding Member backfill~~ — resolved 2026-05-01.
- ~~**Logo upload unverified**~~ — tested and working 2026-05-07 (Session 10). All 3 sizes upload correctly.
- ~~**Dynamic PWA manifest unverified**~~ — tested and working 2026-05-07 (Session 10). `/api/manifest?church=overflow` returns correct logo + name. iOS PWA icon shows church logo.

---

_Update this file whenever a new bug is found or an existing one is resolved._
