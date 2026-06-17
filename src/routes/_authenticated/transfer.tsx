import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, Download, ArrowRight, Zap, Clock, Building2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useBeneficiaries, qk, type Beneficiary, type Transaction } from "@/hooks/use-banking-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatINR, IFSC_REGEX, ACCOUNT_REGEX, maskAccount } from "@/lib/banking";
import { exportTransactionReceiptPDF } from "@/lib/exports";

type SearchParams = { beneficiaryId?: string };

export const Route = createFileRoute("/_authenticated/transfer")({
  head: () => ({ meta: [{ title: "Fund Transfer — Central Bank of India" }] }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    beneficiaryId: typeof s.beneficiaryId === "string" ? s.beneficiaryId : undefined,
  }),
  component: TransferPage,
});

const MODES = [
  { value: "UPI", label: "UPI", desc: "Instant • 24×7", limit: 100000, icon: Zap },
  { value: "IMPS", label: "IMPS", desc: "Instant • 24×7", limit: 500000, icon: Zap },
  { value: "NEFT", label: "NEFT", desc: "Within 2 hours", limit: 10000000, icon: Clock },
  { value: "RTGS", label: "RTGS", desc: "Real-time • Min ₹2L", limit: 100000000, icon: Building2 },
] as const;

const schema = z.object({
  beneficiaryId: z.string().min(1, "Select a beneficiary"),
  amount: z.number().positive("Amount must be positive"),
  mode: z.enum(["UPI", "IMPS", "NEFT", "RTGS"]),
  remarks: z.string().max(140).optional(),
});

function TransferPage() {
  const { beneficiaryId: initialBenef } = Route.useSearch();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: accounts, isLoading: aLoading } = useAccounts(user?.id);
  const { data: beneficiaries, isLoading: bLoading } = useBeneficiaries(user?.id);

  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [beneficiaryId, setBeneficiaryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<"UPI" | "IMPS" | "NEFT" | "RTGS">("IMPS");
  const [remarks, setRemarks] = useState("");
  const [resultTx, setResultTx] = useState<Transaction | null>(null);
  const [formError, setFormError] = useState<string>("");

  useEffect(() => { if (initialBenef) setBeneficiaryId(initialBenef); }, [initialBenef]);

  const primary = accounts?.find((a) => a.is_primary) ?? accounts?.[0];
  const selected = beneficiaries?.find((b) => b.id === beneficiaryId);
  const amountNum = parseFloat(amount || "0");
  const modeMeta = MODES.find((m) => m.value === mode)!;

  const transferMut = useMutation({
    mutationFn: async () => {
      if (!primary || !selected) throw new Error("Missing data");
      const { data, error } = await supabase.rpc("execute_transfer" as never, {
        p_account_id: primary.id,
        p_amount: amountNum,
        p_mode: mode,
        p_beneficiary_name: selected.name,
        p_beneficiary_account: selected.account_number,
        p_beneficiary_ifsc: selected.ifsc,
        p_description: remarks || `Transfer to ${selected.name}`,
      } as never);
      if (error) throw error;
      const result = data as { reference: string; transaction_id: string; new_balance: number };
      // Fetch full transaction for receipt
      const { data: tx } = await supabase.from("transactions").select("*").eq("id", result.transaction_id).single();
      return tx as Transaction;
    },
    onSuccess: (tx) => {
      setResultTx(tx);
      setStep("success");
      qc.invalidateQueries({ queryKey: qk.accounts(user!.id) });
      qc.invalidateQueries({ queryKey: qk.transactions(user!.id) });
      toast.success("Transfer successful");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleProceed = () => {
    setFormError("");
    const parsed = schema.safeParse({ beneficiaryId, amount: amountNum, mode, remarks });
    if (!parsed.success) { setFormError(parsed.error.issues[0].message); return; }
    if (!ACCOUNT_REGEX.test(selected!.account_number)) { setFormError("Invalid beneficiary account"); return; }
    if (!IFSC_REGEX.test(selected!.ifsc)) { setFormError("Invalid beneficiary IFSC"); return; }
    if (amountNum > modeMeta.limit) { setFormError(`Exceeds ${mode} limit of ${formatINR(modeMeta.limit)}`); return; }
    if (mode === "RTGS" && amountNum < 200000) { setFormError("RTGS minimum is ₹2,00,000"); return; }
    if (!primary || amountNum > primary.balance) { setFormError("Insufficient balance"); return; }
    setStep("confirm");
  };

  if (aLoading || bLoading) return <AppShell title="Fund Transfer"><Skeleton className="h-96 w-full max-w-3xl mx-auto" /></AppShell>;

  return (
    <AppShell title="Fund Transfer">
      <div className="max-w-3xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 text-xs">
          {(["form","confirm","success"] as const).map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                arr.indexOf(step) >= i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>{i+1}</div>
              <span className="hidden sm:inline">{s === "form" ? "Details" : s === "confirm" ? "Confirm" : "Receipt"}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${arr.indexOf(step) > i ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === "form" && (
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6 space-y-5">
            <h2 className="text-lg font-bold">Transfer Details</h2>
            <div>
              <Label>From Account</Label>
              <div className="mt-1 p-3 rounded-md bg-secondary text-sm">
                {primary ? <>{maskAccount(primary.account_number)} • Balance: <strong>{formatINR(primary.balance)}</strong></> : "No account"}
              </div>
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
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground bg-secondary rounded-md p-3">
              <div>Mode limit: <strong>{formatINR(modeMeta.limit)}</strong></div>
              <div>Processing: <strong>{modeMeta.desc}</strong></div>
            </div>
            <Button className="w-full" size="lg" onClick={handleProceed}>Proceed <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>
        )}

        {step === "confirm" && selected && (
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
            <h2 className="text-lg font-bold mb-4">Confirm Transfer</h2>
            <dl className="divide-y divide-border">
              {[
                ["Beneficiary", selected.name],
                ["Account Number", selected.account_number],
                ["IFSC", selected.ifsc],
                ["Amount", formatINR(amountNum)],
                ["Mode", mode],
                ["From A/C", primary ? maskAccount(primary.account_number) : "—"],
                ["Remarks", remarks || "—"],
              ].map(([k, v]) => (
                <div key={k} className="py-3 flex justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Back</Button>
              <Button className="flex-1" disabled={transferMut.isPending} onClick={() => transferMut.mutate()}>
                {transferMut.isPending ? "Processing…" : "Confirm & Pay"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && resultTx && primary && (
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-9 h-9 text-success" />
            </div>
            <h2 className="text-2xl font-bold">Transfer Successful</h2>
            <p className="text-muted-foreground mt-1">{formatINR(resultTx.amount)} sent to {resultTx.beneficiary_name}</p>
            <div className="mt-5 mx-auto max-w-md text-left bg-secondary rounded-md p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono">{resultTx.reference}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span>{resultTx.mode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Available Balance</span><span className="font-semibold">{formatINR(resultTx.running_balance ?? 0)}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
              <Button variant="outline" onClick={() => exportTransactionReceiptPDF(resultTx, {
                customerName: user?.email ?? "Customer", accountNumber: primary.account_number, ifsc: primary.ifsc,
              }, `receipt-${resultTx.reference}.pdf`)}>
                <Download className="w-4 h-4 mr-2" /> Download Receipt
              </Button>
              <Button onClick={() => { setStep("form"); setAmount(""); setRemarks(""); setResultTx(null); }}>New Transfer</Button>
              <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
