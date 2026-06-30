import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEMO_USERNAME,
  DEMO_PASSWORD,
  isLocallyAuthenticated,
  setLocallyAuthenticated,
} from "@/lib/demo-user";

import { isOtpVerified, setOtpVerified } from "@/lib/otp-pool";
import { BrandLoader } from "@/components/BrandLoader";
import bannerAsset from "@/assets/cbi-official-logo.png.asset.json";

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
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      {/* Top brand bar */}
      <header className="bg-gradient-to-r from-[#0B4DA2] via-[#1356b5] to-[#1E63C6] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <img
            src={bannerAsset.url}
            alt="Central Bank of India"
            className="h-12 sm:h-14 w-auto object-contain drop-shadow"
          />
          <nav className="hidden md:flex items-center gap-6 text-white/95 text-sm font-medium">
            <a href="#" className="hover:text-white">Contact Us</a>
            <span className="opacity-40">|</span>
            <a href="#" className="hover:text-white">Calculator</a>
            <span className="opacity-40">|</span>
            <a href="#" className="hover:text-white">Help</a>
            <span className="opacity-40">|</span>
            <a href="#" className="hover:text-white">More</a>
          </nav>
        </div>
      </header>

      {/* Hero with blue gradient + login panel */}
      <main className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#0B4DA2] via-[#1356b5] to-[#1E63C6]">
        {/* decorative blobs */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-white/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Welcome to<br/>Online Banking!
            </h1>
            <p className="mt-5 text-white/90 max-w-lg text-sm sm:text-base leading-relaxed">
              Explore our One Stop Banking Solution — your secure, user-friendly gateway
              to effortless banking, anytime, anywhere, and experience the seamless journey.
            </p>
            <div className="mt-10 hidden lg:block">
              <h3 className="text-white font-semibold">Security Tips to avoid Phishing Attacks</h3>
              <p className="text-xs text-white/80 mt-2 max-w-md">
                Always visit our Internet Banking Site directly. Keep your user id and
                password information safe and secure.
              </p>
            </div>
          </div>

          {/* Login card */}
          <div className="w-full max-w-md justify-self-center lg:justify-self-end bg-[#EAF2FB] rounded-2xl shadow-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#0B4DA2] text-center">
              Login to Personal Banking
            </h2>
            <p className="text-xs text-muted-foreground mt-1 text-center">VERSION: V1.3.28</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="username" className="text-foreground">
                  CIF / User ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="mt-1 bg-white h-11"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-foreground">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="mt-1 bg-white h-11"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-destructive font-medium" role="alert">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button type="button" className="text-sm text-[#0B4DA2] hover:underline font-medium">
                  Trouble Logging In ?
                </button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="bg-[#0B4DA2] hover:bg-[#0a4391] text-white px-8 rounded-full"
                >
                  {submitting ? "Signing in…" : "Login"}
                </Button>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground my-2">
                <div className="flex-1 h-px bg-border" />
                OR
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full border-[#0B4DA2] text-[#0B4DA2] hover:bg-[#0B4DA2]/5 h-11"
              >
                Cent eeZ Registration
              </Button>

            </form>
          </div>
        </div>

        {/* Footer links */}
        <div className="relative border-t border-white/10 bg-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <span className="opacity-40">|</span>
            <Link to="/terms" className="hover:text-white">Terms &amp; Conditions</Link>
            <span className="opacity-40">|</span>
            <Link to="/disclaimer" className="hover:text-white">Disclaimer</Link>
            <span className="ml-auto text-xs text-white/70">
              © 2026 Central Bank of India. Demonstration project.
            </span>
          </div>
        </div>
      </main>

      {submitting && <BrandLoader message="Securing your session…" />}
    </div>
  );
}
