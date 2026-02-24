
-- Reflection badges table
CREATE TABLE public.reflection_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  church_id uuid,
  milestone integer NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone)
);

ALTER TABLE public.reflection_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are visible to authenticated users"
  ON public.reflection_badges FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert badges"
  ON public.reflection_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trigger function
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

-- Community pulse function
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
