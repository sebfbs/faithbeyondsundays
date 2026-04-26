# CLAUDE.md — Faith Beyond Sundays

Read this entire file before doing anything. This is the source of truth for the FBS project.

---

## What Is Faith Beyond Sundays

Faith Beyond Sundays (FBS) is a multi-tenant SaaS PWA (Progressive Web App) that helps churches keep their congregation engaged between Sundays. Pastors upload their sermon once — FBS automatically generates a week's worth of daily content (Daily Sparks, reflection prompts, scripture pills) drawn from that sermon. Members access it by scanning a QR code that takes them to their church's landing page. No app store. Add to home screen.

**Builder:** Sebastian. Non-technical. Always give exact terminal commands. Never assume coding knowledge. Never use jargon without explaining it.

**Repo:** sebfbs/faithbeyondsundays
**Local path:** `/Users/sebastianperez/Desktop/Faith Beyond Sundays CC`
**Deployed via:** Vercel (auto-deploys on git push to main)
**Database + backend functions:** Supabase

---

## Three User Tiers

| Tier | Who | Where |
|------|-----|-------|
| **Member App** | Everyday churchgoers | `/` — mobile-first PWA |
| **Church Admin Dashboard** | Pastors, church staff | `/admin` |
| **Platform Owner Panel** | Sebastian (you) | `/platform` |

---

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | React 18 + TypeScript + Vite | Main UI |
| Styling | Tailwind CSS + shadcn/ui | All components |
| Routing | React Router DOM v6 | Page navigation |
| Data fetching | TanStack React Query | Server state + caching |
| Forms | React Hook Form + Zod | Form validation |
| Database | Supabase (Postgres) | All data |
| Auth | Supabase Auth | Login/signup |
| Backend logic | Supabase Edge Functions (Deno) | Sermon processing, AI, push notifications |
| AI | Claude (Anthropic) | Sermon content generation |
| Push notifications | Supabase + Capacitor | Mobile push |
| PWA | Vite Plugin PWA | Installable web app |
| Hosting | Vercel | Web app deployment |

---

## Project Structure

```
/Faith Beyond Sundays CC
├── src/
│   ├── App.tsx                    # Main app, routing
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── fbs/                   # All member-facing components
│   │   │   ├── HomeTab.tsx        # Daily Spark + home feed
│   │   │   ├── SermonTab.tsx      # Sermon playback + weekly content
│   │   │   ├── JournalTab.tsx     # Daily reflection + personal journal
│   │   │   ├── BibleScreen.tsx    # Bible reader (KJV + others)
│   │   │   ├── CommunityScreen.tsx# Groups + community feed
│   │   │   ├── PrayerScreen.tsx   # Prayer requests
│   │   │   ├── OnboardingScreen.tsx# Member onboarding flow
│   │   │   ├── AuthScreen.tsx     # Login/signup
│   │   │   ├── AuthProvider.tsx   # Auth context
│   │   │   └── ...
│   │   ├── platform/              # Platform owner dashboard components
│   │   └── ui/                    # shadcn/ui primitives
│   ├── pages/
│   │   ├── Index.tsx              # Member app entry
│   │   ├── admin/                 # Church admin dashboard
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminSermons.tsx   # Sermon upload + pipeline
│   │   │   ├── AdminMembers.tsx
│   │   │   ├── AdminTeam.tsx
│   │   │   └── ...
│   │   └── platform/              # Platform owner panel
│   │       ├── PlatformDashboard.tsx
│   │       ├── PlatformChurches.tsx
│   │       └── ...
│   ├── hooks/                     # Custom React hooks
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client
│   │       └── types.ts           # DB types (auto-generated)
│   └── lib/
│       └── utils.ts
├── supabase/
│   ├── migrations/                # 48 SQL migration files — DB schema history
│   └── functions/                 # Edge Functions (Deno/TypeScript)
│       ├── process-sermon/        # Sermon transcription + AI content generation
│       ├── generate-daily-content/# Daily content generation
│       ├── upload-sermon/         # Sermon upload handler
│       ├── send-push/             # Push notification sender
│       ├── delete-account/        # Account deletion
│       ├── transcribe-journal/    # Handwriting to text via vision AI
│       └── ...
├── public/
│   ├── manifest.json              # PWA manifest
│   └── icons/                     # PWA icons
├── FBS Brain/                     # Obsidian project brain
│   └── 01 - Build Log/
│       ├── Current Sprint.md
│       ├── Known Issues.md
│       └── Decisions Log.md
├── .env                           # Public Supabase keys (VITE_ prefix — safe to be client-side)
└── .claude/                       # Claude Code settings
```

---

## Sermon Pipeline

```
Pastor uploads sermon (video or audio)
         ↓
upload-sermon Edge Function → stores in Supabase Storage
         ↓
process-sermon Edge Function → transcribes audio
         ↓
generate-daily-content → AI generates 7-day content
  (Daily Sparks, reflection questions, scripture pills, takeaways)
         ↓
Content published → members see it in the app
```

