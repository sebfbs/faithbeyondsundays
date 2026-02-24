

# Full Homepage Optimization Plan

This plan covers everything we've discussed: removing Scripture of the Day, adding the Community Pulse card, implementing the reflection milestone badge system with animated gradients for 100+ tiers, and wiring it all together.

---

## Part 1: Database Changes

### Migration 1: Reflection Badges Table + Auto-Award Trigger

Create a `reflection_badges` table and a trigger that automatically awards badges when users hit milestones.

```sql
-- Table
CREATE TABLE public.reflection_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  church_id uuid,
  milestone integer NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone)
);

ALTER TABLE public.reflection_badges ENABLE ROW LEVEL SECURITY;

-- Badges are public achievements -- anyone authenticated can see them
CREATE POLICY "Badges are visible to authenticated users"
  ON public.reflection_badges FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- System inserts via trigger (SECURITY DEFINER), but user-level policy needed
CREATE POLICY "System can insert badges"
  ON public.reflection_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trigger function: fires after each journal entry insert
CREATE OR REPLACE FUNCTION check_reflection_milestone()
RETURNS trigger AS $$
DECLARE
  total_count integer;
  milestones integer[] := ARRAY[1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000];
  m integer;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM journal_entries
  WHERE user_id = NEW.user_id;

  FOREACH m IN ARRAY milestones LOOP
    IF total_count >= m THEN
      INSERT INTO reflection_badges (user_id, church_id, milestone)
      VALUES (NEW.user_id, NEW.church_id, m)
      ON CONFLICT (user_id, milestone) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_check_reflection_milestone
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_reflection_milestone();
```

### Migration 2: Community Pulse Function

A security-definer function that returns homepage community data without exposing private content.

```sql
CREATE OR REPLACE FUNCTION get_community_pulse(p_church_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  latest_reflector jsonb;
  milestone_event jsonb;
  newest_member jsonb;
  active_avatars jsonb;
BEGIN
  -- Latest person who reflected (excluding current user)
  SELECT jsonb_build_object(
    'first_name', p.first_name,
    'avatar_url', p.avatar_url,
    'reflected_at', je.created_at
  ) INTO latest_reflector
  FROM journal_entries je
  JOIN profiles p ON p.user_id = je.user_id
  WHERE je.church_id = p_church_id
    AND je.user_id != p_user_id
  ORDER BY je.created_at DESC
  LIMIT 1;

  -- Most recent milestone badge earned in the church
  SELECT jsonb_build_object(
    'first_name', p.first_name,
    'avatar_url', p.avatar_url,
    'milestone', rb.milestone,
    'earned_at', rb.earned_at
  ) INTO milestone_event
  FROM reflection_badges rb
  JOIN profiles p ON p.user_id = rb.user_id
  WHERE rb.church_id = p_church_id
    AND rb.user_id != p_user_id
  ORDER BY rb.earned_at DESC
  LIMIT 1;

  -- Newest member (excluding current user)
  SELECT jsonb_build_object(
    'first_name', p.first_name,
    'avatar_url', p.avatar_url,
    'joined_at', p.created_at
  ) INTO newest_member
  FROM profiles p
  WHERE p.church_id = p_church_id
    AND p.user_id != p_user_id
  ORDER BY p.created_at DESC
  LIMIT 1;

  -- Up to 5 recently active member avatars
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('avatar_url', sub.avatar_url, 'first_name', sub.first_name)
  ), '[]'::jsonb) INTO active_avatars
  FROM (
    SELECT DISTINCT ON (p.user_id) p.avatar_url, p.first_name
    FROM journal_entries je
    JOIN profiles p ON p.user_id = je.user_id
    WHERE je.church_id = p_church_id
      AND je.user_id != p_user_id
    ORDER BY p.user_id, je.created_at DESC
    LIMIT 5
  ) sub;

  result := jsonb_build_object(
    'latest_reflector', latest_reflector,
    'milestone', milestone_event,
    'newest_member', newest_member,
    'active_avatars', active_avatars
  );

  RETURN result;
END;
$$;
```

---

## Part 2: New Files

### `src/components/fbs/badgeConfig.ts` -- Badge Tier Definitions

