ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS customer_id text,
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS branch text,
  ADD COLUMN IF NOT EXISTS branch_address text,
  ADD COLUMN IF NOT EXISTS communication_address text;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS upi_id text;

CREATE TABLE public.demo_login_config (
  user_id uuid PRIMARY KEY,
  username text NOT NULL,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.demo_login_config FROM anon, authenticated;
GRANT ALL ON public.demo_login_config TO service_role;
ALTER TABLE public.demo_login_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages demo login configuration"
  ON public.demo_login_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE public.demo_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.demo_admin_audit_log FROM anon, authenticated;
GRANT ALL ON public.demo_admin_audit_log TO service_role;
ALTER TABLE public.demo_admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages demo admin audit history"
  ON public.demo_admin_audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);