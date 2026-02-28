

## Smart Chapter Generation: Remove Fixed Count, Ensure Full Coverage

### Problem
The current chapter prompt forces "4-8 chapters," which means the AI may stop generating chapters partway through a 45-minute sermon (e.g., last chapter at 18 minutes). It also doesn't instruct the AI to cover the full duration.

### Changes

**File: `supabase/functions/process-sermon/index.ts`**

**1. Rewrite `buildChaptersPrompt` (lines 836-849)**

Replace the "4-8 chapters" instruction with smarter guidance:
- Only create chapters where there is a genuine shift in topic, theme, or focus
- Do NOT force a specific number -- let the sermon's natural structure dictate
- Chapters MUST span the entire sermon from start to finish (first chapter near 0:00, last chapter in the final portion)
- Do NOT cluster chapters in the first half
- Each chapter should represent a meaningful, distinct section -- not brief asides or transitions

**2. Update single-item chapter regeneration prompt (line 447)**

Update the regen prompt to match: no forced count, ensure the regenerated chapter makes sense in context of the full sermon duration.

### What This Fixes
- Chapters will now naturally cover the full sermon instead of stopping at 18 minutes in a 45-minute video
- The AI decides how many chapters are appropriate based on the actual content structure
- No more artificial clustering of chapters in the early portion of the sermon

