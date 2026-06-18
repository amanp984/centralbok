import { useEffect, useState } from "react";
import {
  DEMO_USER_ID,
  DEMO_EMAIL,
  DEMO_FULL_NAME,
  isLocallyAuthenticated,
} from "@/lib/demo-user";

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
    user: authed ? DEMO_USER : null,
    session: authed ? { user: DEMO_USER } : null,
    loading,
  };
}
