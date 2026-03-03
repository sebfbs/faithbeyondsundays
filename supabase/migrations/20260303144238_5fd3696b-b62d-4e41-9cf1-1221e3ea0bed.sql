
-- Create content_reports table for UGC moderation (Apple Guideline 1.2)
CREATE TABLE public.content_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  content_type text NOT NULL, -- 'prayer_request', 'group_message', 'profile'
  content_id uuid, -- nullable for profile reports
  reason text NOT NULL, -- 'spam', 'harassment', 'inappropriate', 'other'
  details text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'actioned'
  church_id uuid,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS for content_reports
CREATE POLICY "Users can create reports"
ON public.content_reports FOR INSERT
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
ON public.content_reports FOR SELECT
USING (reporter_id = auth.uid());

CREATE POLICY "Church admins can view reports in their church"
ON public.content_reports FOR SELECT
USING (
  has_role_in_church(auth.uid(), church_id, 'admin'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'owner'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'pastor'::app_role)
);

CREATE POLICY "Church admins can update reports in their church"
ON public.content_reports FOR UPDATE
USING (
  has_role_in_church(auth.uid(), church_id, 'admin'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'owner'::app_role)
  OR has_role_in_church(auth.uid(), church_id, 'pastor'::app_role)
);

CREATE POLICY "Platform admins can view all reports"
ON public.content_reports FOR SELECT
USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update all reports"
ON public.content_reports FOR UPDATE
USING (is_platform_admin(auth.uid()));

-- RLS for blocked_users
CREATE POLICY "Users can manage their own blocks"
ON public.blocked_users FOR ALL
USING (blocker_id = auth.uid())
WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can see if they are blocked"
ON public.blocked_users FOR SELECT
USING (blocked_id = auth.uid());

-- Helper function: check if user A has blocked user B
CREATE OR REPLACE FUNCTION public.is_blocked(blocker uuid, blocked uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE blocker_id = blocker AND blocked_id = blocked
  );
$$;

-- Trigger for updated_at on content_reports
CREATE TRIGGER update_content_reports_updated_at
BEFORE UPDATE ON public.content_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_content_reports_church_status ON public.content_reports (church_id, status);
CREATE INDEX idx_content_reports_reported_user ON public.content_reports (reported_user_id);
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users (blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users (blocked_id);
