

## AI-Generated Daily Sparks and Reflections for Churchless Users

### What's Changing

The churchless home screen currently shows a generic "Welcome" card. We're replacing it with two AI-generated cards that feel like thoughtful, grounded faith wisdom -- not a chatty text from a buddy.

### Tone Direction

**Daily Spark** -- A calm, grounded 2-3 sentence reflection on faith and daily life. No greetings ("Good morning!"), no personal address ("buddy", "friend"), no Bible verse citations, no hashtags, no exclamation-heavy cheerfulness. Think: wisdom you'd read on a quote wall, not a text from someone you just met.

**Guided Reflection** -- A single thought-provoking question that makes someone pause and think about their faith in a real way. No "How are you feeling today?" fluff. More like: "What would change in your week if you truly believed God was already in the middle of it?"

### Architecture

```text
User opens app (churchless)
       |
       v
Frontend calls edge function
       |
       v
Edge function checks daily_content table for today's date
       |
  [Found] --> return cached content
  [Not found] --> call Lovable AI --> insert into table --> return
       |
       v
Frontend displays Spark + Reflection cards
```

### New Layout (churchless home, top to bottom)

1. Greeting (unchanged)
2. Daily Spark card -- AI-generated, styled like the sermon spark card but without "From Sunday's sermon" subtitle
3. Guided Reflection card -- AI-generated question, with the same Reflect/Save flow, without "From Sunday's sermon" subtitle
4. Connect to a Church button (unchanged)
5. Quick links: Bible, Community (unchanged)

---

### Technical Details

**1. New database table: `daily_content`**

- `id` (uuid, primary key)
- `content_date` (date, unique) -- one row per day
- `spark_message` (text) -- the daily spark
- `reflection_prompt` (text) -- the reflection question
- `created_at` (timestamptz)
- RLS: SELECT allowed for all authenticated users; no INSERT/UPDATE/DELETE from client

**2. New edge function: `supabase/functions/generate-daily-content/index.ts`**

- On request, checks `daily_content` for today's date
- If cached, returns it immediately
- If not, calls Lovable AI (google/gemini-3-flash-preview) with carefully crafted prompts:

Spark prompt:
> "Write a 2-3 sentence reflection grounded in Christian faith. It should feel like quiet wisdom -- something you'd read and sit with for a moment. Do NOT start with a greeting like 'Good morning' or 'Hey'. Do NOT address the reader directly as 'buddy', 'friend', or 'you' in a casual way. Do NOT include Bible verse references or citations. Do NOT use hashtags or exclamation marks. The tone should be calm, thoughtful, and grounded -- like something a wise pastor would write in a devotional book, not a text message to a friend. Examples of the right tone: 'It's easy to get caught up in the what's next of the week, but try to take a breath and remember that God is already in this moment with you. You don't have to go looking for Him; He's right here.' and 'Never underestimate the impact of a small act of kindness today. We're called to be light in the world, and sometimes that light is as simple as a patient word or a genuine smile to a stranger.' Write one original message in this style. Return ONLY the message text, nothing else."

Reflection prompt:
> "Write a single thought-provoking reflection question rooted in Christian faith. It should make someone genuinely pause and think. Do NOT make it generic like 'How are you feeling today?' or 'What are you grateful for?' -- it should have depth and specificity. Do NOT start with 'Hey' or any greeting. Do NOT include Bible verse references. The tone should feel like a question from a thoughtful pastor during a quiet moment, not a therapy session or a pep talk. Examples of the right tone: 'What would look different in your week if you truly believed God was already in the middle of it?' and 'Is there something you've been holding onto that you know God has been asking you to release?' Write one original question. Return ONLY the question text, nothing else."

- Uses tool calling to extract structured output (spark_message + reflection_prompt)
- Inserts result into `daily_content` table using service role
- Returns the content as JSON
- Add to `supabase/config.toml` with `verify_jwt = false`

**3. Frontend changes: `src/components/fbs/HomeTab.tsx`**

- Add a `useQuery` hook that calls the `generate-daily-content` edge function when `!hasChurch`
- Replace the churchless welcome card block (lines 218-234) with:
  - A **Daily Spark card** showing the AI-generated `spark_message` -- same card styling as lines 267-283 but without the "From Sunday's sermon" line, displayed in italic with quotes
  - A **Guided Reflection card** showing the AI-generated `reflection_prompt` -- same card styling and Reflect/Save flow as lines 287-344 but without the "From Sunday's sermon" line
- Show skeleton loaders while content is loading
- Hardcoded fallback spark and reflection in case the fetch fails
- The reflection save flow reuses the existing `onAddJournalEntry` with `title: "Daily Reflection"` and `entryType: "sermon"`
- Add `reflectionOpen`/`reflectionText` state handling for churchless reflection (can reuse existing state since sermon and churchless are mutually exclusive)

**No changes needed to:** notifications, journal, profile, or onboarding screens.

