import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Copy, ArrowLeftRight, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts } from "@/hooks/use-banking-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, maskAccount, formatDate } from "@/lib/banking";
import { DEMO_PROFILE } from "@/lib/demo-user";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "My Accounts — Central Bank of India" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { user } = useAuth();
  const { data: accounts, isLoading } = useAccounts(user?.id);
  const [reveal, setReveal] = useState(false);

  const primary = accounts?.find((a) => a.is_primary) ?? accounts?.[0];

  if (isLoading || !primary) {
    return <div className="max-w-5xl"><Skeleton className="h-72 w-full" /></div>;
  }

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
            <div className="w-12 h-12 shrink-0 bg-white rounded flex items-center justify-center">
              <span className="text-primary text-xs font-extrabold">CBI</span>
            </div>
          </div>

          <div className="mt-5 text-sm text-white/80">Available Balance</div>
          <div className="text-3xl font-bold">{formatINR(primary.balance)}</div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/transfer"><Button size="sm" variant="secondary"><ArrowLeftRight className="w-4 h-4 mr-1" />Transfer</Button></Link>
            <Link to="/statements"><Button size="sm" variant="secondary"><FileText className="w-4 h-4 mr-1" />Statement</Button></Link>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <Card title="Account Details">
        <Grid>
          <Row label="Account Type" value={DEMO_PROFILE.accountType} />
          <Row label="Account Number" value={primary.account_number} mono />
          <Row label="Customer Name" value={DEMO_PROFILE.fullName} />
          <Row label="CIF Number" value={DEMO_PROFILE.cif} mono />
          <Row label="Customer ID" value={DEMO_PROFILE.customerId} mono />
          <Row label="IFSC Code" value={DEMO_PROFILE.ifsc} mono />
          <Row label="MICR" value={DEMO_PROFILE.micr} mono />
          <Row label="Branch Name" value={DEMO_PROFILE.branch} />
          <Row label="Mobile Number" value={DEMO_PROFILE.mobile} />
          <Row label="Email Address" value={DEMO_PROFILE.email} />
          <Row label="PAN Number" value={DEMO_PROFILE.pan} mono />
          <Row label="Account Status" value={DEMO_PROFILE.accountStatus} accent="text-success" />
          <Row label="KYC Status" value={DEMO_PROFILE.kycStatus} accent="text-success" />
          <Row label="Opening Date" value={formatDate(DEMO_PROFILE.openingDate)} />
        </Grid>
      </Card>

      {/* Balances */}
      <Card title="Balances">
        <Grid>
          <Row label="Available Balance" value={formatINR(primary.balance)} accent="text-success" />
          <Row label="Ledger Balance" value={formatINR(primary.balance)} />
          <Row label="Unclear Funds" value={formatINR(0)} />
          <Row label="Hold Amount" value={formatINR(0)} />
        </Grid>
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
      <dd className={`mt-1 font-semibold text-sm truncate ${mono ? "font-mono" : ""} ${accent ?? "text-foreground"}`}>{value}</dd>
    </div>
  );
}
