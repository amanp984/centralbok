-- The app uses a local demo login (no Supabase Auth), so auth.uid() is NULL.
-- Restore access for the fixed demo user id to both anon and authenticated,
-- keeping the scope narrow to that single uuid.

-- Re-grant table privileges to anon (needed because the client uses the anon key)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO anon;

-- Demo-user-scoped policies (narrow: only the one hardcoded demo uuid)
CREATE POLICY "Demo user accounts" ON public.accounts
  FOR ALL TO anon, authenticated
  USING (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid);

CREATE POLICY "Demo user transactions" ON public.transactions
  FOR ALL TO anon, authenticated
  USING (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid);

CREATE POLICY "Demo user beneficiaries" ON public.beneficiaries
  FOR ALL TO anon, authenticated
  USING (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid);

CREATE POLICY "Demo user profile" ON public.profiles
  FOR ALL TO anon, authenticated
  USING (id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (id = '00000000-0000-0000-0000-0000000000d1'::uuid);

CREATE POLICY "Demo user settings" ON public.user_settings
  FOR ALL TO anon, authenticated
  USING (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-0000000000d1'::uuid);