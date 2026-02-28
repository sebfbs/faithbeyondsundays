

## Fix Reflection Questions: 7 Days, Second Person, No Meta-References

### Changes

**1. Update reflection prompt (`supabase/functions/process-sermon/index.ts`)**

Update `buildReflectionPrompt` to:
- Require exactly **7 questions**, one for each day (Monday-Sunday)
- Use **second person** ("you/your") -- never first person ("I/my")
- Never reference "the sermon", "the preacher", the speaker's name, or any meta-framing
- Questions should feel standalone and personal, as if a wise pastor is asking the reader directly

**2. Add `day` field to reflection schema (same file)**

Update the `reflection_questions` tool schema to include a `day` property (enum: Monday-Sunday), matching the Daily Sparks pattern.

**3. Update single-item regeneration prompt (same file)**

The per-item regeneration prompt for `reflection_questions` (around line 443) needs the same tone rules: second person, no meta-references, no speaker name, and include the target day.

**4. Update `ReflectionEditor` UI (`src/pages/admin/AdminSermons.tsx`)**

Add a day badge/label on each reflection question card (like SparkEditor has), so admins can see which day each question belongs to.

### Technical Details

| File | Lines | Change |
|------|-------|--------|
| `supabase/functions/process-sermon/index.ts` | ~802-808 | Rewrite `buildReflectionPrompt` with new instructions |
| `supabase/functions/process-sermon/index.ts` | ~683-708 | Add `day` enum field to reflection_questions schema |
| `supabase/functions/process-sermon/index.ts` | ~442-443 | Update single-item regen prompt for reflections |
| `src/pages/admin/AdminSermons.tsx` | ~1134-1166 | Add day badge to ReflectionEditor cards |

