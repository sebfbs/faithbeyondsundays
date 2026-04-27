# Current Sprint

## Status: Ready — Vercel Deployment

## Completed This Sprint (2026-04-27)

### Lovable Independence — DONE
- All frontend Lovable dependencies removed and replaced
- All 7 edge functions migrated off Lovable gateway → Anthropic API + Resend
- All 7 edge functions deployed to Supabase
- Supabase secrets set: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `HOOK_SECRET`
- Auth email hook wired in Supabase Auth → Hooks → Send Email
- App builds clean, zero errors

## What's Next

1. **Vercel deployment** — set up project on Vercel, wire production env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
2. **End-to-end app walkthrough** — walk through the deployed app and document what works vs what's broken
3. **Churchless users decision** — cut or keep for V1 (quick call, not a build task)
4. **QR code → church landing page flow**

---

## Backlog (Do Not Touch Until App Is Functional)

### PWA Install Flow — Landing Page + Device Wizard
Full game plan saved at: `FBS Brain/02 - Backlog/PWA Install Flow.md`

**What it is:** QR code → branded landing page → device-specific install wizard (iOS 17, iOS 15/16, iOS 14, iPad, Android) that walks members through adding the PWA to their home screen.

**Why it matters:** This is the primary onboarding path for members. Every church gets a unique QR code. Pages are white-labeled per church. iOS wizards have a sticky top banner + animated arrows pointing to exact Safari UI elements per iOS version.

**Build order when ready:** 6 Claude Code sessions (Foundation → Android → iOS 17 → Remaining iOS → Landing page → QR + Polish). See the full file for session-by-session breakdown and all code patterns.
