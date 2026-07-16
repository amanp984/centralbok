
UPDATE public.accounts SET balance = 0;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE acct_num text;
BEGIN
  INSERT INTO public.profiles (id, full_name, last_login)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), now());
  acct_num := lpad((floor(random()*9000000000)+1000000000)::text, 10, '0');
  INSERT INTO public.accounts (user_id, account_number, account_type, ifsc, balance, is_primary)
  VALUES (NEW.id, acct_num, 'SAVINGS', 'CBIN0280001', 0, true);
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;
