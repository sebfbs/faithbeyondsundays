
-- Church-level feature flags table
CREATE TABLE public.church_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(church_id, feature_key)
);

ALTER TABLE public.church_feature_flags ENABLE ROW LEVEL SECURITY;

-- Church admins can manage their church's feature flags
CREATE POLICY "Admins can manage their church feature flags"
ON public.church_feature_flags
FOR ALL
USING (
  has_role_in_church(auth.uid(), church_id, 'admin'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'owner'::app_role)
)
WITH CHECK (
  has_role_in_church(auth.uid(), church_id, 'admin'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'owner'::app_role)
);

-- Members can read their church's feature flags (needed for feature gating in the app)
CREATE POLICY "Members can read their church feature flags"
ON public.church_feature_flags
FOR SELECT
USING (church_id = get_user_church_id(auth.uid()));

-- Platform admins can manage all
CREATE POLICY "Platform admins can manage all feature flags"
ON public.church_feature_flags
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_church_feature_flags_updated_at
BEFORE UPDATE ON public.church_feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