---

## Current Build Status

### ✅ Built by Lovable (needs verification)
- Member app (Home, Sermon, Journal, Bible, Community, Prayer)
- Church Admin Dashboard (Sermons, Members, Team, Moderation, Settings)
- Platform Owner Panel
- Auth (login, signup, onboarding)
- Supabase schema (48 migrations)
- Edge Functions (sermon processing, push notifications, etc.)
- PWA setup (manifest, icons, installable)

### ❌ Not set up yet
- Vercel deployment
- Production environment variables on Vercel
- Lovable-specific dependencies need audit/removal

### 🔲 Not built / TBD
- QR code → church landing page flow
- Churchless users — decision pending
- App Store — not doing this (PWA only)

---

## Definition of Done (V1 Launch)

A church can:
1. Sign up and set up their church profile
2. Upload a Sunday sermon
3. Watch it automatically generate a week of daily content
4. Members scan a QR code → land on the church's page → add app to home screen
5. Members open the app daily and see content from that week's sermon
6. Members can journal, read Bible, submit prayer requests, join groups

**That's the finish line. Everything else is V2.**

---

## Shipping

⚠️ **ALWAYS wait for Sebastian's explicit approval before running any push command.** Show changes first, get a "yes", then push.

### Web app change:
```bash
git add -A
git commit -m "describe what changed"
git push
```
Vercel auto-deploys on push to main.

### Database change:
Paste SQL in Supabase SQL Editor → Run. No code push needed.

### Edge Function change:
```bash
npx supabase functions deploy [function-name]
```

---

## Claude's Role on This Project

Sebastian is a non-technical founder. He is the product visionary and decision-maker. He is not the technical safety net. **Claude is the technical safety net.**

- **Push back when something is wrong.** Surface conflicts clearly, explain in plain English, propose a better path.
- **Own the outcome, not just the code.** Done means it handles failure, costs the right amount to run, and won't silently break at 2am.
- **Update this file when architecture changes.**

### Boil the Ocean

The marginal cost of completeness is near zero with AI. Do the whole thing. Do it right. Do it so well that Sebastian is genuinely impressed — not politely satisfied, actually impressed. Never offer to "table this for later" when the permanent solve is within reach. Never present a workaround when the real fix exists. The standard isn't "good enough" — it's "holy shit, that's done." Search before building. Test before shipping. Ship the complete thing.

---

## The Plan Review Loop (Mandatory Before Presenting Any Plan)

Before presenting any implementation plan, run this loop internally. Never present Plan A. Pick the best solution and present only that.

**Ask before presenting:**
- What are the silent failure modes?
- What are the race conditions or edge cases?
- What assumptions am I making that could be wrong?
- Is this fixing the symptom or the root cause?
- What happens on the 2nd, 5th, 10th run of this code?
- What happens during a network drop or unexpected state?
- What does the user see if this fails silently?

Iterate until every question has a clean answer. Only then present.

**The bar:** a senior engineer at a well-funded startup would approve this plan without asking a single follow-up question.

---

## Production Code Standards

### The Mandatory Two-Pass Rule

**Pass 1 — Write it.** Solve the problem. Make it work.
**Pass 2 — Review it.** Re-read every changed file top to bottom as a different engineer. Ask: "What could go wrong in production?" Fix in this pass — not a follow-up.

### Review Checklist

#### 💸 Cost & Billing Exposure
- Every Supabase Edge Function that calls a paid API (Anthropic, ElevenLabs) has per-church rate limiting.
- No polling loop or interval outlives the component that started it — always clean up in `useEffect` return.
- Retry logic has a maximum attempt count — no infinite loops against paid APIs.

#### 🔒 Security
- Zero secrets in client-side code. `VITE_` env vars are public (Supabase URL + anon key only). All secrets (service role key, API keys) live in Supabase Edge Function environment variables only.
- Every Edge Function that touches sensitive data validates the caller's Supabase JWT first.
- Auth errors return `401` immediately — never fall through to the actual operation.
- RLS (Row Level Security — controls who can see what in the database) is enabled on every Supabase table. Never bypass it with the service role key except in Edge Functions where it's intentional.

#### ⚡ Race Conditions & State Integrity
- Any async operation triggered from a button has a loading state guard — double-clicks do nothing.
- Optimistic UI updates are rolled back on failure.

#### 🔇 Silent Failures
- No empty `catch {}` blocks. Every caught error is at minimum `console.error`-logged.
- Every failure produces a visible outcome for the user — an error toast, a reset to idle state, something. Silent failures are unacceptable.

#### 🧩 TypeScript Integrity
- Types in `src/integrations/supabase/types.ts` are the source of truth for DB types — never manually override them.
- No `as unknown as X` double-casts to escape type errors — fix the underlying type.