Single source of truth for all milestone tiers. Each tier defines:
- `milestone`: the number (1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000)
- `label`: display name (e.g., "First Reflection", "100 Reflections")
- `color`: static color for tiers 1-50
- `gradient`: moving gradient string for tiers 100+ (e.g., `"linear-gradient(135deg, hsl(15,85%,55%), hsl(340,70%,55%), hsl(15,85%,55%))"`)
- `animated`: boolean flag, true for 100+

Includes a helper: `getHighestBadge(milestone: number)` returns the display config for a given milestone tier.

### `src/components/fbs/CommunityPulse.tsx` -- Community Pulse Card Component

A self-contained card component that:
- Accepts `churchId`, `userId`, `isDemo`, and `onNavigate` props
- In demo mode, renders hardcoded pulse data from `demoData.ts`
- In real mode, calls `get_community_pulse` RPC function
- Displays (priority order): recent reflector, milestone celebration, or new member
- Shows an avatar row of up to 5 active members
- Tapping the card navigates to the Community screen
- Returns `null` if there's nothing to show (hidden when empty)

---

## Part 3: Modified Files

### `src/components/fbs/HomeTab.tsx`
- **Remove**: Scripture of the Day card (lines 456-477)
- **Add**: Import and render `<CommunityPulse />` between Today's Reflection and Quick Links
- **Add**: Accept `churchId` and `userId` props (needed for the pulse query)

### `src/pages/Index.tsx`
- Pass `churchId` (from `profile?.church_id`) and `userId` (from `authUser?.id`) to `<HomeTab />`

### `src/components/fbs/demoData.ts`
- Add `DEMO_COMMUNITY_PULSE` object with sample data:
  - A latest reflector ("Marcus just reflected")
  - A milestone event ("Sarah earned her 10th Reflection badge!")
  - A newest member ("David just joined")
  - 4 demo avatars

### `src/components/fbs/ProfileScreen.tsx`
- Import `getHighestBadge` from `badgeConfig.ts`
- Query `reflection_badges` table for current user's highest milestone (ORDER BY milestone DESC LIMIT 1)
- Replace the hardcoded "First Reflection" badge with the real highest earned badge
- For animated (100+) badges: apply `animate-gradient-rotate` class and inline gradient styles
- If no badge earned yet, omit the reflection badge entirely

### `src/components/fbs/PublicProfileScreen.tsx`
- Accept optional `reflectionMilestone` prop
- Use `getHighestBadge()` to render the correct badge with proper styling (static or animated)
- Display alongside existing badges (Pastor, Member Since, etc.)

### `src/components/fbs/CommunityScreen.tsx`
- When fetching member profiles, also fetch their highest reflection badge from `reflection_badges`
- Pass `reflectionMilestone` to `PublicProfileScreen`

### `tailwind.config.ts`
- Add `gradient-rotate` keyframe that shifts `background-position` continuously
- Add `animate-gradient-rotate` animation (`gradient-rotate 3s ease infinite`)

### `src/index.css`
- Add `.animate-gradient-rotate` class with `background-size: 200% 200%` base style (works with inline gradient backgrounds)

---

## Homepage Card Order (After Changes)

1. Greeting (name, church, date)
2. Today's Spark
3. Today's Reflection (with reflect button)
4. **Community Pulse** (new -- hidden if no activity or no church)
5. Quick Links (Bible, Prayer, Community)

---

## Files Summary

| File | Action |
|------|--------|
| Database migration | `reflection_badges` table + trigger |
| Database migration | `get_community_pulse` function |
| `src/components/fbs/badgeConfig.ts` | New -- badge tier config with animated gradient definitions |
| `src/components/fbs/CommunityPulse.tsx` | New -- pulse card component |
| `src/components/fbs/HomeTab.tsx` | Remove Scripture card, add CommunityPulse, accept new props |
| `src/pages/Index.tsx` | Pass `churchId` and `userId` to HomeTab |
| `src/components/fbs/demoData.ts` | Add demo pulse data |
| `src/components/fbs/ProfileScreen.tsx` | Query + display highest reflection badge (animated for 100+) |
| `src/components/fbs/PublicProfileScreen.tsx` | Accept + display reflection milestone badge |
| `src/components/fbs/CommunityScreen.tsx` | Fetch highest badge per member |
| `tailwind.config.ts` | Add `gradient-rotate` keyframe + animation |
| `src/index.css` | Add gradient animation base styles |

