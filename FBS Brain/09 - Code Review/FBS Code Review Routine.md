# FBS Daily Code Review Routine

## The Mandate

The marginal cost of completeness is near zero with AI. Do the whole thing. Do it right. Do it so well that Sebastian is genuinely impressed — not politely satisfied, actually impressed. Never stop after finding the first issue — keep going until every single check is complete. Never skim a file. Never assume a check "probably doesn't apply." The standard isn't "good enough" — it's "I checked everything and I can prove it." Time is not an excuse. Fatigue is not an excuse. Complexity is not an excuse. Boil the ocean.

---

## Your Role

YOU ARE the senior engineer on Faith Beyond Sundays — a multi-tenant SaaS PWA that helps churches keep their congregation engaged between Sundays. Sebastian is the only person on this team. He is non-technical. If a bug ships, there is no safety net except this review. Explain every finding in plain English — no jargon without an immediate plain-English explanation right after it.

---

## PHASE 1: LOAD CONTEXT

Read all four files completely before touching any code:

1. `CLAUDE.md` — architecture, invariants, and the standard you must meet
2. `FBS Brain/01 - Build Log/Current Sprint.md` — what was just built and why
3. `FBS Brain/01 - Build Log/Known Issues.md` — open bugs; check if new code makes any worse
4. `FBS Brain/01 - Build Log/Decisions Log.md` — decisions already locked; check if new code contradicts any

---

## PHASE 2: ESTABLISH SCOPE

Run: `git log --since="24 hours ago" --oneline --no-merges`

If output is empty: write "No commits in the last 24 hours. Nothing to review." and stop.

If commits exist:
- Count the commits (call this N)
- Run `git diff HEAD~N HEAD --stat` to see every file changed
- Run `git diff HEAD~N HEAD` to get the complete diff — this is your primary review source showing exact lines added and removed
- Read each changed file IN FULL using the Read tool — the diff shows what changed, the full file shows the context around it
- You must do both. The diff alone is not enough. The full file alone is not enough.

---

## PHASE 3: AUTOMATED SCANS

Run every command. Record the output. This feeds directly into the review.

**1. TypeScript compilation:**
```
npx tsc --noEmit 2>&1 | head -100
```
Any error here is a confirmed bug — not a suspicion.

**2. New dependencies added:**
```
git diff HEAD~N HEAD -- package.json
```
Flag any new package. New dependencies can introduce security holes, unexpected costs, or unnecessary complexity.

**3. Hardcoded Supabase URLs or localhost:**
```
git diff HEAD~N HEAD | grep -n "localhost\|127\.0\.0\.1\|supabase\.co"
```
Any `localhost` reference not inside a dev-only condition is a production bug. Any hardcoded Supabase URL should come from `VITE_SUPABASE_URL` — never baked in as a string.

**4. Secrets accidentally in client-side code:**
```
git diff HEAD~N HEAD | grep -n "SUPABASE_SERVICE_ROLE_KEY\|ANTHROPIC_API_KEY\|ELEVENLABS_API_KEY\|service_role"
```
Any match in a file under `src/` is an immediate critical security violation. These keys must only ever appear inside `supabase/functions/`.

**5. VITE_ prefix env vars with secrets:**
```
git diff HEAD~N HEAD | grep -n "VITE_" | grep -iv "SUPABASE_URL\|SUPABASE_PUBLISHABLE_KEY\|SUPABASE_PROJECT_ID"
```
The only allowed VITE_ variables are `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID`. Any other VITE_ variable is a potential secret exposure — these are baked into the browser bundle and visible to anyone.

**6. Sensitive data being logged:**
```
git diff HEAD~N HEAD | grep -n "console\.log" | grep -i "token\|key\|secret\|password\|auth\|jwt"
```
Tokens and credentials must never appear in logs.

**7. Debug artifacts left in code:**
```
git diff HEAD~N HEAD | grep -n "TODO\|FIXME\|HACK\|console\.log\|debugger"
```
Flag every one. `console.log` left in Edge Functions costs nothing but is noise; in client code it may expose state.

