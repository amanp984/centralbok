import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Copy, ArrowLeftRight, FileText, ShieldCheck, Users, Gauge, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useTransactionsWithBalances, useHoldAmount, saveHoldAmount } from "@/hooks/use-banking-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatINR, maskAccount } from "@/lib/banking";
import { DEMO_PROFILE } from "@/lib/demo-user";
import { toast } from "sonner";
import logoAsset from "@/assets/brand-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "My Accounts — Central Bank of India" }] }),
  component: AccountsPage,
});

// Always-visible fallback so the page never appears blank.
const FALLBACK_ACCOUNT = {
  id: "demo-fallback",
  account_number: DEMO_PROFILE.accountNumber,
  ifsc: DEMO_PROFILE.ifsc,
  balance: 0,
  is_primary: true,
  account_type: "CURRENT",
};

function AccountsPage() {
  const { user } = useAuth();
  const { data: accounts } = useAccounts(user?.id);
  const { data: computed } = useTransactionsWithBalances(user?.id);
  const { data: holdAmount } = useHoldAmount(user?.id);
  const qc = useQueryClient();
  const [reveal, setReveal] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [holdInput, setHoldInput] = useState("");
  const [holdSaving, setHoldSaving] = useState(false);

  const primary =
    accounts?.find((a) => a.is_primary) ?? accounts?.[0] ?? FALLBACK_ACCOUNT;

  // Use the computed balance from transaction history (same source as Dashboard)
  const availableBalance = computed?.finalBalance ?? 0;

  const openHoldDialog = () => {
    setHoldInput(String(holdAmount ?? 0));
    setHoldOpen(true);
  };

  const submitHold = async () => {
    if (!user) return;
    const raw = holdInput.trim().replace(/[₹,\s]/g, "");
    if (raw === "") { toast.error("Enter a hold amount."); return; }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) { toast.error("Hold amount must be a valid number."); return; }
    if (parsed < 0) { toast.error("Hold amount cannot be negative."); return; }
    setHoldSaving(true);
    try {
      await saveHoldAmount(user.id, parsed);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Hold amount updated");
      setHoldOpen(false);
    } catch {
      toast.error("Could not save the hold amount. Please try again.");
    } finally {
      setHoldSaving(false);
    }
  };

  // Calculate monthly credits/debits from transaction history
  const monthlyCredit = (computed?.items ?? [])
    .filter((t) => t.direction === "credit" && isThisMonth(t.created_at))
    .reduce((s, t) => s + Number(t.amount), 0);
  const monthlyDebit = (computed?.items ?? [])
    .filter((t) => t.direction === "debit" && isThisMonth(t.created_at))
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero card */}
      <div
        className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
        style={{ background: "var(--gradient-account)" }}
      >
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-white/75 uppercase tracking-wider">{DEMO_PROFILE.accountType}</div>
              <div className="mt-2 font-mono text-lg sm:text-2xl tracking-[0.2em] flex items-center gap-2 flex-wrap break-all">
                {reveal ? primary.account_number : maskAccount(primary.account_number)}
                <button onClick={() => setReveal(!reveal)} aria-label="Toggle account visibility">
                  {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(primary.account_number); toast.success("Account number copied"); }}
                  aria-label="Copy account number"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img src={logoAsset.url} alt="CBI" className="w-12 h-12 shrink-0 object-contain mix-blend-screen" />
          </div>

          <div className="mt-5 text-sm text-white/80">Available Balance</div>
          <div className="text-3xl font-bold">{formatINR(availableBalance)}</div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/transfer"><Button size="sm" variant="secondary"><ArrowLeftRight className="w-4 h-4 mr-1" />Transfer</Button></Link>
            <Link to="/statements"><Button size="sm" variant="secondary"><FileText className="w-4 h-4 mr-1" />Statement</Button></Link>
            <Link to="/beneficiaries"><Button size="sm" variant="secondary"><Users className="w-4 h-4 mr-1" />Payees</Button></Link>
            <Link to="/limits"><Button size="sm" variant="secondary"><Gauge className="w-4 h-4 mr-1" />Limits</Button></Link>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <Card title="Account Details">
        <Grid>
          <Row label="Account Holder Name" value={DEMO_PROFILE.fullName} />
          <Row label="Account Number" value={primary.account_number} mono />
          <Row label="Customer ID" value={DEMO_PROFILE.customerId} mono />
          <Row label="CIF Number" value={DEMO_PROFILE.cif} mono />
          <Row label="IFSC Code" value={DEMO_PROFILE.ifsc} mono />
          <Row label="MICR" value={DEMO_PROFILE.micr} mono />
          <Row label="Branch Name" value={DEMO_PROFILE.branch} />
          <Row label="Account Type" value={DEMO_PROFILE.accountType} />
          <Row label="Account Status" value={DEMO_PROFILE.accountStatus} accent="text-success" />
          <Row label="Mobile Number" value={DEMO_PROFILE.mobile} />
          <Row label="Email Address" value={DEMO_PROFILE.email} />
          <Row label="PAN Number" value={DEMO_PROFILE.pan} mono />
          <Row label="KYC Status" value={DEMO_PROFILE.kycStatus} accent="text-success" />
          <Row label="Nominee" value="Registered" accent="text-success" />
          <Row label="Address" value={`${DEMO_PROFILE.address}, ${DEMO_PROFILE.city} ${DEMO_PROFILE.pinCode}`} />
        </Grid>
      </Card>

      {/* Balance summary */}
      <Card title="Balance Summary">
        <Grid>
          <Row label="Available Balance" value={formatINR(availableBalance)} accent="text-success" />
          <Row label="Ledger Balance" value={formatINR(availableBalance)} />
          <Row label="Monthly Credits" value={formatINR(monthlyCredit)} accent="text-success" />
          <Row label="Monthly Debits" value={formatINR(monthlyDebit)} accent="text-destructive" />
          <Row label="Transaction Count" value={String((computed?.items ?? []).length)} />
          <Row label="Hold Amount" value={formatINR(holdAmount ?? 0)} onEdit={openHoldDialog} />
        </Grid>
      </Card>

      {/* Quick actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction to="/statements" icon={FileText} label="Download Statement" />
          <QuickAction to="/transfer" icon={ArrowLeftRight} label="Fund Transfer" />
          <QuickAction to="/beneficiaries" icon={Users} label="Manage Beneficiary" />
          <QuickAction to="/limits" icon={Gauge} label="View Limits" />
        </div>
      </Card>

      {/* Limits Summary */}
      <Card title="Account Limit Summary" right={<Link to="/limits" className="text-xs font-semibold text-primary">View limits →</Link>}>
        <div className="flex items-start gap-3 text-sm">
          <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            Overall daily transfer limit is <strong className="text-foreground">₹50,00,000</strong>.
            Per-mode IMPS / NEFT / RTGS / UPI usage updates in real-time on each debit.
          </p>
        </div>
      </Card>

      {/* Hold Amount edit dialog (demo display configuration) */}
      <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Hold Amount</DialogTitle>
            <DialogDescription>
              Update the hold amount shown in Balance Summary. Display setting only — it does not change your account balance or transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="hold-amount-input">Hold Amount (₹)</Label>
            <Input
              id="hold-amount-input"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={holdInput}
              onChange={(e) => setHoldInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submitHold(); }}
              placeholder="0.00"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Only non-negative amounts are allowed.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHoldOpen(false)} disabled={holdSaving}>Cancel</Button>
            <Button onClick={() => void submitHold()} disabled={holdSaving}>
              {holdSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isThisMonth(iso: string) {
  const d = new Date(iso); const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof FileText; label: string }) {
  return (
    <Link to={to as never} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-center">
      <Icon className="w-6 h-6 text-primary" />
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </Link>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-bold text-base">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</dl>;
}
function Row({ label, value, mono, accent, onEdit }: { label: string; value: string; mono?: boolean; accent?: string; onEdit?: () => void }) {
  const dd = `mt-1 font-semibold text-sm break-words ${mono ? "font-mono" : ""} ${accent ?? "text-foreground"}`;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      {onEdit ? (
        <dd>
          <button
            type="button"
            onClick={onEdit}
            title="Edit hold amount"
            className={`flex items-center gap-1.5 font-semibold text-sm break-words rounded-md px-1 -mx-1 py-0.5 -my-0.5 transition-colors hover:bg-primary/10 hover:text-primary ${mono ? "font-mono" : ""} ${accent ?? "text-foreground"}`}
          >
            {value}
            <Pencil className="w-3 h-3 shrink-0 opacity-50" />
          </button>
        </dd>
      ) : (
        <dd className={dd}>{value}</dd>
      )}
    </div>
  );
}
