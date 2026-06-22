INSERT INTO public.profiles (id, full_name) VALUES ('00000000-0000-0000-0000-0000000000d1', 'Rambabu Prajapati') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.accounts (user_id, account_number, account_type, ifsc, balance, is_primary)
SELECT '00000000-0000-0000-0000-0000000000d1', '8923451267', 'CURRENT', 'CBIN0282734', 250000, true
WHERE NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id='00000000-0000-0000-0000-0000000000d1');