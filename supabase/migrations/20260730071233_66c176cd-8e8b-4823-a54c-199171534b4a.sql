DROP POLICY IF EXISTS "Demo user accounts" ON public.accounts;
DROP POLICY IF EXISTS "Demo user beneficiaries" ON public.beneficiaries;
DROP POLICY IF EXISTS "Demo user profile" ON public.profiles;
DROP POLICY IF EXISTS "Demo user transactions" ON public.transactions;
DROP POLICY IF EXISTS "Demo user settings" ON public.user_settings;

REVOKE ALL ON public.accounts FROM anon;
REVOKE ALL ON public.beneficiaries FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.transactions FROM anon;
REVOKE ALL ON public.user_settings FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.accounts TO service_role;
GRANT ALL ON public.beneficiaries TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.user_settings TO service_role;