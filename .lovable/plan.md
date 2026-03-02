

## Rework Scripture References Prompt

### Problem
The current scripture extraction prompt is too loose -- it pulls in passing mentions, doesn't group consecutive verses, and produces too many low-quality references (as seen in the screenshot with redundant entries like Acts 3:1, Acts 3:6, Acts 3:7 listed separately instead of grouped as Acts 3:1-10).

### Changes

All changes are in `supabase/functions/process-sermon/index.ts`.

#### 1. Replace `buildScripturesPrompt` function (~lines 895-907)

Replace the current prompt with the user's new prompt that enforces:
- Only directly quoted or explicitly discussed passages qualify
- Consecutive verses from the same chapter must be grouped (e.g., Acts 3:1-10 not separate verses)
- No passing mentions (under 2 sentences without verse citation)
- No loose references or implied allusions
- No duplicates
- Max 5 references unless pastor explicitly cited more
- Return only book/chapter/verse range + one sentence describing usage

#### 2. Update the `generate_scriptures` tool schema (~lines 784-808)

Update the tool description to reinforce the new rules:
- Description: "Extract only scripture passages directly quoted or explicitly discussed by the pastor. Group consecutive verses. Max 5 references."
- Simplify the item properties to match the new prompt output (reference + one-sentence description of how it was used). The `context` field can be merged into `text` since the new prompt asks for a single sentence about usage.

#### 3. Update the single-item regeneration prompt (~line 519)

Update the inline prompt used when regenerating a single scripture item to follow the same stricter rules.

### Files Modified

| File | What changes |
|------|-------------|
| `supabase/functions/process-sermon/index.ts` | Replace scripture prompt, update tool schema description, update single-item regen prompt |

The edge function will be redeployed automatically after changes.

