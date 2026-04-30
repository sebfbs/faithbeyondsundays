# Known Issues

## High Priority
- `APNS_BUNDLE_ID` not yet set in Supabase Edge Function secrets — iOS push notifications will error until this is configured (deferred, not needed for V1 launch)

## Low Priority
- `README.md` still contains Lovable links — should be replaced with real FBS readme
- **Streak badges won't fire** — `streak_current` on `profiles` is never incremented yet. Triggers are ready; needs streak logic wired up first.
- **Founding Member backfill** — users who signed up before the trigger was added won't have the badge. Needs a one-time SQL backfill.

---

## Resolved

- ~~Lovable cloud auth dependency (`@lovable.dev/cloud-auth-js`)~~ — removed 2026-04-27. Google/Apple OAuth now uses native Supabase auth.
- ~~`lovable-tagger` dev dependency~~ — removed 2026-04-27.
- ~~`auth-email-hook` using Lovable email service~~ — rewritten 2026-04-27, now uses Resend + Supabase native hook format. Hook wired in Supabase dashboard.
- ~~`process-sermon` using Lovable AI gateway~~ — rewritten 2026-04-27, now uses Anthropic API (Claude Sonnet 4.6).
- ~~`generate-daily-content` using Lovable AI gateway~~ — rewritten 2026-04-27, now uses Anthropic API (Claude Haiku).
- ~~`transcribe-journal` using Lovable AI gateway~~ — rewritten 2026-04-27, now uses Anthropic API (Claude Haiku).
- ~~`send-admin-invite` hardcoded Lovable redirect URLs~~ — fixed 2026-04-27.
- ~~`invite-church-admin` hardcoded Lovable redirect URLs~~ — fixed 2026-04-27.
- ~~`send-push` Lovable APNS bundle ID fallback~~ — removed 2026-04-27, now fails loudly if env var not set.
- ~~`.lovable/` directory in repo~~ — deleted 2026-04-27.

---
_Update this file whenever a new bug is found or an existing one is resolved._
