# Known Issues

## High Priority

- **Email hook not configured in new Supabase project** — When the Supabase project was switched (Session 7), the Resend + auth email hook setup from Session 1 was left behind on the old Lovable project. Currently: password reset emails fail with "Hook requires authorization token." This blocks password reset AND admin invite emails. Fix: re-configure the auth email hook in the new project dashboard (Auth → Hooks → Send Email) pointing to the `auth-email-hook` edge function, and set `HOOK_SECRET` + `RESEND_API_KEY` in Edge Function secrets.

- `APNS_BUNDLE_ID` not yet set in Supabase Edge Function secrets — iOS push notifications will error until configured. Note: APNS/FCM is wrong for a PWA anyway — Web Push (VAPID) is the correct path and is planned as a dedicated sprint.

## Medium Priority

- **Google OAuth users have no password** — If a user signs up via Google on the member app and later needs admin access, they won't have a password for the admin login. Workaround: use Forgot Password (once email hook is fixed) or set directly via SQL. In production this is rare since admins are invited via email.

## Low Priority

- `README.md` still contains Lovable links — should be replaced with real FBS readme
- `monitor_log` table has no RLS (`UNRESTRICTED` label visible in Supabase Table Editor) — low risk but should be addressed before production launch
- Old unused tables from original Lovable build still exist in the DB (SMS-related tables, etc.) — harmless but worth cleaning up eventually

---

## Unverified (Built, Not Tested)

- **Logo upload** — New Church form + existing church hover-to-upload both built (Session 9). Resize + Supabase Storage + DB update all wired. Not tested on real browser yet.
- **Dynamic PWA manifest** (`/api/manifest`) — Vercel function built + `index.html` updated. Deploys on next push. Not tested live yet.

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

---

_Update this file whenever a new bug is found or an existing one is resolved._
