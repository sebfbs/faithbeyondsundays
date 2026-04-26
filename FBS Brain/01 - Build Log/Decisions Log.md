# Decisions Log

_Decisions already made — don't relitigate these._

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
