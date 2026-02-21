
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'pastor', 'leader', 'member');
CREATE TYPE public.sermon_status AS ENUM ('pending', 'uploading', 'transcribing', 'generating', 'complete', 'failed');
CREATE TYPE public.sermon_source_type AS ENUM ('upload', 'youtube', 'vimeo');
CREATE TYPE public.sermon_content_type AS ENUM ('spark', 'takeaways', 'reflection_questions', 'scriptures', 'chapters', 'weekly_challenge', 'weekend_reflection');
CREATE TYPE public.job_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'retrying');
CREATE TYPE public.prayer_visibility AS ENUM ('church', 'private');

-- ============================================================
-- CHURCHES
-- ============================================================
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  giving_url TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_churches_code ON public.churches (code);
CREATE INDEX idx_churches_active ON public.churches (is_active) WHERE is_active = true;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  instagram_handle TEXT,
  bio TEXT,
  streak_current INT NOT NULL DEFAULT 0,
  streak_longest INT NOT NULL DEFAULT 0,
  challenges_completed INT NOT NULL DEFAULT 0,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX idx_profiles_church_id ON public.profiles (church_id);
CREATE INDEX idx_profiles_username ON public.profiles (username);

-- ============================================================
-- USER ROLES (separate table — never on profiles)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, church_id, role)
);

CREATE INDEX idx_user_roles_user ON public.user_roles (user_id);
CREATE INDEX idx_user_roles_church ON public.user_roles (church_id);

-- ============================================================
-- SECURITY DEFINER FUNCTIONS (prevent RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role_in_church(_user_id UUID, _church_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND church_id = _church_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_church_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- ============================================================
-- SERMONS (data table — no queue logic here)
-- ============================================================
CREATE TABLE public.sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  speaker TEXT,
  sermon_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration TEXT,
  source_type public.sermon_source_type NOT NULL DEFAULT 'upload',
  source_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  storage_path TEXT,
  thumbnail_url TEXT,
  status public.sermon_status NOT NULL DEFAULT 'pending',
  is_current BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sermons_church ON public.sermons (church_id);
CREATE INDEX idx_sermons_church_current ON public.sermons (church_id, is_current) WHERE is_current = true;
CREATE INDEX idx_sermons_church_published ON public.sermons (church_id, is_published, sermon_date DESC);
CREATE INDEX idx_sermons_status ON public.sermons (status) WHERE status NOT IN ('complete', 'failed');

-- ============================================================
-- SERMON JOBS (dedicated processing queue — decoupled from sermons)
-- ============================================================
CREATE TABLE public.sermon_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'full_pipeline',
  status public.job_status NOT NULL DEFAULT 'queued',
  priority INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  worker_id TEXT,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optimized for queue polling: pick oldest queued/retrying jobs first
CREATE INDEX idx_sermon_jobs_queue ON public.sermon_jobs (status, priority DESC, created_at ASC)
  WHERE status IN ('queued', 'retrying');
-- Prevent duplicate active jobs per sermon
CREATE UNIQUE INDEX idx_sermon_jobs_active ON public.sermon_jobs (sermon_id)
  WHERE status IN ('queued', 'processing', 'retrying');
-- Lock-based polling
CREATE INDEX idx_sermon_jobs_locked ON public.sermon_jobs (locked_until)
  WHERE status = 'processing';

-- ============================================================
-- SERMON TRANSCRIPTS (large text, separate for perf)
-- ============================================================
CREATE TABLE public.sermon_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE UNIQUE,
  full_text TEXT NOT NULL,
  word_count INT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SERMON CONTENT (AI-generated structured content)
-- ============================================================
CREATE TABLE public.sermon_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id UUID NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  content_type public.sermon_content_type NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sermon_id, content_type, version)
);

