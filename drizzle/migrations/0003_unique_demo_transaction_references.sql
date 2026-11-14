CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_reference_unique
ON public.transactions (user_id, reference);