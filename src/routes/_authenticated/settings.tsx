import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useTransactions, useTransactionsWithBalances } from "@/hooks/use-banking-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEMO_PROFILE, DEMO_LIMITS } from "@/lib/demo-user";
import { formatINR, formatDate, maskAccount } from "@/lib/banking";
import {
  ShieldCheck, CheckCircle2, Eye, EyeOff, KeyRound, Plus, RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  buildTransactionDescription,
  demoTransactionSchema,
  directionForTransactionType,
  paymentModes,
  transactionTypes,
  type DemoTransactionInput,
  type PaymentMode,
  type TransactionType,
} from "@/lib/demo-transaction-builder";
import { addDemoTransaction } from "@/lib/demo-transactions.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Central Bank of India" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: accounts, isLoading } = useAccounts(user?.id);
  const { data: transactions } = useTransactions(user?.id, 500);
  const { data: computed } = useTransactionsWithBalances(user?.id);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const profileClicks = useRef(0);
  const profileClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const primary = accounts?.find((a) => a.is_primary) ?? accounts?.[0];

  if (isLoading) return <div className="max-w-4xl mx-auto"><Skeleton className="h-96 w-full" /></div>;

  const used = (mode: string) =>
    (transactions ?? [])
      .filter((t) => t.direction === "debit" && t.mode === mode)
      .reduce((s, t) => s + Number(t.amount), 0);

  useEffect(() => () => {
    if (profileClickTimer.current) clearTimeout(profileClickTimer.current);
  }, []);

  const handleTabChange = (value: string) => {
    if (value !== "profile") {
      profileClicks.current = 0;
      if (profileClickTimer.current) clearTimeout(profileClickTimer.current);
    }
  };

  const handleProfileClick = () => {
    if (adminUnlocked) return;
    profileClicks.current += 1;
    if (profileClickTimer.current) clearTimeout(profileClickTimer.current);
    profileClickTimer.current = setTimeout(() => {
      profileClicks.current = 0;
    }, 5000);
    if (profileClicks.current === 10) {
      setAdminUnlocked(true);
      setAdminOpen(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="profile" onValueChange={handleTabChange}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile" onClick={handleProfileClick} className="relative">
            Profile
            {adminUnlocked && <KeyRound aria-label="Demo administration unlocked" className="h-3 w-3 text-primary" />}
          </TabsTrigger>
          <TabsTrigger value="account">Account Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card title="Profile Information">
            <Grid>
              <Row label="Full Name" value={DEMO_PROFILE.fullName} />
              <Row label="Mobile Number" value={DEMO_PROFILE.mobile} />
              <Row label="Email" value={DEMO_PROFILE.email} />
              <Row label="Address" value={DEMO_PROFILE.address} />
              <Row label="City" value={DEMO_PROFILE.city} />
              <Row label="State" value={DEMO_PROFILE.state} />
              <Row label="PIN Code" value={DEMO_PROFILE.pinCode} />
            </Grid>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card title="Security">
            <ul className="space-y-3 text-sm">
              <Sec label="Two-Step Verification" value="Enabled" />
              <Sec label="Login Alerts" value="Enabled" />
              <Sec label="Transaction Password" value="Set" />
              <Sec label="Device Binding" value="Active on 1 device" />
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card title="Account Details">
            <Grid>
              <Row label="Account Holder Name" value={DEMO_PROFILE.fullName} />
              <Row label="Account Number" value={primary?.account_number ?? "—"} mono />
              <Row label="IFSC" value={DEMO_PROFILE.ifsc} mono />
              <Row label="Branch" value={DEMO_PROFILE.branch} />
              <Row label="CIF" value={DEMO_PROFILE.cif} mono />
              <Row label="Customer ID" value={DEMO_PROFILE.customerId} mono />
              <Row label="Account Type" value={DEMO_PROFILE.accountType} />
              <Row label="Account Status" value={DEMO_PROFILE.accountStatus} accent="text-success" />
              <Row label="PAN Number" value={DEMO_PROFILE.pan} mono />
            </Grid>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card
            title="Daily Transaction Limits"
            right={<Link to="/limits" className="text-xs font-semibold text-primary">Open full view →</Link>}
          >
            <p className="text-sm text-muted-foreground mb-4">
              Overall daily limit: <strong className="text-foreground">{formatINR(DEMO_LIMITS.overall)}</strong>.
              Usage updates in real-time on every debit.
            </p>
            <div className="space-y-3">
              {[
                ["IMPS", DEMO_LIMITS.imps, used("IMPS")],
                ["NEFT", DEMO_LIMITS.neft, used("NEFT")],
                ["RTGS", DEMO_LIMITS.rtgs, used("RTGS")],
                ["UPI", DEMO_LIMITS.upi, used("UPI")],
              ].map(([label, lim, u]) => (
                <LimitRow key={label as string} mode={label as string} limit={lim as number} used={u as number} />
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <Card title="KYC Information">
            <Grid>
              <Row label="KYC Reference" value={DEMO_PROFILE.kycReference} mono />
              <Row label="PAN Number" value={DEMO_PROFILE.pan} mono />
              <Row label="Verification Status" value={DEMO_PROFILE.kycStatus} accent="text-success" />
              <Row label="KYC Completion Date" value={formatDate(DEMO_PROFILE.kycCompletionDate)} />
            </Grid>
            <div className="mt-4 flex items-center gap-2 text-xs text-success">
              <ShieldCheck className="w-4 h-4" /> KYC is up to date. No action required.
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card title="Notification Preferences">
            <ul className="space-y-3 text-sm">
              <Sec label="SMS Alerts" value="Enabled" />
              <Sec label="Email Alerts" value="Enabled" />
              <Sec label="Push Notifications" value="Enabled" />
              <Sec label="Security Alerts" value="Always On" />
              <Sec label="Promotional Offers" value="Disabled" />
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
      {adminUnlocked && (
        <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
          <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Demo Admin Panel</DialogTitle>
              <DialogDescription>Simulated transaction management for the authenticated demo account.</DialogDescription>
            </DialogHeader>
            <DemoTransactionBuilder
              openingBalance={computed?.finalBalance ?? 0}
              onSaved={() => setAdminOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

const initialBuilderState: DemoTransactionInput = {
  transactionType: "Credit",
  paymentMode: "UPI",
  amount: 0,
  name: "",
  upiId: "",
  accountSuffix: "",
  reference: "",
  accountNumber: "",
  ifsc: "",
  bankDetails: "",
};

function DemoTransactionBuilder({ openingBalance, onSaved }: { openingBalance: number; onSaved: () => void }) {
  const addTransaction = useServerFn(addDemoTransaction);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DemoTransactionInput>(initialBuilderState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const preview = useMemo(() => buildTransactionDescription(form), [form]);

  const setField = <K extends keyof DemoTransactionInput>(field: K, value: DemoTransactionInput[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleModeChange = (mode: PaymentMode) => {
    setForm((current) => ({ ...current, paymentMode: mode, upiId: mode === "UPI" ? current.upiId : "" }));
    setErrors({});
  };

  const handleTypeChange = (type: TransactionType) => {
    setField("transactionType", type);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = demoTransactionSchema.safeParse({ ...form, amount: Number(form.amount) });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      });
      setErrors(next);
      toast.error("Please complete the required transaction fields.");
      return;
    }

    setSaving(true);
    try {
      await addTransaction({ data: parsed.data });
      await queryClient.invalidateQueries({
        predicate: (query) => ["transactions", "accounts", "statement"].includes(String(query.queryKey[0])),
      });
      toast.success("Demo transaction added", { description: "Dashboard, statements and exports will use the saved narration." });
      setForm(initialBuilderState);
      setErrors({});
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add demo transaction");
    } finally {
      setSaving(false);
    }
  };

  const show = {
    upi: form.paymentMode === "UPI",
    suffix: form.paymentMode === "UPI" || form.paymentMode === "IMPS",
    account: ["NEFT", "RTGS", "TFR"].includes(form.paymentMode),
    ifsc: ["NEFT", "RTGS"].includes(form.paymentMode),
    bank: form.paymentMode !== "UPI" || form.transactionType === "Refund",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Transaction type" error={errors.transactionType}>
          <select value={form.transactionType} onChange={(event) => handleTypeChange(event.target.value as TransactionType)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring">
            {transactionTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel label="Payment mode" error={errors.paymentMode}>
          <select value={form.paymentMode} onChange={(event) => handleModeChange(event.target.value as PaymentMode)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring">
            {paymentModes.map((mode) => <option key={mode}>{mode}</option>)}
          </select>
        </FieldLabel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel label="Amount (INR)" required error={errors.amount}>
          <Input type="number" min="0.01" step="0.01" value={form.amount || ""} onChange={(event) => setField("amount", Number(event.target.value))} placeholder="0.00" />
        </FieldLabel>
        <FieldLabel label="Name" required={form.paymentMode !== "Other" || form.transactionType === "Refund"} error={errors.name}>
          <Input value={form.name} maxLength={120} onChange={(event) => setField("name", event.target.value)} placeholder="Counterparty or merchant" />
        </FieldLabel>
        {show.upi && <FieldLabel label="UPI ID" required error={errors.upiId}>
          <Input value={form.upiId} maxLength={120} onChange={(event) => setField("upiId", event.target.value)} placeholder="name@bank" />
        </FieldLabel>}
        {show.suffix && <FieldLabel label="Account suffix" required error={errors.accountSuffix}>
          <Input inputMode="numeric" maxLength={4} value={form.accountSuffix} onChange={(event) => setField("accountSuffix", event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Last 4 digits" />
        </FieldLabel>}
        {show.account && <FieldLabel label="Account number" required error={errors.accountNumber}>
          <Input inputMode="numeric" maxLength={18} value={form.accountNumber} onChange={(event) => setField("accountNumber", event.target.value.replace(/\D/g, "").slice(0, 18))} placeholder="9–18 digits" />
        </FieldLabel>}
        {show.ifsc && <FieldLabel label="IFSC" required error={errors.ifsc}>
          <Input value={form.ifsc} maxLength={11} onChange={(event) => setField("ifsc", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))} placeholder="e.g. CBIN0000000" />
        </FieldLabel>}
        <FieldLabel label={form.paymentMode === "UPI" ? "UTR / Reference number" : "Reference number"} required error={errors.reference}>
          <Input value={form.reference} maxLength={80} onChange={(event) => setField("reference", event.target.value)} placeholder="Transaction reference" />
        </FieldLabel>
        {show.bank && <FieldLabel label="Bank / reference details" error={errors.bankDetails}>
          <Input value={form.bankDetails} maxLength={160} onChange={(event) => setField("bankDetails", event.target.value)} placeholder="Optional bank or settlement note" />
        </FieldLabel>}
      </div>

      <section className="border border-border bg-secondary/40 p-4 rounded-lg" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transaction Description Preview</p>
            <p className="mt-2 text-sm font-medium text-foreground break-words">{preview}</p>
          </div>
          <RefreshCw className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Balance after save will be recalculated from the complete chronological transaction history.</p>
        <p className="mt-1 text-xs text-muted-foreground">Current calculated balance: <span className="font-semibold text-foreground">{formatINR(openingBalance)}</span></p>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}><Plus className="h-4 w-4" />{saving ? "Adding…" : "Add Transaction"}</Button>
      </div>
    </form>
  );
}

function FieldLabel({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}{error && <p className="text-xs text-destructive" role="alert">{error}</p>}</div>;
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6 mt-4">
      <div className="flex items-center justify-between mb-4 gap-3"><h2 className="font-bold">{title}</h2>{right}</div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</dl>;
}
function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-semibold text-sm truncate ${mono ? "font-mono" : ""} ${accent ?? "text-foreground"}`}>{value}</dd>
    </div>
  );
}
function Sec({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="font-medium">{label}</span>
      <span className="inline-flex items-center gap-1 text-success font-semibold">
        <CheckCircle2 className="w-4 h-4" /> {value}
      </span>
    </li>
  );
}
function LimitRow({ mode, limit, used }: { mode: string; limit: number; used: number }) {
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{mode}</span>
        <span className="text-muted-foreground">Limit: <strong className="text-foreground">{formatINR(limit)}</strong></span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 text-xs">
        <span className="text-muted-foreground">Used: <strong className="text-foreground">{formatINR(used)}</strong></span>
        <span className="text-right text-muted-foreground">Remaining: <strong className="text-success">{formatINR(remaining)}</strong></span>
      </div>
    </div>
  );
}
// suppress unused
void maskAccount;