#### ✅ Completeness
- New Supabase tables have RLS policies. No table ships without them.
- New Edge Functions are deployed and their URLs match what the client calls.

---

## Hard Rules for Claude Code

0. **NEVER push to GitHub without explicit approval from Sebastian.**
1. **Never touch `.env`.** Ever. For any reason.
2. **Never modify the Supabase database schema** without explicitly telling Sebastian what will change and getting a yes.
3. **Never refactor working code** to "clean it up." Only add or fix what's asked.
4. **Never change more than 2-3 files at once** without first listing every file you'll touch and why.
5. **Never assume a feature is done.** Always end with: "Here's how to test this:" followed by exact steps.
6. **One task at a time.** Never batch features together.
7. **Always give exact terminal commands.** Never say "run the build command" — say exactly what to type.
8. **When something is broken, diagnose before fixing.** List what you think the cause is before writing any code.
9. **Never use technical jargon** without explaining it in plain English immediately after.
10. **If you're about to do something irreversible** (delete data, drop a table, overwrite a file), stop and ask first.

---

## How to Start Every Session

1. Read this file (`CLAUDE.md`) in full.
2. Read `tasks/lessons.md` if it exists — mistakes from past sessions, don't repeat them.
3. Read these three FBS Brain files for current context:
   - `FBS Brain/01 - Build Log/Current Sprint.md`
   - `FBS Brain/01 - Build Log/Known Issues.md`
   - `FBS Brain/01 - Build Log/Decisions Log.md`
4. Tell Sebastian: "Here's where we left off and here's what I think we should work on today" — then ask if that's right before touching any code.
5. Confirm the single task before writing any code.
6. After completing the task, give exact test steps.
7. Update `FBS Brain/01 - Build Log/Current Sprint.md` to reflect what was completed and what's next.

---

## Workflow Rules

### Plan Before You Build
- For ANY task with 3+ steps or that touches more than 1 file: write a plan to `tasks/todo.md` first, show it to Sebastian, wait for a "yes" before touching any code.
- If something goes sideways mid-task: STOP. Re-plan. Don't keep pushing.

### Subagents
- For research, investigation, or exploring why something is broken: spin off a subagent. Keep the main session clean for building.
- For complex problems: use multiple subagents in parallel.
- One focused task per subagent.

### Self-Improvement Loop
- After ANY correction from Sebastian: write the lesson to `tasks/lessons.md` immediately.
- Format: what went wrong + the rule that prevents it happening again.
- Read `tasks/lessons.md` at the start of every session.

### Verification Before Done
- Never say a task is complete without proving it works.
- Always end with exact test steps Sebastian can follow.

### Minimal Impact
- Every change should touch the least amount of code possible.
- Don't over-engineer simple fixes.

---

## Honesty Requirements
- **Never say a task is "done," "fixed," or "working" without showing the specific output or test that proves it.**
- **Never use phrases like "this should work" or "the rest follows the same pattern."** Either implement it fully or state what remains.
- **Never adjust code just to make something look correct.** If it's broken, say so.

---

## Session End Protocol
1. **Always end every session with `/wrap`.** Writes a dated build log to `FBS Brain/01 - Build Log/YYYY-MM-DD.md`, updates Known Issues and Current Sprint, commits everything.
2. Do not declare the session complete if any acceptance criteria remain unverified.
3. Do not end without running `/wrap`. If Sebastian hasn't said "wrap it up" yet, remind him.

---

## UI Library: ShadCN

All UI is built with shadcn/ui (Radix). Components live in `src/components/ui/`.

- Always use shadcn components instead of raw HTML elements
- Import from `@/components/ui/[component-name]`
- Do not install other UI libraries
- When a component is needed that isn't installed yet, output the exact `npx shadcn@latest add [name]` command for Sebastian to run first

---

## Environment Variables

**Client-side (safe to be public — `VITE_` prefix, lives in `.env`):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

**Secrets (live in Supabase Edge Function environment variables only — never in `.env`):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ELEVENLABS_API_KEY` (if used)
- Any other third-party API keys

---

## Key Context for Debugging

- This is a **React SPA** (single page app — everything runs in the browser, there's no server rendering). All routing happens client-side via React Router.
- Backend logic lives in **Supabase Edge Functions** (`supabase/functions/`) — these run on Supabase's servers, not Vercel.
- The sermon pipeline is async: upload → transcribe → generate content → publish. Status polling is built into the admin dashboard.
- **RLS (Row Level Security)** policies control what each user can see in the database. If data isn't showing up, RLS is almost always why.
- The app has a **demo mode** (`DemoModeProvider.tsx`) for when no real data exists — check `featureFlags.ts` if something isn't showing.
- The `@lovable.dev/cloud-auth-js` dependency was used by Lovable's platform and may need to be removed or replaced now that we're building independently.
