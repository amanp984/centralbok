import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { ShieldCheck, RotateCw } from "lucide-react";
import { isLocallyAuthenticated } from "@/lib/demo-user";
import { verifyAndConsumeOtp, setOtpVerified, isOtpVerified } from "@/lib/otp-pool";
import { BrandLoader } from "@/components/BrandLoader";
import logoAsset from "@/assets/brand-logo.png.asset.json";

export const Route = createFileRoute("/otp")({
  ssr: false,
  head: () => ({ meta: [{ title: "OTP Verification — Central Bank of India" }] }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!isLocallyAuthenticated()) throw redirect({ to: "/" });
    if (isOtpVerified()) throw redirect({ to: "/dashboard" });
  },
  component: OtpPage,
});

const LEN = 6;
const COUNTDOWN_START = 54;
const MAX_ATTEMPTS = 3;

function OtpPage() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [error, setError] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_START);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [resendKey, setResendKey] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  useEffect(() => {
    setSeconds(COUNTDOWN_START);
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendKey]);

  const resetStep = (msg?: string) => {
    setAttemptsLeft(MAX_ATTEMPTS);
    setDigits(Array(LEN).fill(""));
    setResendKey((k) => k + 1);
    setError(msg ?? "");
    refs.current[0]?.focus();
  };

  const setDigit = (i: number, v: string) => {
    const next = [...digits];
    next[i] = v;
    setDigits(next);
  };

  const handleChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    if (!v) { setDigit(i, ""); return; }
    if (v.length === 1) {
      setDigit(i, v);
      if (i < LEN - 1) refs.current[i + 1]?.focus();
    } else {
      const chars = v.slice(0, LEN - i).split("");
      const next = [...digits];
      chars.forEach((c, k) => (next[i + k] = c));
      setDigits(next);
      refs.current[Math.min(i + chars.length, LEN - 1)]?.focus();
    }
    setError("");
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(LEN).fill("");
    text.split("").forEach((c, k) => (next[k] = c));
    setDigits(next);
    refs.current[Math.min(text.length, LEN - 1)]?.focus();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== LEN) { setError("Please enter the 6 digit OTP."); return; }
    if (seconds === 0) { setError("OTP expired. Please request a new one."); return; }
    setVerifying(true);
    setError("");
    setTimeout(() => {
      const res = verifyAndConsumeOtp(code);
      if (res.ok) {
        setOtpVerified(true);
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setVerifying(false);
      if (res.reason === "used") {
        setError("OTP already used. Please enter a new OTP.");
        setDigits(Array(LEN).fill(""));
        refs.current[0]?.focus();
        return;
      }
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      setDigits(Array(LEN).fill(""));
      refs.current[0]?.focus();
      if (remaining <= 0) {
        resetStep("Too many invalid attempts. A fresh OTP has been issued.");
      } else {
        setError(`Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
      }
    }, 600);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0b4da2 0%, #134a93 50%, #1c64c4 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src={logoAsset.url}
            alt="Central Bank of India"
            className="w-16 h-16 mx-auto object-contain drop-shadow-lg"
          />
          <h1 className="text-white text-2xl font-bold mt-3">Two-Step Verification</h1>
          <p className="text-white/80 text-sm mt-1">
            Enter the 6 digit OTP to securely access your account.
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>One-time password</span>
            </div>
            <div className={`font-mono font-semibold ${seconds <= 10 ? "text-destructive" : "text-foreground"}`}>
              {mm}:{ss}
            </div>
          </div>

          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-13 sm:w-14 sm:h-16 flex-1 text-center text-xl font-semibold rounded-lg border-2 border-border bg-white text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error && (
            <div className="text-sm text-destructive font-medium text-center" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || seconds === 0}
            className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Verify & Continue"}
          </button>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Attempts remaining: <strong className="text-foreground">{attemptsLeft}</strong></span>
            <button
              type="button"
              onClick={() => resetStep()}
              disabled={seconds > 0}
              className="inline-flex items-center gap-1 text-primary disabled:text-muted-foreground/60"
            >
              <RotateCw className="w-3 h-3" /> Resend OTP
            </button>
          </div>
        </form>
      </div>

      {verifying && <BrandLoader message="Verifying OTP..." />}
    </div>
  );
}
