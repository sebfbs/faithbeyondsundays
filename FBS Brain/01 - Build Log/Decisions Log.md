# Decisions Log

_Decisions already made — don't relitigate these._

---

## 2026-04-30 — Product Vision + White-Label Architecture

**Decision:** FBS is a white-label church tool — not a social network.
**Why:** Churches want their congregation to feel like they have their own app. FBS is the invisible engine. The church is the voice. Every word a member reads should sound like their church talking to them, not a SaaS platform. Social networks don't work as new apps — Instagram already exists. The white space is within-congregation engagement, not cross-church community.

**Decision:** Tagline is "FBS bridges the gap from Sunday to Sunday."
**Why:** Simple, pastoral, jargon-free. Every pastor feels the gap between Sundays. This names their problem back to them without needing explanation. Never change this to "AI-powered church engagement platform" or anything SaaS-sounding.

**Decision:** Each church gets a white-labeled PWA — their name and logo on the app icon.
**Why:** When a member adds the app to their home screen, it should show their church's name and logo, not FBS branding. Achievable via dynamic `manifest.json` served per church subdomain. Keeps "Powered by Faith Beyond Sundays" somewhere tasteful inside the app so FBS brand still grows.

**Decision:** All in-app copy must sound like the church speaking to its congregation — never FBS speaking to users.
**Why:** Follows directly from the white-label vision. Hardcoded "Faith Beyond Sundays" strings anywhere in the member app are a bug. Every empty state, welcome message, and onboarding screen should use the church's name dynamically or church-voiced generic language as fallback.

**Decision:** Community is church-scoped only. No cross-church features — ever.
**Why:** The white-label model means each church is a closed garden. Members belong to their church, not to a global FBS network. Cross-church community would break the mental model ("why am I seeing people from First Baptist on my Grace Community app?") and create a cold-start social network problem FBS doesn't need to solve.

**Decision:** Remove followers/following system entirely.
**Why:** Followers/following is a broadcast social network model that creates a popularity hierarchy inside a congregation. That dynamic doesn't belong in a church context. With community scoped to the church, members already know each other — they don't need a social graph. Removes complexity, removes weird incentives.

**Decision:** Prayer requests are scoped to the church admin/team dashboard — not visible to all members in the community feed.
**Why:** Prayer is personal. Surfacing prayer requests to the full congregation without control creates privacy concerns. The pastoral team should see and manage them, not the whole member base by default.

**Decision:** Usernames are church-scoped (unique within a church, not globally unique). This is a permanent, one-way architectural decision.
**Why:** With no cross-church community, there is no need for globally unique usernames. 100 churches can each have a `@sebastian` with no conflict. The DB uniqueness constraint on `username` must be `(church_id, username)` — not `username` alone. This permanently closes the door on cross-church user discovery. That is intentional. FBS is not building a new Instagram.
**Usernames still exist** for within-church identity and @mentions in community posts. They're kept but the pitch changes from "get your clean handle" to "this is how your church family knows you."

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
