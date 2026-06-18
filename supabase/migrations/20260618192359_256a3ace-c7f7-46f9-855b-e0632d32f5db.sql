
-- Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.execute_transfer(uuid, numeric, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_transfer(uuid, numeric, text, text, text, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_beneficiary_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Realtime: scope channel subscriptions to the owning user
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users subscribe to own banking topic" ON realtime.messages;
CREATE POLICY "users subscribe to own banking topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING ( realtime.topic() = 'banking:' || (SELECT auth.uid()::text) );
