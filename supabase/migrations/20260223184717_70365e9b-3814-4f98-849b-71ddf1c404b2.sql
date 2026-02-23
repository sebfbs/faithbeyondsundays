CREATE OR REPLACE FUNCTION public.auto_assign_member_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.church_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, church_id, role)
    VALUES (NEW.user_id, NEW.church_id, 'member')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;