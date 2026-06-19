import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User as UserIcon, ShieldCheck } from "lucide-react";
import {
  DEMO_USERNAME,
  DEMO_PASSWORD,
  isLocallyAuthenticated,
  setLocallyAuthenticated,
} from "@/lib/demo-user";

import { isOtpVerified, setOtpVerified } from "@/lib/otp-pool";
import { BrandLoader } from "@/components/BrandLoader";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Central Bank of India" }] }),
  beforeLoad: () => {
    if (isLocallyAuthenticated() && isOtpVerified()) {
      throw redirect({ to: "/dashboard" });
    }
    if (isLocallyAuthenticated()) {
      throw redirect({ to: "/otp" });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.trim() === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setSubmitting(true);
      setLocallyAuthenticated(true);
      setOtpVerified(false);
      setTimeout(() => navigate({ to: "/otp", replace: true }), 1500);
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--banking-bg,#F4F7FC)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Central Bank of India</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure Internet Banking</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6 space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Sign in</h2>
            <p className="text-xs text-muted-foreground">
              Use your banking username and password to continue.
            </p>
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <div className="relative mt-1">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pl-9"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive font-medium" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Login"}
          </Button>

          <div className="text-xs text-muted-foreground bg-secondary rounded-md p-3 text-center">
            Demo credentials — username: <strong>demo123</strong> · password: <strong>demo123</strong>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Central Bank of India. All rights reserved.
        </p>
      </div>
    </div>
  );
}
