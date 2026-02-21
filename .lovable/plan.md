

## Simplify Home Tab: Daily Reflection + Remove Weekly Challenge

### What Changes for Users

The Home tab becomes a clean, focused daily experience with just two content cards:

1. **Today's Spark** -- an inspirational quote from the sermon (unchanged)
2. **Today's Reflection** -- one journaling prompt per day, inspired by the sermon

The **Weekly Challenge** card, its accept/complete flow, confetti animation, and the **streak banner** are all removed. The standalone **Guided Reflection** screen is also removed. Users now have one simple daily action: read the spark, reflect on the prompt, done.

### Home Tab Layout (top to bottom)

1. Greeting (name, church, date)
2. Today's Spark (daily inspiration -- unchanged)
3. Today's Reflection (daily prompt with inline journaling)
4. Bottom spacer

### How Today's Reflection Works

- Shows **one** sermon-inspired prompt per day, cycling through the 5 reflection questions:
  - Monday: Question 1
  - Tuesday: Question 2
  - Wednesday: Question 3
  - Thursday: Question 4
  - Friday: Question 5
  - Saturday/Sunday: A recap prompt ("Look back on this week -- what has God been teaching you through this sermon?")
- Tap "Reflect" to expand an inline textarea
- Save creates a journal entry tagged as "Sermon" in the Journal tab
- After saving, the card shows a checkmark with "Reflected today" and a link to view it in the journal
- If the user already reflected today, the card loads in the completed state

### What Gets Removed

- **Weekly Challenge** card (accept/complete buttons, confetti)
- **Streak banner** ("Ready to start your challenge streak?")
- **Guided Reflection** button at the bottom of the Home tab
- **GuidedReflectionScreen** component and its overlay routing
- The `canvas-confetti` import in HomeTab (no longer needed)
- The `ChallengeStage` state logic

### What Stays the Same

- Greeting section with sky gradient and stars
- Today's Spark card
- The `reflectionQuestions` array in `data.ts` (used as source for daily prompts)
- Journal tab and all its existing functionality
- All other screens and navigation

---

### Technical Details

**File: `src/components/fbs/HomeTab.tsx`**

1. Remove `onGuidedReflection` prop
2. Add new props: `onAddJournalEntry` (function to save entry) and `reflectedToday` (boolean)
3. Remove `challengeStage` state, `confetti` import, and all Weekly Challenge / Streak / Guided Reflection JSX
4. Add `getDailyPromptIndex()` helper that maps day-of-week to prompt index (Mon=0 through Fri=4, weekend=-1 for recap)
5. Add local state for textarea expand/collapse and text input
6. Add "Today's Reflection" card after Today's Spark with:
   - BookText icon + "Today's Reflection" pill
   - The daily prompt text
   - "Reflect" button that expands inline textarea
   - "Save" button that calls `onAddJournalEntry` and sets completed state
   - Completed state showing checkmark

**File: `src/pages/Index.tsx`**

1. Remove `GuidedReflectionScreen` import
2. Remove `"guided-reflection"` from the `OverlayScreen` type and its render branch
3. Remove `onGuidedReflection` prop from `HomeTab` usage
4. Pass `onAddJournalEntry={addJournalEntry}` and `reflectedToday` (computed by checking if any journal entry from today exists) to `HomeTab`

**File: `src/components/fbs/GuidedReflectionScreen.tsx`**

1. Delete this file

**File: `src/components/fbs/data.ts`**

1. Add a `weekendReflection` string to the `SERMON` object for Saturday/Sunday prompt

**No new dependencies. `canvas-confetti` can remain installed (used elsewhere or not -- harmless either way).**

