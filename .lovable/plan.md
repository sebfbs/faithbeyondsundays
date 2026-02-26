

## Fix Role Management Vulnerabilities

### Problem
The admin members page (`AdminMembers.tsx`) has three security issues:
1. Any admin can promote someone to "owner" (privilege escalation)
2. Any admin can demote the church owner
3. The delete-then-insert pattern for role updates creates a race condition where a user could briefly have no role

### Changes

**1. Database migration: Add validation triggers on `user_roles`**

Two triggers to enforce role change rules server-side (frontend restrictions alone are insufficient):

- **On INSERT**: Prevent non-owners from assigning the `owner` role
- **On DELETE**: Prevent anyone from removing another user's `owner` role

```sql
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
```

**2. Frontend: Harden `AdminMembers.tsx`**

- Fetch the current user's role alongside the member list
- Only show the "Owner" option in the role dropdown if the current user is the owner
- Disable the role dropdown entirely for the church owner's row (only they can manage their own role)
- Prevent users from changing their own role
- Replace the delete-then-insert mutation with a single upsert call to eliminate race conditions

### Files Changed

| File | Change |
|------|--------|
| Database migration | Add `validate_role_change` and `validate_role_delete` trigger functions and attach them to `user_roles` |
| `src/pages/admin/AdminMembers.tsx` | Add current-user role check, conditionally hide "Owner" option, disable dropdown for owner row and self, switch to upsert |

