import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useTransactions } from "@/hooks/use-banking-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_PROFILE, DEMO_LIMITS } from "@/lib/demo-user";
import { formatINR, formatDate, maskAccount } from "@/lib/banking";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Central Bank of India" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: accounts, isLoading } = useAccounts(user?.id);
  const { data: transactions } = useTransactions(user?.id, 500);

  const primary = accounts?.find((a) => a.is_primary) ?? accounts?.[0];

  if (isLoading) return <div className="max-w-4xl mx-auto"><Skeleton className="h-96 w-full" /></div>;

  const used = (mode: string) =>
    (transactions ?? [])
      .filter((t) => t.direction === "debit" && t.mode === mode)
      .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
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
              <Row label="Opening Date" value={formatDate(DEMO_PROFILE.openingDate)} />
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
    </div>
  );
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