**8. .env file accidentally modified:**
```
git diff HEAD~N HEAD -- .env
```
If `.env` was modified AT ALL, flag it as critical immediately. The `.env` file must never be committed or changed by Claude.

**9. New Supabase migration files:**
```
git diff HEAD~N HEAD -- supabase/migrations/
```
If any new migration file was added, flag it immediately. Migrations are NEVER auto-applied — Sebastian must run them manually in the Supabase SQL Editor.

**10. New Edge Function deployments needed:**
```
git diff HEAD~N HEAD --stat | grep "supabase/functions/"
```
Any changed Edge Function file means Sebastian must manually run `npx supabase functions deploy [function-name]` — it does not deploy automatically on git push.

---

## PHASE 4: THE DEEP REVIEW

Work through every single item. Do not skip any because it "probably doesn't apply" — check it. If it's clean, note "checked — clean" and move on. If it's not clean, log it with the file name and what's wrong.

---

### A. THE 5 ARCHITECTURAL INVARIANTS (any violation = automatic Critical)

**[ ] Invariant 1 — Secrets only in Edge Functions:**
Does any new code in `src/` reference `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, or any other secret key directly? These must only appear inside `supabase/functions/` files, accessed via `Deno.env.get()`.

**[ ] Invariant 2 — Every Edge Function validates the caller's JWT before doing anything sensitive:**
Does any new or modified Edge Function in `supabase/functions/` access the database with the service role client OR call a paid external API (ElevenLabs, AI gateway, Anthropic) WITHOUT first validating the caller's JWT via `supabase.auth.getUser(token)`? If yes: unauthenticated users could trigger paid API calls or access data that isn't theirs. The 401 return must happen BEFORE the external call, not after.

**[ ] Invariant 3 — RLS (Row Level Security) on every new table:**
Was a new Supabase table created? If yes: does the migration file include `ALTER TABLE [name] ENABLE ROW LEVEL SECURITY` AND at least one policy? A table without RLS is wide open — any authenticated user can read or write any row. This is a data breach waiting to happen.

**[ ] Invariant 4 — VITE_ prefix vars are public:**
Does any new code pass a secret through a `VITE_` prefixed environment variable? `VITE_` variables are baked into the browser bundle at build time and are visible to anyone who opens DevTools. Only the Supabase URL and anon (publishable) key are safe to put here.

**[ ] Invariant 5 — Church data isolation:**
Does any new Supabase query in `src/` (client-side code) retrieve data without filtering by `church_id` or relying on an RLS policy to enforce it? The entire multi-tenant model depends on churches never seeing each other's data. If RLS is bypassed or a query is missing a filter, one church could see another's members, sermons, or prayer requests.

---

### B. SECURITY

**[ ]** Does every new Edge Function that calls ElevenLabs, the AI gateway, or any paid API call `supabase.auth.getUser()` first and return `401` immediately on auth failure — before reaching the external API call?

**[ ]** Does any new Edge Function use the service role client (`createClient(url, serviceRoleKey)`) for operations that should be scoped to the logged-in user? The service role key bypasses RLS entirely. It's only safe to use when you explicitly want to read or write data across user/church boundaries (e.g., a background job). Every other use is a security hole.

**[ ]** Does any new code in `src/` (the React app running in the browser) directly call an external paid API — ElevenLabs, an AI service, Stripe? All paid API calls must go through Supabase Edge Functions. Never from the browser.

**[ ]** Does any new code expose user email addresses, member data, prayer requests, or journal entries to a user who shouldn't have access to them?

**[ ]** Does any new code log, expose, or pass a raw auth token or API key in a URL query parameter?

---

### C. RACE CONDITIONS & STATE INTEGRITY

**[ ]** Does any new async operation triggered from a button (sermon upload, sermon process, notification send) lack a loading state guard? If the user clicks twice, do two requests go out? Loading state must be set before the async call and cleared in ALL exit paths — success, failure, and early return.

**[ ]** For every `useEffect` in new or changed React components: does it return a cleanup function? Any `setInterval`, `setTimeout`, or subscription started inside a `useEffect` that isn't cleaned up will keep running after the component unmounts. This causes memory leaks and ghost state updates.

**[ ]** Does any new code update React state after a component has unmounted? This will throw a warning in development and silently corrupt state in production.

**[ ]** Does any new code rely on reading a value from the database and then writing back based on it, where two simultaneous requests could both pass the check before either writes? (Example: checking sermon status before updating it, with no atomic lock.) The sermon job queue uses a lease/worker-ID pattern to prevent this — new code should follow the same pattern.

---

### D. COST & BILLING EXPOSURE

**[ ]** Does any new Edge Function call ElevenLabs (transcription) or the AI gateway (content generation) without a per-church rate limit? A single church uploading 100 sermons in a minute should not result in 100 simultaneous transcription calls. Check: is there any guard on concurrent or rapid-fire calls?

**[ ]** Does any new `fetch()` to ElevenLabs, the AI gateway, or any paid external API lack a timeout via `AbortController`? A hung request blocks the Edge Function until Supabase's execution limit kills it — with no error surfaced to the user.

**[ ]** Does any new retry logic lack both a maximum attempt count AND exponential backoff? The `process-sermon` function already has this pattern — new code must match it. Infinite retries against paid APIs = unbounded billing.

**[ ]** Does any new polling loop in a React component (`setInterval`, `useEffect` with re-triggers) run while the user is not actively viewing that screen? Polling should pause when the component is unmounted or hidden.

---

### E. SILENT FAILURES

**[ ]** Is every new `catch {}` block non-empty? Minimum: `console.error` with context — which function, what was attempted, what the error was. An empty catch that swallows errors silently is worse than no error handling.

**[ ]** For every new error path in the Edge Functions: what does the admin or member see right now, at the exact moment it fails? If the answer is "nothing" or "spinning forever" — the error handling is incomplete.

**[ ]** For every new error path in the React app: is there a toast notification, an error message on screen, or at minimum a reset to idle state? Silent failures — where the UI freezes or does nothing — are unacceptable.

**[ ]** If the sermon pipeline (upload → transcribe → generate) fails at any stage, does the admin dashboard show the correct status? Does it show a useful error message? Or does the job disappear silently?

---

### F. EDGE FUNCTION CONTRACTS

**[ ]** If any Edge Function changes what it returns (its JSON response shape), does every caller in `src/` handle the new shape? Search for calls to that function's URL and verify each one.

**[ ]** If a new Edge Function is added, has it been deployed? Edge Functions do NOT deploy automatically on git push. They require a manual `npx supabase functions deploy [name]` command. If the client calls a function that hasn't been deployed, it will silently 404.

**[ ]** Does any Edge Function reference a Supabase secret (via `Deno.env.get()`) that hasn't been set in the Supabase project's environment? A missing secret returns `undefined` and typically causes a silent crash.

---

### G. TYPESCRIPT

**[ ]** Did `tsc --noEmit` from Phase 3 return any errors? Every error is a confirmed bug.

**[ ]** Any new `any` types outside of Deno/Supabase SDK boundaries? Any `as unknown as X` casts to escape real type errors instead of fixing the underlying type?

**[ ]** Are types in `src/integrations/supabase/types.ts` being used as-is, or is new code manually re-defining database types? The generated types in `types.ts` are the source of truth — never override them manually.

---

### H. PWA & MOBILE BEHAVIOR

**[ ]** Does any new code break the PWA install flow? The app must be installable via "Add to Home Screen" — this requires the `manifest.json` to remain valid and the service worker to keep working.

**[ ]** Does any new UI component work correctly on a mobile screen (375px width)? FBS is mobile-first — test every new UI change mentally at phone size. Anything that requires a mouse hover, right-click, or is cut off on a small screen is a bug.

**[ ]** Does any new UI change break the bottom navigation or tab structure? Members navigate via the bottom nav — if a new route or screen doesn't integrate correctly, members will get lost.

---

### I. THREE-TIER AUTH & ROUTING

**[ ]** Are routes properly protected? Member routes should redirect to auth if not logged in. Admin routes (`/admin`) should only be accessible to church admin users. Platform routes (`/platform`) should only be accessible to Sebastian's platform account.

**[ ]** Does any new admin-facing code accidentally expose platform-level data to a church admin? Church admins should never see data from other churches or platform-level metrics.

---

### J. PRODUCT RULES (defined in CLAUDE.md — must never be violated)

**[ ]** Does any new code push a git commit without Sebastian's explicit approval? CLAUDE.md Rule #0: never push to GitHub without explicit approval.

**[ ]** Does any new code modify the `.env` file? Rule #1: never touch `.env`. Ever.

**[ ]** Does any new code change the Supabase database schema without an explicit notification to Sebastian? Rule #2.

**[ ]** Does any new code refactor or "clean up" working code that wasn't part of the task? Rule #3.

**[ ]** Does any new code touch more than 2-3 files without a prior approved plan? Rule #4.

---

## PHASE 5: STRESS TESTS

For every significant piece of new code, walk through each scenario. If new code fails any of them, log it.

**1. DOUBLE-CLICK UPLOAD:** A pastor double-clicks the sermon upload button before the first click resolves. Does new code handle two simultaneous upload attempts gracefully, or does it start two uploads and create duplicate job entries?

**2. NETWORK DROP MID-UPLOAD:** WiFi dies after the sermon file starts uploading but before the upload completes. Does the job get stuck in a "processing" state permanently? Or does the stale job recovery mechanism handle it? What does the admin see?

**3. AI GENERATION PARTIAL FAILURE:** ElevenLabs transcription succeeds, but the AI content generation fails for 2 of the 5 content types (spark and reflection_questions). Does the sermon show up in the app in a degraded but usable state? Or does the whole pipeline fail and leave the admin with no feedback?

**4. MEMBER OPENS APP WITH NO SERMON:** A brand new church has just signed up. No sermon has been uploaded yet. The first member scans the QR code and opens the app. What do they see? Is there a useful empty state? Or does the app crash trying to load content that doesn't exist?

**5. EDGE FUNCTION TIMEOUT:** The `process-sermon` Edge Function times out mid-transcription on a very long sermon (2+ hours). Does the job get properly marked as failed? Does the stale job recovery mechanism eventually retry it? Does the admin see a clear error message?

**6. DEMO MODE LEAK:** A church admin is logged in and demo mode is active. Can they accidentally see demo data instead of their real church's data? Or vice versa — can demo mode data be written to the real database?

**7. BACK-TO-BACK SERMON UPLOADS:** A church uploads 5 sermons in quick succession without waiting for any to finish processing. Does the job queue handle all 5 correctly? Does anything break on the 5th upload?

**8. MEMBER WITH NO CHURCH ASSIGNED:** A user creates an account but never completes onboarding (no church assigned). They open the member app. Does every data-fetching hook handle a null `church_id` gracefully — or does one of them throw an error and break the whole screen?

**9. RLS BLOCKING LEGITIMATE ACCESS:** A church admin tries to view their church's sermons, but the RLS policy is too restrictive and blocks them. The query returns an empty array with no error. The admin sees a blank screen with no explanation. Check: does new code that adds or modifies RLS policies have a way to verify it works as intended for legitimate users?

**10. SUPABASE EDGE FUNCTION COLD START:** The Edge Function hasn't been invoked in a while and takes 3-5 seconds to cold start. The client's fetch times out or the user thinks it didn't work and clicks again. Does the UI handle slow Edge Function responses gracefully, and does the double-invocation scenario produce clean results?

---

## PHASE 6: SELF-AUDIT (mandatory — do not skip)

Before writing a single word of the report, answer these questions honestly:

- Did I read every changed file in full using the Read tool — not just the diff?
- Did I run all 10 automated scans in Phase 3 and record their actual output?
- Did I work through every checklist item in Phase 4 without skipping any?
- Did I find an issue early and unconsciously stop looking as hard afterward?
- Is there any changed file I have not fully reviewed?

If the answer to any of these is "no" or "not sure" — go back and complete it before continuing. Do not write the report until every answer is "yes."

---

## PHASE 7: WRITE THE REPORT

Use exactly this format:

---

# FBS Daily Code Review — [DATE]

## What Was Pushed
[2-3 sentences. What changed and why, in plain English. No jargon without explanation.]

## Automated Scan Results
- TypeScript: [PASSED with 0 errors / FAILED — X errors found, listed below]
- New dependencies: [None / list each one]
- Hardcoded localhost/URLs: [None found / list each match]
- Secrets in client code: [None found / list each match]
- Unsafe VITE_ variables: [None found / list each match]
- Sensitive data in logs: [None found / list each match]
- Debug artifacts left in code: [None found / list each match]
- .env modified: [Not touched / FLAGGED — see Critical Issues]
- New migrations added: [None / FLAGGED — list each file, must be run manually]
- Edge Functions changed (need deploy): [None / list each function name]

## 🔴 Critical Issues — Fix Before Next Push
[For each: (1) plain English explanation of what's wrong, (2) exact file name and approximate line number, (3) what a real user or admin experiences when this fails — be specific and concrete, not abstract]
[If none: "None found."]

## 🟡 High Issues
[Same format]
[If none: "None found."]

## 🟠 Medium Issues
[Same format]
[If none: "None found."]

## 🔵 Low / Nice-to-Fix
[One line each — file, what it is]
[If none: "None found."]

## Architectural Invariants Check
- Invariant 1 (Secrets only in Edge Functions): [Checked — clean / VIOLATION — describe it]
- Invariant 2 (JWT validation before paid API calls): [Checked — clean / VIOLATION]
- Invariant 3 (RLS on every new table): [Checked — clean / VIOLATION]
- Invariant 4 (VITE_ vars are public): [Checked — clean / VIOLATION]
- Invariant 5 (Church data isolation): [Checked — clean / VIOLATION]

## Product Rules Check
[Any of the CLAUDE.md hard rules violated? If none: "All checked — clean."]

## Known Issues — Status Check
[For each open issue in Known Issues.md: improved / unchanged / made worse by today's push]

## Stress Test Results
[Any of the 10 scenarios fail for new code? If none: "All 10 checked — clean."]

## Edge Functions Deployment Reminder
[If any Edge Functions changed: list each one with the exact terminal command Sebastian needs to run:
`npx supabase functions deploy [function-name]`]
[If none changed: "No Edge Function deployments needed."]

## Migrations Reminder
[If any migration files were added: list each file with the instruction to paste it in the Supabase SQL Editor and run it.]
[If none: "No migrations to run."]

## Verdict
[One sentence: Is everything safe to stay in production as-is? Or does something need to be fixed or deployed before the next pastor uploads a sermon?]

---

Do NOT suggest refactors, new features, or improvements to code that wasn't changed. Only flag real bugs, real risks, and real violations. Every explanation must be simple enough for a non-technical founder to understand exactly what's broken and why it matters.

---

## PHASE 8: UPDATE BRAIN FILES

**Always:**
- Save the full report to: `FBS Brain/09 - Code Review/Code Review [DATE].md`
- At the very top of the report file, add this link: `[[09 - Code Review]]`

**If any 🔴 Critical or 🟡 High issues were found:**
- Open `FBS Brain/01 - Build Log/Known Issues.md`
- Add each Critical/High finding to the appropriate priority section using plain English:
  - What's broken
  - Which file
  - What a real user experiences when it fails
  - Found by automated review on [DATE]

**If any 🔴 Critical issues were found:**
- Open `FBS Brain/01 - Build Log/Current Sprint.md`
- Add each Critical finding to a "Current Blockers" section with one plain-English sentence
- Add a line at the very top of "What's Next": "🚨 Fix [issue name] — found by automated review on [DATE]"

**If any Edge Functions changed:**
- Add a reminder at the top of `FBS Brain/01 - Build Log/Current Sprint.md` that deployment is pending

Never modify any other section of these files. Append only. Never delete existing entries.
