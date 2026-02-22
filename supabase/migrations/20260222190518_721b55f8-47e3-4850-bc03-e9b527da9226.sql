
-- 1. Create platform_admins table FIRST
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- 2. Create is_platform_admin security definer function
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  );
$$;

-- 3. RLS on platform_admins
CREATE POLICY "Platform admins can view platform_admins"
ON public.platform_admins
FOR SELECT
USING (public.is_platform_admin(auth.uid()));

-- 4. Create analytics_events table
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_church ON public.analytics_events(church_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can insert their own events"
ON public.analytics_events
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Platform admins can read all events"
ON public.analytics_events
FOR SELECT
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Church admins can read their church events"
ON public.analytics_events
FOR SELECT
USING (
  has_role_in_church(auth.uid(), church_id, 'admin'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'owner'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'pastor'::app_role)
);

-- 5. Platform admin policies on existing tables
CREATE POLICY "Platform admins can manage all churches"
ON public.churches
FOR ALL
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all sermons"
ON public.sermons
FOR SELECT
USING (public.is_platform_admin(auth.uid()));
