import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatINR } from "@/lib/banking";

export const Route = createFileRoute("/_authenticated/investments")({
  head: () => ({ meta: [{ title: "Investments — Central Bank of India" }] }),
  component: InvestmentsPage,
});

const HOLDINGS = [
  { name: "Mutual Funds", value: 425000, gain: 12.4, color: "#0B4DA2" },
  { name: "Equity", value: 318500, gain: 18.7, color: "#16A34A" },
  { name: "Gold ETF", value: 89200, gain: 7.3, color: "#F59E0B" },
  { name: "Bonds", value: 215000, gain: 6.1, color: "#7C3AED" },
  { name: "NPS", value: 142000, gain: 9.8, color: "#06B6D4" },
];
const FUNDS = [
  { name: "CBI Bluechip Equity Fund", nav: 124.56, change: 1.24, holding: 180000 },
  { name: "CBI Balanced Advantage Fund", nav: 38.92, change: -0.45, holding: 145000 },
  { name: "CBI Gilt Long Term Fund", nav: 22.14, change: 0.18, holding: 100000 },
];

function InvestmentsPage() {
  const total = HOLDINGS.reduce((s, h) => s + h.value, 0);
  const avgGain = HOLDINGS.reduce((s, h) => s + h.gain * h.value, 0) / total;

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Portfolio Value" value={formatINR(total)} icon={Briefcase} />
          <Stat label="Total Returns" value={formatINR(total * (avgGain/100))} icon={TrendingUp} accent="text-success" />
          <Stat label="Avg Return" value={`${avgGain.toFixed(2)}%`} icon={TrendingUp} accent="text-success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
            <h2 className="font-bold mb-4">Asset Allocation</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={HOLDINGS} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.name}`}>
                  {HOLDINGS.map((h, i) => <Cell key={i} fill={h.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatINR(v)} />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
            <h2 className="font-bold mb-4">Categories</h2>
            <div className="space-y-3">
              {HOLDINGS.map((h) => (
                <div key={h.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: h.color }} />
                    <div>
                      <div className="font-semibold">{h.name}</div>
                      <div className="text-xs text-muted-foreground">{formatINR(h.value)}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold flex items-center gap-1 ${h.gain >= 0 ? "text-success" : "text-destructive"}`}>
                    {h.gain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />} {h.gain.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">My Mutual Funds</h2>
            <Button onClick={() => toast.success("Start SIP request received")}><Plus className="w-4 h-4 mr-1" /> Start SIP</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr><th className="text-left p-3">Fund</th><th className="text-left p-3">NAV</th><th className="text-left p-3">Day Change</th><th className="text-left p-3">Holding</th></tr>
              </thead>
              <tbody>
                {FUNDS.map((f, i) => (
                  <tr key={f.name} className={i % 2 ? "bg-secondary" : ""}>
                    <td className="p-3 font-semibold">{f.name}</td>
                    <td className="p-3">₹{f.nav.toFixed(2)}</td>
                    <td className={`p-3 font-semibold ${f.change >= 0 ? "text-success" : "text-destructive"}`}>{f.change >= 0 ? "+" : ""}{f.change.toFixed(2)}%</td>
                    <td className="p-3">{formatINR(f.holding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof Briefcase; accent?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between"><div className="text-xs text-muted-foreground uppercase">{label}</div><Icon className="w-4 h-4 text-muted-foreground" /></div>
      <div className={`text-2xl font-bold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
