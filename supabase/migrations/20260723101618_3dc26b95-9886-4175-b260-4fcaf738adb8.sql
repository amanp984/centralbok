
-- Replace open demo policies with owner-scoped RLS
DROP POLICY IF EXISTS "demo open accounts" ON public.accounts;
DROP POLICY IF EXISTS "demo open beneficiaries" ON public.beneficiaries;
DROP POLICY IF EXISTS "demo open profile" ON public.profiles;
DROP POLICY IF EXISTS "demo open transactions" ON public.transactions;
DROP POLICY IF EXISTS "demo open settings" ON public.user_settings;

REVOKE ALL ON public.accounts, public.beneficiaries, public.profiles, public.transactions, public.user_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts, public.beneficiaries, public.profiles, public.transactions, public.user_settings TO authenticated;

CREATE POLICY "Users manage own accounts" ON public.accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own beneficiaries" ON public.beneficiaries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own settings" ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lock down SECURITY DEFINER function so only authenticated users can call it
REVOKE ALL ON FUNCTION public.execute_transfer(uuid, numeric, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_transfer(uuid, numeric, text, text, text, text, text) TO authenticated;
