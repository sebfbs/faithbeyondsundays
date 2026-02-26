
-- Trigger function: block non-owners from granting owner role
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF NEW.role = 'owner' THEN
    IF NOT has_role_in_church(auth.uid(), NEW.church_id, 'owner') THEN
      RAISE EXCEPTION 'Only church owners can assign the owner role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_role_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_change();

-- Trigger function: block removal of another user's owner role
CREATE OR REPLACE FUNCTION public.validate_role_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF OLD.role = 'owner' AND OLD.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove the owner role from another user';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_validate_role_delete
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_delete();
