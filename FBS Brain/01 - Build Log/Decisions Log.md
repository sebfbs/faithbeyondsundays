# Decisions Log

_Decisions already made — don't relitigate these._

---

## 2026-05-14 — Sermon Video Storage: Scale Problem to Solve Before Launch

**Current setup:** Sermon videos upload directly to Supabase Storage. Pro plan includes 100GB total. A typical 51-minute 1080p sermon video is ~700MB.

**The math:**
- 100GB ÷ 700MB = ~140 sermons before overage fees
- At 1 sermon/week per church, 10 churches = 10 sermons/week = full in ~14 weeks
- Supabase overage pricing: ~$0.021/GB/month — manageable at small scale, but adds up fast

**Short-term fix (do before 5+ churches):**
Strip the video down to audio-only before storing. MP3 at 128kbps for a 51-minute sermon ≈ 50MB. Same transcript quality. 14x smaller. 100GB now holds ~2,000 sermons. This buys significant runway without changing anything else.

**Long-term consideration (10+ churches):**
Supabase Storage is not purpose-built for large media files. At scale, look at:
- **Cloudflare R2** — S3-compatible, zero egress fees, much cheaper for video. ~$0.015/GB storage, $0 egress vs Supabase's fees.
- **Cloudflare Stream** — built specifically for video. Handles encoding, playback, CDN. Priced per minute of video stored (~$5/1,000 min). 1,000 sermons × 60 min = $300/mo at scale but handles everything.

**Decision deferred until:** 5+ active churches OR storage hits 50GB, whichever comes first. At that point evaluate audio stripping vs. R2 migration vs. Cloudflare Stream.

**What NOT to do:** Don't migrate storage mid-product before there's real scale. Supabase Storage works fine for V1.

---

## 2026-05-12 — App Store Distribution (Replaces PWA-Only)

**Decision:** FBS will distribute via the Apple App Store (and Google Play) as per-church white-labeled native apps — not PWA-only.

**Why:** Asking 300 congregants to scan a QR code, land on a web page, and follow "Add to Home Screen" instructions has too much drop-off. It looks unpolished. App Store distribution is the standard expectation. Apple review is 2-4 days (not 3 weeks as previously assumed), making the timeline acceptable.

**Architecture:** Capacitor wraps the existing React/TypeScript app in a native shell. No rewrite needed. Each church gets its own build with a unique bundle ID, app name, and icon. Same codebase, different config per church.

**Apple Guideline 4.3 (template apps):** FBS passes this because each church app serves genuinely different content — different sermons, Daily Sparks (AI-generated from that church's uploads), members, community groups, announcements, and prayer requests. This is not a skin swap; it is a different content experience. Each App Store submission should include review notes explaining this explicitly.

**What needs to be built:**
1. Capacitor installed and configured on the existing codebase
2. Per-church build config script — takes church name, code, and logo → outputs a build with correct bundle ID, app name, and icon set
3. Fastlane for automated build + App Store submission (reduces new church onboarding from hours to a script run)
4. APNs push notification certificates per church app
5. App Store Connect entry per church (name, description, screenshots)

**What this replaces:**
- The PWA church landing page (`ChurchLandingPage.tsx`) and "Add to Home Screen" wizard — no longer the primary install path
- The dynamic PWA manifest (`/api/manifest`) — still useful for web users but no longer the core distribution mechanism
- The QR code still exists but now deep-links to the App Store listing instead of the landing page

**What stays the same:**
- The entire React app codebase — untouched
- Supabase backend, Edge Functions, all data
- Church branding (logo, name) pulled dynamically at runtime from Supabase — same as before
- The `?church=` URL param flow — still used for deep linking into the correct church after app install

---

## 2026-05-05 — Logo Upload, Dynamic Manifest, and QR Code Are One Flow

**Decision:** Church logo upload, the dynamic PWA manifest, and the QR code → install flow are not three separate features. They are one interconnected system. Build them as a unit.

**How it works end to end:**
1. Platform admin (Sebastian) creates a church account and uploads their logo in `/platform/churches`
2. Logo is stored in Supabase Storage. The `churches` table gets a `logo_url` column pointing to it
3. When a member scans the church's QR code, the URL contains the church identifier: `app.faithbeyondsundays.com/?church=overflow`
4. The app reads `?church=overflow` from the URL and stores it in localStorage
5. A Vercel serverless function at `/api/manifest` reads the church identifier, fetches that church's logo URL from Supabase, and returns a dynamically generated `manifest.json` with that church's logo as the app icon
6. `index.html` points `<link rel="manifest">` to `/api/manifest` (not the static `manifest.json`)
7. When the member taps "Add to Home Screen," their phone uses that manifest — so the home screen icon IS the church's logo, not an FBS logo

**Why this matters:**
This is what makes FBS truly white-label. Every church's members get an app icon that looks like their church built it. FBS is invisible.

**Logo sizes generated on upload:**
Two versions are resized client-side (HTML Canvas) at upload time and stored separately:
- `logo_192.png` — for the PWA manifest icon (192×192)
- `logo_512.png` — for the PWA manifest icon (512×512)
- Original is also kept for in-app display (sign-up screen, profile pill, sidebar)

**The church identifier in the URL is the lynchpin:**
Everything downstream — the manifest, the white-label sign-up screen, the member being auto-linked to the right church — all depends on `?church=overflow` (or equivalent) being present in the URL when the member first arrives. The QR code bakes this in. Don't design any of these features without preserving the church param through every redirect.

---

## 2026-05-04 — Admin Login + Announcements

**Decision:** Admin login is email/password only — no Google OAuth.
**Why:** Google OAuth on the admin dashboard requires Supabase redirect URL whitelisting, and the Google account UUID wouldn't match the admin role entry unless explicitly linked. For a small known group (pastors/staff), email/password is simpler and more reliable. Admins are invited via email so they always have a password from day one.

**Decision:** Announcements auto-expire — pastors don't manually delete them.
**Why:** Pastors won't manage announcement cleanup. Auto-expiry is essential UX. Default is 1 week. Options: 1 day / 3 days / 1 week / 2 weeks / No expiry. Expired announcements are filtered server-side in the member query.

**Decision:** Announcements have a required title + optional body.
**Why:** Bold title makes announcements scannable. Members see the headline first and decide if they want to read more. Same pattern as every notification system that works. Body is optional detail.

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
