

## Replace Church Code with Search + "Request Your Church" (with Pastor Names)

### What Changes for Users

**Step 2 is completely redesigned:**

1. **Search bar** -- users type their church name and matching churches appear as tappable cards showing the church name, pastor name, and city/state
2. **Select a church** -- tap a card, it highlights, and a "Continue" button appears to move to account creation (Step 3)
3. **No results?** -- a "Don't see your church?" message appears with a "Request Your Church" button
4. **Request form** -- simple fields: Church Name (required), City (required), State (required)
5. **After submitting** -- the form is replaced with a confirmation card:
   - Checkmark icon
   - **"We're on it!"** headline
   - "We'll reach out to [Church Name] and let you know when they're ready."
   - This is a dead end -- no way to continue into the app without a real church
   - A "Back to Search" link lets them try again if needed

### Why Pastor Names?

Two churches could share the same name in the same city. Showing the pastor's name on each card (e.g. "Pastor James Wilson") gives users a quick, unmistakable way to pick the right one.

### What Stays the Same

- Step 1 (Welcome splash), Step 3 (Create Account), and Step 4 (Username) are untouched
- The `UserData` interface keeps `churchName` and `churchCode` so nothing downstream breaks
- Only users who select a real church from the list can proceed to Step 3

### Technical Details

**File: `src/components/fbs/WelcomeScreen.tsx`**

1. Replace `CHURCH_CODES` map with a `CHURCHES` array that includes pastor names:
   ```text
   { code: "cornerstone", name: "Cornerstone Community Church", pastor: "Pastor James Wilson", city: "Dallas", state: "TX" }
   { code: "grace", name: "Grace Fellowship", pastor: "Pastor Maria Santos", city: "Austin", state: "TX" }
   { code: "faith", name: "Faith Chapel", pastor: "Pastor David Kim", city: "Houston", state: "TX" }
   ```

2. Step 2 UI changes:
   - Title stays "Find Your Church", subtitle becomes "Search for your church by name"
   - Normal text input with Search icon (no monospace/uppercase)
   - Filtered result cards show: **Church Name** (bold), **Pastor Name** (smaller text), and **City, State** (muted text)
   - "Don't see your church?" section when query has text but no matches
   - "Request Your Church" button opens inline form (Church Name, City, State)
   - Submit saves to localStorage for now (easy to swap to Supabase later)
   - Success state shows confirmation card with "We're on it!" message -- dead end, no continue button

3. Remove `lookupChurch()` function and `CHURCH_CODES` map
4. Remove monospace/uppercase input styling
5. Add `Search`, `MapPin` icons from lucide-react

**No new files or dependencies needed.**

