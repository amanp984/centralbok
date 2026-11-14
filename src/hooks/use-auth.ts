import { useEffect, useState } from "react";
import {
  DEMO_USER_ID,
  DEMO_EMAIL,
  DEMO_FULL_NAME,
  isLocallyAuthenticated,
} from "@/lib/demo-user";
import { useDemoProfile } from "@/hooks/use-banking-data";

export type DemoUser = {
  id: string;
  email: string;
  full_name: string;
};

const DEMO_USER: DemoUser = {
  id: DEMO_USER_ID,
  email: DEMO_EMAIL,
  full_name: DEMO_FULL_NAME,
};

/**
 * Local-only auth. No Supabase Auth. The "user" is a single fixed demo
 * identity unlocked by the username/password gate at /auth.
 */
export function useAuth() {
  const [authed, setAuthed] = useState<boolean>(() => isLocallyAuthenticated());
  const [loading, setLoading] = useState(true);
  const { data: profile } = useDemoProfile(authed ? DEMO_USER_ID : undefined);

  useEffect(() => {
    setAuthed(isLocallyAuthenticated());
    setLoading(false);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bank_demo_auth") setAuthed(isLocallyAuthenticated());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    user: authed ? { ...DEMO_USER, email: profile?.email ?? DEMO_EMAIL, full_name: profile?.full_name ?? DEMO_FULL_NAME } : null,
    session: authed ? { user: { ...DEMO_USER, email: profile?.email ?? DEMO_EMAIL, full_name: profile?.full_name ?? DEMO_FULL_NAME } } : null,
    loading,
  };
}
