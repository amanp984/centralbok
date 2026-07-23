import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Copy, ArrowLeftRight, FileText, ShieldCheck, Users, Gauge } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useTransactionsWithBalances } from "@/hooks/use-banking-data";
import { Button } from "@/components/ui/button";
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
  const [reveal, setReveal] = useState(false);

  const primary =
    accounts?.find((a) => a.is_primary) ?? accounts?.[0] ?? FALLBACK_ACCOUNT;

  // Use the computed balance from transaction history (same source as Dashboard)
  const availableBalance = computed?.finalBalance ?? 0;

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
          <Row label="Hold Amount" value={formatINR(0)} />
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
function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-semibold text-sm break-words ${mono ? "font-mono" : ""} ${accent ?? "text-foreground"}`}>{value}</dd>
    </div>
  );
}
