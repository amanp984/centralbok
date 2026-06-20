import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { ArrowRight, AlertTriangle, Zap, Clock, Building2, Smartphone, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useBeneficiaries, type Beneficiary } from "@/hooks/use-banking-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, maskAccount } from "@/lib/banking";
import { DEMO_TRANSACTION_PASSWORD } from "@/lib/demo-user";

type SearchParams = { beneficiaryId?: string };

export const Route = createFileRoute("/_authenticated/transfer")({
  head: () => ({ meta: [{ title: "Fund Transfer — Central Bank of India" }] }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    beneficiaryId: typeof s.beneficiaryId === "string" ? s.beneficiaryId : undefined,
  }),
  component: TransferPage,
});

const MODES = [
  { value: "UPI", label: "UPI", desc: "Instant • Mobile", icon: Smartphone },
  { value: "IMPS", label: "IMPS", desc: "Instant • 24×7", icon: Zap },
  { value: "NEFT", label: "NEFT", desc: "Within 2 hours", icon: Clock },
  { value: "RTGS", label: "RTGS", desc: "Real-time • Min ₹2L", icon: Building2 },
] as const;

const OTP_LEN = 6;
const OTP_COUNTDOWN = 55;

type Step = "details" | "password" | "otp";

function TransferPage() {
  const { beneficiaryId: initialBenef } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: accounts, isLoading: aLoading } = useAccounts(user?.id);
  const { data: beneficiaries, isLoading: bLoading } = useBeneficiaries(user?.id);

  const [step, setStep] = useState<Step>("details");
  const [accountId, setAccountId] = useState<string>("");
  const [beneficiaryId, setBeneficiaryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<"UPI" | "IMPS" | "NEFT" | "RTGS">("IMPS");
  const [remarks, setRemarks] = useState("");
  const [txnPassword, setTxnPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [seconds, setSeconds] = useState(OTP_COUNTDOWN);
  const [formError, setFormError] = useState<string>("");
  const [mobileError, setMobileError] = useState<string>("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { if (initialBenef) setBeneficiaryId(initialBenef); }, [initialBenef]);
  useEffect(() => { if (accounts && accounts.length && !accountId) setAccountId((accounts.find((a) => a.is_primary) ?? accounts[0]).id); }, [accounts, accountId]);

  useEffect(() => {
    if (step !== "otp") return;
    setSeconds(OTP_COUNTDOWN);
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  const fromAccount = accounts?.find((a) => a.id === accountId);
  const selected = beneficiaries?.find((b) => b.id === beneficiaryId);
  const amountNum = parseFloat(amount || "0");

  if (aLoading || bLoading) return <div className="max-w-3xl mx-auto"><Skeleton className="h-96 w-full" /></div>;

  const proceedDetails = () => {
    setFormError("");
    if (!fromAccount) return setFormError("Select an account");
    if (!selected) return setFormError("Select a beneficiary");
    if (!amountNum || amountNum <= 0) return setFormError("Enter a valid amount");
    if (mode === "RTGS" && amountNum < 200000) return setFormError("RTGS minimum is ₹2,00,000");
    if (amountNum > fromAccount.balance) return setFormError("Insufficient balance");
    setStep("password");
  };

  const proceedPassword = () => {
    setFormError("");
    if (txnPassword.trim() !== DEMO_TRANSACTION_PASSWORD) return setFormError("Incorrect transaction password");
    setOtp(Array(OTP_LEN).fill(""));
    setStep("otp");
  };

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    const next = [...otp];
    if (!v) { next[i] = ""; setOtp(next); return; }
    if (v.length === 1) {
      next[i] = v; setOtp(next);
      if (i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
    } else {
      v.slice(0, OTP_LEN - i).split("").forEach((c, k) => (next[i + k] = c));
      setOtp(next);
      otpRefs.current[Math.min(i + v.length, OTP_LEN - 1)]?.focus();
    }
  };
  const onOtpKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const onOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!t) return;
    e.preventDefault();
    const next = Array(OTP_LEN).fill("");
    t.split("").forEach((c, k) => (next[k] = c));
    setOtp(next);
    otpRefs.current[Math.min(t.length, OTP_LEN - 1)]?.focus();
  };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileError("");
    if (otp.join("").length !== OTP_LEN) { setFormError("Please enter the 6 digit OTP"); return; }
    if (seconds === 0) { setFormError("OTP expired. Please restart the transfer."); return; }
    setFormError("");
    // Per spec: transfer must NOT execute. Show mobile-only error.
    setMobileError("This action cannot be completed. Please use Mobile Banking.");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const steps: Step[] = ["details", "password", "otp"];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        {steps.map((s, i, arr) => (
          <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-bold ${
              arr.indexOf(step) >= i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>{i + 1}</div>
            <span className="hidden sm:inline truncate">{s === "details" ? "Details" : s === "password" ? "Password" : "OTP"}</span>
            {i < arr.length - 1 && <div className={`flex-1 h-0.5 ${arr.indexOf(step) > i ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === "details" && (
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6 space-y-5">
          <h2 className="text-lg font-bold">Transfer Details</h2>

          <div>
            <Label>From Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {(accounts ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {maskAccount(a.account_number)} • {formatINR(a.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Beneficiary</Label>
            <Select value={beneficiaryId} onValueChange={setBeneficiaryId}>
              <SelectTrigger><SelectValue placeholder="Choose a payee" /></SelectTrigger>
              <SelectContent>
                {(beneficiaries ?? []).length === 0 && <div className="p-3 text-sm text-muted-foreground">No beneficiaries. Add one first.</div>}
                {(beneficiaries ?? []).map((b: Beneficiary) => (
                  <SelectItem key={b.id} value={b.id}>{b.name} — {b.account_number} ({b.ifsc})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label} — {m.desc}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <Input id="remarks" maxLength={140} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Purpose of transfer" />
          </div>

          {formError && <div className="text-sm text-destructive">{formError}</div>}
          <Button className="w-full" size="lg" onClick={proceedDetails}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      )}

      {step === "password" && selected && fromAccount && (
        <form
          onSubmit={(e) => { e.preventDefault(); proceedPassword(); }}
          className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6 space-y-5"
        >
          <h2 className="text-lg font-bold flex items-center gap-2"><Lock className="w-5 h-5 text-primary" />Transaction Password</h2>

          <dl className="divide-y divide-border text-sm">
            {[
              ["Beneficiary", selected.name],
              ["Account", selected.account_number],
              ["Amount", formatINR(amountNum)],
              ["Mode", mode],
              ["From", maskAccount(fromAccount.account_number)],
            ].map(([k, v]) => (
              <div key={k} className="py-2.5 flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium text-right break-all">{v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <Label htmlFor="txn-pw">Transaction Password</Label>
            <Input id="txn-pw" type="password" autoComplete="current-password"
              value={txnPassword} onChange={(e) => setTxnPassword(e.target.value)}
              placeholder="Enter transaction password" />
            <p className="text-xs text-muted-foreground mt-1">Demo password: <strong>demo123</strong></p>
          </div>

          {formError && <div className="text-sm text-destructive">{formError}</div>}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("details")}>Back</Button>
            <Button type="submit" className="flex-1">Verify & Get OTP <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={submitOtp}
          className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Verify OTP</h2>
            <div className={`font-mono font-semibold text-sm ${seconds <= 10 ? "text-destructive" : "text-foreground"}`}>{mm}:{ss}</div>
          </div>
          <p className="text-sm text-muted-foreground">
            We've sent a 6 digit OTP to your registered mobile to authorize this transfer.
          </p>

          <div className="flex justify-between gap-2" onPaste={onOtpPaste}>
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onOtpKey(i, e)}
                className="w-11 h-13 sm:w-14 sm:h-16 flex-1 text-center text-xl font-semibold rounded-lg border-2 border-border bg-white text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {formError && <div className="text-sm text-destructive">{formError}</div>}

          {mobileError && (
            <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-destructive">Action blocked</div>
                <div className="text-sm text-destructive/90 mt-1">{mobileError}</div>
                <div className="text-xs text-muted-foreground mt-2">No transaction has been created.</div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setMobileError(""); setStep("password"); }}>Back</Button>
            {mobileError ? (
              <Button type="button" className="flex-1" onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button>
            ) : (
              <Button type="submit" className="flex-1" disabled={seconds === 0}>Submit OTP</Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
