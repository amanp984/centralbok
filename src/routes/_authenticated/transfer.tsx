import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, type ClipboardEvent, type KeyboardEvent } from "react";
import { ArrowRight, AlertTriangle, Zap, Clock, Building2, Smartphone, Lock, Star, Plus, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useBeneficiaries, useTransactions, type Beneficiary } from "@/hooks/use-banking-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, maskAccount, formatDateTime } from "@/lib/banking";
import { DEMO_TRANSACTION_PASSWORD, DEMO_LIMITS } from "@/lib/demo-user";

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
  const { data: accounts } = useAccounts(user?.id);
  const { data: beneficiaries } = useBeneficiaries(user?.id);
  const { data: transactions } = useTransactions(user?.id, 200);

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

  const used = (m: string) => (transactions ?? [])
    .filter((t) => t.direction === "debit" && t.mode === m)
    .reduce((s, t) => s + Number(t.amount), 0);
  const usage = useMemo(() => ({
    IMPS: { limit: DEMO_LIMITS.imps, used: used("IMPS") },
    NEFT: { limit: DEMO_LIMITS.neft, used: used("NEFT") },
    RTGS: { limit: DEMO_LIMITS.rtgs, used: used("RTGS") },
    UPI:  { limit: DEMO_LIMITS.upi,  used: used("UPI")  },
  }), [transactions]); // eslint-disable-line react-hooks/exhaustive-deps
  const recent = (transactions ?? []).slice(0, 10);


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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Mode tiles */}
      {step === "details" && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {MODES.map((m) => {
            const u = usage[m.value as keyof typeof usage];
            const remaining = Math.max(0, u.limit - u.used);
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value as typeof mode)}
                className={`text-left rounded-2xl border p-4 transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className="w-5 h-5 text-primary" />
                  <span className="font-bold">{m.label}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{m.desc}</div>
                <div className="mt-3 text-[11px] text-muted-foreground">Remaining today</div>
                <div className="text-sm font-semibold text-success">{formatINR(remaining)}</div>
              </button>
            );
          })}
        </section>
      )}

      <div className="max-w-3xl">
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

      {/* Recent transfers + limit cards (always visible) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Recent Transfers</h2>
            <Link to="/statements" className="text-xs font-semibold text-primary">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No recent transfers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead className="text-muted-foreground uppercase tracking-wider">
                  <tr><th className="text-left py-2">Date</th><th className="text-left py-2">Mode</th><th className="text-left py-2">Beneficiary</th><th className="text-right py-2">Amount</th><th className="text-left py-2 pl-3">Reference</th></tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="py-2 whitespace-nowrap">{formatDateTime(t.created_at)}</td>
                      <td className="py-2"><span className="px-2 py-0.5 bg-secondary rounded">{t.mode}</span></td>
                      <td className="py-2 max-w-[140px] truncate">{t.beneficiary_name ?? t.description ?? "—"}</td>
                      <td className={`py-2 text-right font-semibold ${t.direction === "debit" ? "text-destructive" : "text-success"}`}>{t.direction === "debit" ? "−" : "+"} {formatINR(t.amount)}</td>
                      <td className="py-2 pl-3 font-mono text-[11px]">{t.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6">
          <h2 className="font-bold mb-4">Transfer Limits</h2>
          <div className="space-y-3">
            {(["IMPS","NEFT","RTGS","UPI"] as const).map((m) => {
              const u = usage[m];
              const remaining = Math.max(0, u.limit - u.used);
              const pct = Math.min(100, (u.used / u.limit) * 100);
              return (
                <div key={m} className="border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{m}</span>
                    <span className="text-xs text-muted-foreground">Limit {formatINR(u.limit)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 text-[11px]">
                    <span className="text-muted-foreground">Used <strong className="text-foreground">{formatINR(u.used)}</strong></span>
                    <span className="text-right text-muted-foreground">Left <strong className="text-success">{formatINR(remaining)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Beneficiaries */}
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Beneficiaries</h2>
          <Link to="/beneficiaries" className="text-xs font-semibold text-primary inline-flex items-center gap-1"><Plus className="w-3 h-3" />Manage</Link>
        </div>
        {(beneficiaries ?? []).length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No beneficiaries yet.{" "}
            <Link to="/beneficiaries" className="text-primary font-semibold">Add your first payee →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(beneficiaries ?? []).slice(0, 6).map((b) => (
              <button
                key={b.id}
                onClick={() => { setBeneficiaryId(b.id); setStep("details"); }}
                className="text-left border border-border rounded-xl p-3 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold truncate">{b.name}</div>
                  {b.is_favourite && <Star className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1 truncate">{b.account_number}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{b.ifsc}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-success font-semibold"><CheckCircle2 className="w-3 h-3" />Verified</div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

