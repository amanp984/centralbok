
-- user_settings: profile prefs, notifications, security, preferences
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  address text,
  notify_email boolean NOT NULL DEFAULT true,
  notify_sms boolean NOT NULL DEFAULT true,
  notify_push boolean NOT NULL DEFAULT false,
  notify_marketing boolean NOT NULL DEFAULT false,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  login_alerts boolean NOT NULL DEFAULT true,
  language text NOT NULL DEFAULT 'en',
  currency text NOT NULL DEFAULT 'INR',
  theme text NOT NULL DEFAULT 'light',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON public.beneficiaries(user_id);

-- Atomic fund transfer RPC: debits source account, credits transaction record
CREATE OR REPLACE FUNCTION public.execute_transfer(
  p_account_id uuid,
  p_amount numeric,
  p_mode text,
  p_beneficiary_name text,
  p_beneficiary_account text,
  p_beneficiary_ifsc text,
  p_description text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_balance numeric;
  v_new_balance numeric;
  v_ref text;
  v_tx_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT balance INTO v_balance FROM public.accounts
   WHERE id = p_account_id AND user_id = v_user FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_new_balance := v_balance - p_amount;
  UPDATE public.accounts SET balance = v_new_balance, updated_at = now()
   WHERE id = p_account_id;

  v_ref := upper(p_mode) || to_char(now(),'YYYYMMDDHH24MISS') || lpad((floor(random()*1000))::text,3,'0');

  INSERT INTO public.transactions (
    user_id, account_id, amount, direction, mode, description, reference,
    running_balance, beneficiary_name, beneficiary_account, beneficiary_ifsc
  ) VALUES (
    v_user, p_account_id, p_amount, 'debit', upper(p_mode), p_description, v_ref,
    v_new_balance, p_beneficiary_name, p_beneficiary_account, p_beneficiary_ifsc
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('reference', v_ref, 'transaction_id', v_tx_id, 'new_balance', v_new_balance);
END;
$$;
GRANT EXECUTE ON FUNCTION public.execute_transfer(uuid, numeric, text, text, text, text, text) TO authenticated;

-- Auto-create user_settings on signup (extend existing handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acct_num text;
BEGIN
  INSERT INTO public.profiles (id, full_name, last_login)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), now());
  acct_num := lpad((floor(random()*9000000000)+1000000000)::text, 10, '0');
  INSERT INTO public.accounts (user_id, account_number, account_type, ifsc, balance, is_primary)
  VALUES (NEW.id, acct_num, 'SAVINGS', 'CBIN0280001', 250000, true);
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
