
-- Drop existing auth.uid()-scoped policies and replace with fully-open demo policies.
DROP POLICY IF EXISTS "own accounts" ON public.accounts;
DROP POLICY IF EXISTS "own transactions" ON public.transactions;
DROP POLICY IF EXISTS "own beneficiaries" ON public.beneficiaries;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
DROP POLICY IF EXISTS "own settings" ON public.user_settings;

CREATE POLICY "demo open accounts" ON public.accounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open transactions" ON public.transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open beneficiaries" ON public.beneficiaries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open profile" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open settings" ON public.user_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO anon;

-- Ensure profile + settings exist for the demo user
INSERT INTO public.profiles (id, full_name)
VALUES ('00000000-0000-0000-0000-0000000000d1', 'Rambabu Prajapati')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO public.user_settings (user_id, phone, address)
VALUES ('00000000-0000-0000-0000-0000000000d1', '+91 98XXXXXX72', 'B-204, Sun Residency, Andheri East, Mumbai')
ON CONFLICT DO NOTHING;
