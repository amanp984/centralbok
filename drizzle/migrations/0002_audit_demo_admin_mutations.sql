CREATE OR REPLACE FUNCTION public.save_demo_admin_profile(
  p_user_id uuid,
  p_profile jsonb,
  p_account jsonb,
  p_login jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_profile jsonb;
  old_account jsonb;
  old_login jsonb;
  target_account_id uuid;
BEGIN
  SELECT to_jsonb(p) INTO old_profile FROM public.profiles p WHERE p.id = p_user_id;
  SELECT a.id, to_jsonb(a) INTO target_account_id, old_account
  FROM public.accounts a WHERE a.user_id = p_user_id AND a.is_primary = true LIMIT 1;
  IF target_account_id IS NULL THEN
    RAISE EXCEPTION 'Primary demo account not found';
  END IF;
  SELECT jsonb_build_object('username', l.username) INTO old_login
  FROM public.demo_login_config l WHERE l.user_id = p_user_id;

  INSERT INTO public.profiles (id, full_name, email, mobile, customer_id, branch, branch_address, communication_address, updated_at)
  VALUES (
    p_user_id,
    p_profile->>'full_name',
    p_profile->>'email',
    p_profile->>'mobile',
    p_profile->>'customer_id',
    p_profile->>'branch',
    p_profile->>'branch_address',
    p_profile->>'communication_address',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    mobile = EXCLUDED.mobile,
    customer_id = EXCLUDED.customer_id,
    branch = EXCLUDED.branch,
    branch_address = EXCLUDED.branch_address,
    communication_address = EXCLUDED.communication_address,
    updated_at = now();

  UPDATE public.accounts SET
    account_number = p_account->>'account_number',
    account_type = p_account->>'account_type',
    ifsc = p_account->>'ifsc',
    updated_at = now()
  WHERE id = target_account_id AND user_id = p_user_id;

  INSERT INTO public.demo_login_config (user_id, username, password_salt, password_hash, updated_at)
  VALUES (p_user_id, p_login->>'username', p_login->>'password_salt', p_login->>'password_hash', now())
  ON CONFLICT (user_id) DO UPDATE SET
    username = EXCLUDED.username,
    password_salt = EXCLUDED.password_salt,
    password_hash = EXCLUDED.password_hash,
    updated_at = now();

  INSERT INTO public.demo_admin_audit_log (user_id, entity, entity_id, action, old_values, new_values)
  VALUES (
    p_user_id,
    'profile',
    p_user_id::text,
    'update',
    jsonb_build_object('profile', old_profile, 'account', old_account, 'login', old_login),
    jsonb_build_object('profile', p_profile, 'account', p_account, 'username', p_login->>'username', 'passwordChanged', (p_login->>'password_changed')::boolean)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.save_demo_admin_profile(uuid, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_demo_admin_profile(uuid, jsonb, jsonb, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.change_demo_transaction(
  p_user_id uuid,
  p_action text,
  p_transaction_id uuid,
  p_transaction jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_transaction jsonb;
  new_transaction jsonb;
  target_account_id uuid;
  resolved_id uuid;
  transaction_row public.transactions%ROWTYPE;
BEGIN
  IF p_action NOT IN ('add', 'update', 'delete') THEN
    RAISE EXCEPTION 'Invalid demo transaction action';
  END IF;

  IF p_action <> 'add' THEN
    SELECT to_jsonb(t) INTO old_transaction FROM public.transactions t
    WHERE t.id = p_transaction_id AND t.user_id = p_user_id;
    IF old_transaction IS NULL THEN RAISE EXCEPTION 'The selected demo transaction no longer exists'; END IF;
  END IF;

  IF p_action = 'delete' THEN
    DELETE FROM public.transactions WHERE id = p_transaction_id AND user_id = p_user_id;
    INSERT INTO public.demo_admin_audit_log (user_id, entity, entity_id, action, old_values)
    VALUES (p_user_id, 'transaction', p_transaction_id::text, 'delete', old_transaction);
    RETURN jsonb_build_object('ok', true, 'id', p_transaction_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.user_id = p_user_id AND t.reference = p_transaction->>'reference'
      AND (p_action = 'add' OR t.id <> p_transaction_id)
  ) THEN
    RAISE EXCEPTION 'That reference number is already used by another demo transaction';
  END IF;

  IF p_action = 'add' THEN
    SELECT a.id INTO target_account_id FROM public.accounts a
    WHERE a.user_id = p_user_id AND a.is_primary = true LIMIT 1;
    IF target_account_id IS NULL THEN RAISE EXCEPTION 'Primary demo account not found'; END IF;

    INSERT INTO public.transactions (
      user_id, account_id, amount, direction, mode, beneficiary_name, upi_id,
      beneficiary_account, beneficiary_ifsc, reference, description, created_at
    ) VALUES (
      p_user_id, target_account_id, (p_transaction->>'amount')::numeric,
      p_transaction->>'direction', p_transaction->>'mode',
      NULLIF(p_transaction->>'beneficiary_name', ''), NULLIF(p_transaction->>'upi_id', ''),
      NULLIF(p_transaction->>'beneficiary_account', ''), NULLIF(p_transaction->>'beneficiary_ifsc', ''),
      p_transaction->>'reference', p_transaction->>'description', (p_transaction->>'created_at')::timestamptz
    ) RETURNING * INTO transaction_row;
  ELSE
    UPDATE public.transactions SET
      amount = (p_transaction->>'amount')::numeric,
      direction = p_transaction->>'direction',
      mode = p_transaction->>'mode',
      beneficiary_name = NULLIF(p_transaction->>'beneficiary_name', ''),
      upi_id = NULLIF(p_transaction->>'upi_id', ''),
      beneficiary_account = NULLIF(p_transaction->>'beneficiary_account', ''),
      beneficiary_ifsc = NULLIF(p_transaction->>'beneficiary_ifsc', ''),
      reference = p_transaction->>'reference',
      description = p_transaction->>'description',
      created_at = (p_transaction->>'created_at')::timestamptz
    WHERE id = p_transaction_id AND user_id = p_user_id
    RETURNING * INTO transaction_row;
  END IF;

  resolved_id := transaction_row.id;
  new_transaction := to_jsonb(transaction_row);
  INSERT INTO public.demo_admin_audit_log (user_id, entity, entity_id, action, old_values, new_values)
  VALUES (p_user_id, 'transaction', resolved_id::text, p_action, old_transaction, new_transaction);

  RETURN jsonb_build_object('ok', true, 'id', resolved_id);
END;
$$;
REVOKE ALL ON FUNCTION public.change_demo_transaction(uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_demo_transaction(uuid, text, uuid, jsonb) TO service_role;