CREATE INDEX idx_sermon_content_sermon ON public.sermon_content (sermon_id);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  sermon_id UUID REFERENCES public.sermons(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL DEFAULT 'sermon',
  title TEXT,
  content TEXT NOT NULL,
  is_bookmarked BOOLEAN NOT NULL DEFAULT false,
  suggested_scripture_ref TEXT,
  suggested_scripture_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_user ON public.journal_entries (user_id, created_at DESC);
CREATE INDEX idx_journal_church ON public.journal_entries (church_id);

-- ============================================================
-- PRAYER REQUESTS
-- ============================================================
CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  visibility public.prayer_visibility NOT NULL DEFAULT 'church',
  is_answered BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ,
  prayer_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prayer_church ON public.prayer_requests (church_id, visibility, created_at DESC);
CREATE INDEX idx_prayer_user ON public.prayer_requests (user_id, created_at DESC);

-- ============================================================
-- COMMUNITY: FOLLOWS
-- ============================================================
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON public.follows (follower_id);
CREATE INDEX idx_follows_following ON public.follows (following_id);

-- ============================================================
-- COMMUNITY: GROUPS
-- ============================================================
CREATE TABLE public.community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_church ON public.community_groups (church_id);

CREATE TABLE public.community_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- ============================================================
-- STORAGE BUCKET for sermon media
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('sermon-media', 'sermon-media', false);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_churches_updated_at BEFORE UPDATE ON public.churches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sermons_updated_at BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sermon_jobs_updated_at BEFORE UPDATE ON public.sermon_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_journal_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_prayer_updated_at BEFORE UPDATE ON public.prayer_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- CHURCHES: publicly readable (for onboarding search), only admins can modify
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Churches are publicly readable"
  ON public.churches FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage their church"
  ON public.churches FOR ALL
  TO authenticated
  USING (public.has_role_in_church(auth.uid(), id, 'admin') OR public.has_role_in_church(auth.uid(), id, 'owner'));

-- PROFILES: users see own church members, update own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their church"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (church_id = public.get_user_church_id(auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- USER ROLES: only owners/admins can manage
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their church"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role_in_church(auth.uid(), church_id, 'owner') OR public.has_role_in_church(auth.uid(), church_id, 'admin'));

-- SERMONS: church members can read published, admins can manage
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view published sermons in their church"
  ON public.sermons FOR SELECT
  TO authenticated
  USING (church_id = public.get_user_church_id(auth.uid()) AND is_published = true);

CREATE POLICY "Admins can manage sermons in their church"
  ON public.sermons FOR ALL
  TO authenticated
  USING (
    public.has_role_in_church(auth.uid(), church_id, 'admin')
    OR public.has_role_in_church(auth.uid(), church_id, 'owner')
    OR public.has_role_in_church(auth.uid(), church_id, 'pastor')
  );

-- SERMON JOBS: only service role + admins
ALTER TABLE public.sermon_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view jobs in their church"
  ON public.sermon_jobs FOR SELECT
  TO authenticated
  USING (
    public.has_role_in_church(auth.uid(), church_id, 'admin')
    OR public.has_role_in_church(auth.uid(), church_id, 'owner')
    OR public.has_role_in_church(auth.uid(), church_id, 'pastor')
  );

-- SERMON TRANSCRIPTS: same access as sermons
ALTER TABLE public.sermon_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view transcripts for published sermons"
  ON public.sermon_transcripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sermons s
      WHERE s.id = sermon_id
        AND s.church_id = public.get_user_church_id(auth.uid())
        AND s.is_published = true
    )
  );

-- SERMON CONTENT: same access as sermons
ALTER TABLE public.sermon_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view content for published sermons"
  ON public.sermon_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sermons s
      WHERE s.id = sermon_id
        AND s.church_id = public.get_user_church_id(auth.uid())
        AND s.is_published = true
    )
  );

-- JOURNAL ENTRIES: users own their entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own journal entries"
  ON public.journal_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PRAYER REQUESTS: users manage own, church members see church-visible
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prayers"
  ON public.prayer_requests FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can view church prayer requests"
  ON public.prayer_requests FOR SELECT
  TO authenticated
  USING (
    visibility = 'church'
    AND church_id = public.get_user_church_id(auth.uid())
  );

-- FOLLOWS: users manage their own follows, visible to authenticated
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own follows"
  ON public.follows FOR ALL
  TO authenticated
  USING (follower_id = auth.uid())
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Follows are visible to authenticated users"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

-- COMMUNITY GROUPS: church members can view, admins can manage
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view groups in their church"
  ON public.community_groups FOR SELECT
  TO authenticated
  USING (church_id = public.get_user_church_id(auth.uid()));

CREATE POLICY "Admins can manage groups"
  ON public.community_groups FOR ALL
  TO authenticated
  USING (
    public.has_role_in_church(auth.uid(), church_id, 'admin')
    OR public.has_role_in_church(auth.uid(), church_id, 'owner')
    OR public.has_role_in_church(auth.uid(), church_id, 'leader')
  );

ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group membership"
  ON public.community_group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join/leave groups"
  ON public.community_group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON public.community_group_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- STORAGE: sermon-media bucket policies
CREATE POLICY "Admins can upload sermon media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sermon-media'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'owner')
      OR public.has_role(auth.uid(), 'pastor')
    )
  );

CREATE POLICY "Authenticated users can view sermon media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'sermon-media');
