import { supabase } from "@/integrations/supabase/client";

/**
 * The app's UI gate (username / password) is backed by a REAL Supabase Auth
 * account. All banking tables are protected by owner-scoped RLS
 * (`auth.uid() = user_id`) — there is no anonymous access anymore.
 */
const BANK_AUTH_EMAIL = "dineshlalyadav90759@gmail.com";
const BANK_AUTH_PASSWORD = "Fr7t-Qz93Kd1-Vx52Mn8Tb";

export async function signInBankSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return true;
  const { error } = await supabase.auth.signInWithPassword({
    email: BANK_AUTH_EMAIL,
    password: BANK_AUTH_PASSWORD,
  });
  return !error;
}

export async function hasBankSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function signOutBankSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}
