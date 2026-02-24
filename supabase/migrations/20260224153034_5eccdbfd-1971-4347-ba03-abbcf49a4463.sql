CREATE OR REPLACE FUNCTION public.get_community_pulse_v2(p_church_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '{}'::jsonb;
  recent_reflectors jsonb;
  recent_milestones jsonb;
  recent_members jsonb;
  recent_likes jsonb;
  active_avatars jsonb;
BEGIN
  -- Verify the calling user belongs to the requested church
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = p_user_id
      AND church_id = p_church_id
  ) THEN
    RAISE EXCEPTION 'Access denied: user does not belong to this church';
  END IF;

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO recent_reflectors
  FROM (
    SELECT DISTINCT ON (p.user_id)
      p.first_name, p.avatar_url, je.created_at AS reflected_at
    FROM journal_entries je
    JOIN profiles p ON p.user_id = je.user_id
    WHERE je.church_id = p_church_id
      AND je.user_id != p_user_id
      AND je.created_at > now() - interval '48 hours'
    ORDER BY p.user_id, je.created_at DESC
    LIMIT 10
  ) sub;

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO recent_milestones
  FROM (
    SELECT p.first_name, p.avatar_url, rb.milestone, rb.earned_at
    FROM reflection_badges rb
    JOIN profiles p ON p.user_id = rb.user_id
    WHERE rb.church_id = p_church_id
      AND rb.user_id != p_user_id
      AND rb.earned_at > now() - interval '7 days'
    ORDER BY rb.earned_at DESC
    LIMIT 5
  ) sub;

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO recent_members
  FROM (
    SELECT p.first_name, p.avatar_url, p.created_at AS joined_at
    FROM profiles p
    WHERE p.church_id = p_church_id
      AND p.user_id != p_user_id
      AND p.created_at > now() - interval '7 days'
    ORDER BY p.created_at DESC
    LIMIT 3
  ) sub;

  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb) INTO recent_likes
  FROM (
    SELECT p.first_name, p.avatar_url, sl.target_type, sl.created_at AS liked_at
    FROM sermon_likes sl
    JOIN sermons s ON s.id = sl.sermon_id
    JOIN profiles p ON p.user_id = sl.user_id
    WHERE s.church_id = p_church_id
      AND sl.user_id != p_user_id
      AND sl.created_at > now() - interval '48 hours'
    ORDER BY sl.created_at DESC
    LIMIT 5
  ) sub;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('avatar_url', sub.avatar_url, 'first_name', sub.first_name)
  ), '[]'::jsonb) INTO active_avatars
  FROM (
    SELECT p.user_id, p.avatar_url, p.first_name, MAX(activity.activity_at) as last_active
    FROM (
      SELECT je.user_id, je.created_at AS activity_at
      FROM journal_entries je
      WHERE je.church_id = p_church_id
        AND je.user_id != p_user_id
        AND je.created_at > now() - interval '48 hours'
      UNION ALL
      SELECT ae.user_id, ae.created_at AS activity_at
      FROM analytics_events ae
      WHERE ae.church_id = p_church_id
        AND ae.user_id != p_user_id
        AND ae.created_at > now() - interval '48 hours'
      UNION ALL
      SELECT sl.user_id, sl.created_at AS activity_at
      FROM sermon_likes sl
      JOIN sermons s ON s.id = sl.sermon_id
      WHERE s.church_id = p_church_id
        AND sl.user_id != p_user_id
        AND sl.created_at > now() - interval '48 hours'
    ) activity
    JOIN profiles p ON p.user_id = activity.user_id
    GROUP BY p.user_id, p.avatar_url, p.first_name
    ORDER BY last_active DESC
    LIMIT 5
  ) sub;

  result := jsonb_build_object(
    'recent_reflectors', recent_reflectors,
    'recent_milestones', recent_milestones,
    'recent_members', recent_members,
    'recent_likes', recent_likes,
    'active_avatars', active_avatars
  );

  RETURN result;
END;
$function$;