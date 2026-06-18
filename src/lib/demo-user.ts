// Local-only demo login. No Supabase Auth.
// All app data is bound to this fixed user id; the database is fully open
// (RLS disabled) per the demo design.
export const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000d1";
export const DEMO_USERNAME = "demo123";
export const DEMO_PASSWORD = "demo123";
export const DEMO_FULL_NAME = "Demo User";
export const DEMO_EMAIL = "demo@centralbank.local";
export const AUTH_STORAGE_KEY = "bank_demo_auth";

export function isLocallyAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLocallyAuthenticated(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(AUTH_STORAGE_KEY, "1");
    else window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
