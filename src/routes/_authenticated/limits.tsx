import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-banking-data";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/banking";
import { DEMO_LIMITS } from "@/lib/demo-user";
import { Zap, Clock, Building2, Smartphone, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/limits")({
  head: () => ({ meta: [{ title: "Account Limits — Central Bank of India" }] }),
  component: LimitsPage,
});

function LimitsPage() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useTransactions(user?.id, 1000);

  if (isLoading) return <div className="max-w-4xl"><Skeleton className="h-96 w-full" /></div>;

  const used = (mode: string) =>
    (transactions ?? [])
      .filter((t) => t.direction === "debit" && t.mode === mode)
      .reduce((s, t) => s + Number(t.amount), 0);

  const totalUsed = (transactions ?? [])
    .filter((t) => t.direction === "debit")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalRemaining = Math.max(0, DEMO_LIMITS.overall - totalUsed);

  const modes = [
    { key: "IMPS", label: "IMPS", icon: Zap, limit: DEMO_LIMITS.imps, desc: "Instant • 24×7" },
    { key: "NEFT", label: "NEFT", icon: Clock, limit: DEMO_LIMITS.neft, desc: "Within 2 hours" },
    { key: "RTGS", label: "RTGS", icon: Building2, limit: DEMO_LIMITS.rtgs, desc: "Real-time • Min ₹2L" },
    { key: "UPI",  label: "UPI",  icon: Smartphone, limit: DEMO_LIMITS.upi, desc: "Instant • Mobile" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: "var(--gradient-account)" }}>
        <div className="text-xs text-white/75 uppercase tracking-wider">Overall Daily Limit</div>
        <div className="text-3xl font-bold mt-1">{formatINR(DEMO_LIMITS.overall)}</div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/70 text-xs uppercase tracking-wider">Used Today</div>
            <div className="font-semibold">{formatINR(totalUsed)}</div>
          </div>
          <div>
            <div className="text-white/70 text-xs uppercase tracking-wider">Remaining</div>
            <div className="font-semibold">{formatINR(totalRemaining)}</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${Math.min(100, (totalUsed / DEMO_LIMITS.overall) * 100)}%` }} />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((m) => {
          const u = used(m.key);
          const remaining = Math.max(0, m.limit - u);
          const pct = Math.min(100, (u / m.limit) * 100);
          return (
            <div key={m.key} className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <m.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{m.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">Limit</div>
              <div className="text-lg font-bold">{formatINR(m.limit)}</div>
              <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Used</div>
                  <div className="font-semibold">{formatINR(u)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Remaining</div>
                  <div className="font-semibold text-success">{formatINR(remaining)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary rounded-lg p-3">
        <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
        <p>
          Limits update in real-time on every debit transaction. Credits do not consume your daily limit.
          Limit engine is compatible with future SMS / push integration.
        </p>
      </div>
    </div>
  );
}
