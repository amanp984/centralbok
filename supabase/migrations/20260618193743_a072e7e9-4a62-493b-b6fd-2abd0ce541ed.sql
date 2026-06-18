
-- Drop all FKs to auth.users on every public table that has them
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname, cl.relname
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND con.contype = 'f'
      AND cl.relname IN ('profiles','accounts','beneficiaries','transactions','user_settings')
      AND EXISTS (
        SELECT 1 FROM pg_class rcl
        JOIN pg_namespace rns ON rns.oid = rcl.relnamespace
        WHERE rcl.oid = con.confrelid AND rns.nspname = 'auth' AND rcl.relname = 'users'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.relname, r.conname);
  END LOOP;
END $$;

-- Seed demo user data (the prior migration partially applied; profile may already exist)
INSERT INTO public.profiles (id, full_name, last_login)
VALUES ('00000000-0000-0000-0000-0000000000d1', 'Demo User', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.accounts (user_id, account_number, account_type, ifsc, balance, is_primary)
SELECT '00000000-0000-0000-0000-0000000000d1', '1234567890', 'SAVINGS', 'CBIN0280001', 250000, true
WHERE NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = '00000000-0000-0000-0000-0000000000d1');

INSERT INTO public.user_settings (user_id)
SELECT '00000000-0000-0000-0000-0000000000d1'
WHERE NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = '00000000-0000-0000-0000-0000000000d1');
