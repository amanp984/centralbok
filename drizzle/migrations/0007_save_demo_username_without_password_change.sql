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

  IF p_login->>'password_hash' IS NOT NULL AND p_login->>'password_salt' IS NOT NULL THEN
    INSERT INTO public.demo_login_config (user_id, username, password_salt, password_hash, updated_at)
    VALUES (p_user_id, p_login->>'username', p_login->>'password_salt', p_login->>'password_hash', now())
    ON CONFLICT (user_id) DO UPDATE SET
      username = EXCLUDED.username,
      password_salt = EXCLUDED.password_salt,
      password_hash = EXCLUDED.password_hash,
      updated_at = now();
  ELSE
    UPDATE public.demo_login_config
    SET username = p_login->>'username', updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.demo_admin_audit_log (user_id, entity, entity_id, action, old_values, new_values)
  VALUES (
    p_user_id,
    'profile',
    p_user_id::text,
    'update',
    jsonb_build_object('profile', old_profile, 'account', old_account, 'login', old_login),
    jsonb_build_object('profile', p_profile, 'account', p_account, 'username', p_login->>'username', 'passwordChanged', COALESCE((p_login->>'password_changed')::boolean, false))
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.save_demo_admin_profile(uuid, jsonb, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_demo_admin_profile(uuid, jsonb, jsonb, jsonb) TO service_role;