# Decisions Log

_Decisions already made — don't relitigate these._

---

## 2026-04-27 — Lovable Independence Audit

**Decision:** AI model for all edge functions is Claude (Anthropic), not Google Gemini via Lovable's gateway.
**Why:** The app was built on Lovable which proxied AI calls through their gateway (`ai.gateway.lovable.dev`) to Google Gemini using a `LOVABLE_API_KEY`. Off Lovable, this breaks. CLAUDE.md always specified Claude as the AI layer. Switching to the Anthropic API directly is both the correct independence move and aligns with the original intent. `ANTHROPIC_API_KEY` is already planned as a Supabase Edge Function env var.

**Decision:** Auth emails will be handled by Resend, not Lovable's email service.
**Why:** `auth-email-hook` used `@lovable.dev/email-js` to send all auth emails through Lovable's infrastructure. Off Lovable, this is broken. `send-admin-invite` already uses Resend and has a `RESEND_API_KEY` in Supabase env vars. The email templates (React Email) are already built and reusable. Resend is the natural replacement.

**Decision:** Frontend OAuth (Google/Apple sign-in) now uses Supabase's native `signInWithOAuth` directly.
**Why:** Was using `@lovable.dev/cloud-auth-js` which routed OAuth through Lovable's servers. Removed 2026-04-27. Supabase has native OAuth support — same behavior, no external dependency.

---

## 2026-04-26 — Platform Setup

**Decision:** Moving from Lovable to Claude Code for all future development.
**Why:** Lovable was too expensive for the pace of building needed.

**Decision:** PWA only — no App Store (iOS or Android).
**Why:** QR code → church landing page → add to home screen. Simpler, faster, no Apple review process.

**Decision:** Hosting on Vercel (not Railway).
**Why:** FBS is a pure web app (React + Vite), no desktop binary. Vercel is the natural fit.

**Decision:** Churchless users flow — TBD.
**Why:** Was built in Lovable but not confirmed as a priority for V1. Revisit before launch.

**Decision:** Supabase Edge Functions for all backend logic.
**Why:** Already built this way in Lovable. Keeps backend serverless and co-located with the database.
