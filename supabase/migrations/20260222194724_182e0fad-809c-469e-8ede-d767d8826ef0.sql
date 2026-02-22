
-- Create platform_expenses table
CREATE TABLE public.platform_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount_cents integer NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly',
  category text NOT NULL DEFAULT 'other',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access on expenses"
ON public.platform_expenses FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE TRIGGER update_platform_expenses_updated_at
BEFORE UPDATE ON public.platform_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create platform_cost_config table
CREATE TABLE public.platform_cost_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value_cents integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_cost_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access on cost config"
ON public.platform_cost_config FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE TRIGGER update_platform_cost_config_updated_at
BEFORE UPDATE ON public.platform_cost_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default cost config values
INSERT INTO public.platform_cost_config (key, value_cents, label) VALUES
  ('base_hosting_monthly', 2500, 'Base Hosting (monthly)'),
  ('cost_per_sermon', 50, 'Cost per Sermon Processed'),
  ('cost_per_member', 0, 'Cost per Member');

-- Add platform admin SELECT policy on sermon_jobs
CREATE POLICY "Platform admins can view all sermon jobs"
ON public.sermon_jobs FOR SELECT
USING (is_platform_admin(auth.uid()));
