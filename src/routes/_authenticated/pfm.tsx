import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/banking";
import type { Transaction } from "@/hooks/use-banking-data";

export const Route = createFileRoute("/_authenticated/pfm")({
  head: () => ({ meta: [{ title: "PFM — Central Bank of India" }] }),
  component: PFMPage,
});

const COLORS = ["#0B4DA2", "#16A34A", "#F59E0B", "#DC2626", "#7C3AED", "#06B6D4", "#EC4899", "#65A30D"];

function PFMPage() {
  const { user } = useAuth();

  const { data: txs, isLoading } = useQuery({
    queryKey: ["pfm-tx", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const since = new Date(); since.setMonth(since.getMonth() - 6);
      const { data, error } = await supabase.from("transactions").select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });

  const stats = useMemo(() => {
    const data = txs ?? [];
    const byMonth = new Map<string, { month: string; credits: number; debits: number }>();
    const byCategory = new Map<string, number>();
    let totalCredits = 0, totalDebits = 0;

    for (const t of data) {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const m = byMonth.get(key) ?? { month: label, credits: 0, debits: 0 };
      if (t.direction === "credit") { m.credits += Number(t.amount); totalCredits += Number(t.amount); }
      else { m.debits += Number(t.amount); totalDebits += Number(t.amount); }
      byMonth.set(key, m);

      if (t.direction === "debit") {
        const cat = t.mode || "Other";
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(t.amount));
      }
    }
    const monthly = Array.from(byMonth.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([,v]) => v);
    const categories = Array.from(byCategory.entries()).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);
    return { monthly, categories, totalCredits, totalDebits, net: totalCredits - totalDebits };
  }, [txs]);

  if (isLoading) return <><Skeleton className="h-96 w-full" /></>;

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={TrendingUp} label="Inflow (6m)" value={formatINR(stats.totalCredits)} accent="text-success" />
          <Kpi icon={TrendingDown} label="Outflow (6m)" value={formatINR(stats.totalDebits)} accent="text-destructive" />
          <Kpi icon={Wallet} label="Net Savings" value={formatINR(stats.net)} accent={stats.net >= 0 ? "text-success" : "text-destructive"} />
          <Kpi icon={Target} label="Avg Monthly Spend" value={formatINR((stats.totalDebits / Math.max(stats.monthly.length, 1)) || 0)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Monthly Cash Flow">
            {stats.monthly.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend />
                  <Bar dataKey="credits" fill="#16A34A" name="Credits" />
                  <Bar dataKey="debits" fill="#DC2626" name="Debits" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel title="Spending by Category">
            {stats.categories.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {stats.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel title="Net Cash Flow Trend" className="lg:col-span-2">
            {stats.monthly.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthly.map((m) => ({ ...m, net: m.credits - m.debits }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Line type="monotone" dataKey="net" stroke="#0B4DA2" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        <Panel title="Insights">
          <ul className="space-y-2 text-sm">
            {stats.net >= 0
              ? <li>✓ You're saving {formatINR(stats.net)} over the last 6 months. Keep it up.</li>
              : <li>⚠ You're spending more than you earn. Consider a budget plan.</li>}
            {stats.categories[0] && <li>• Your biggest expense category is <strong>{stats.categories[0].name}</strong> at {formatINR(stats.categories[0].value)}.</li>}
            <li>• Average monthly outflow: {formatINR((stats.totalDebits / Math.max(stats.monthly.length, 1)) || 0)}.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: typeof TrendingUp; label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase">{label}</div>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className={`text-xl font-bold mt-1 ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}
function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5 ${className}`}>
      <h3 className="font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Empty() { return <div className="text-center py-12 text-sm text-muted-foreground">No transaction history yet.</div>; }
