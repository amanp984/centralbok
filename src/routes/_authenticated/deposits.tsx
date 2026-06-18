import { createFileRoute } from "@tanstack/react-router";
import { PiggyBank, Calendar, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/banking";

export const Route = createFileRoute("/_authenticated/deposits")({
  head: () => ({ meta: [{ title: "Fixed Deposits — Central Bank of India" }] }),
  component: DepositsPage,
});

const DEPOSITS = [
  { id: "FD-2025-001", amount: 250000, rate: 7.25, tenure: "24 months", startDate: "2025-03-15", maturityDate: "2027-03-15", maturityAmount: 287843, status: "Active" },
  { id: "FD-2024-019", amount: 100000, rate: 6.85, tenure: "12 months", startDate: "2024-08-01", maturityDate: "2025-08-01", maturityAmount: 106850, status: "Matured" },
  { id: "RD-2025-007", amount: 5000, rate: 6.50, tenure: "36 months (RD)", startDate: "2025-01-10", maturityDate: "2028-01-10", maturityAmount: 198765, status: "Active" },
];

const RATE_CARD = [
  { tenure: "7–45 days", general: "3.50%", senior: "4.00%" },
  { tenure: "46–179 days", general: "4.50%", senior: "5.00%" },
  { tenure: "180 days – 1 year", general: "6.00%", senior: "6.50%" },
  { tenure: "1–2 years", general: "6.85%", senior: "7.35%" },
  { tenure: "2–5 years", general: "7.25%", senior: "7.75%" },
  { tenure: "5+ years", general: "6.75%", senior: "7.25%" },
];

function DepositsPage() {
  const total = DEPOSITS.filter((d) => d.status === "Active").reduce((s, d) => s + d.amount, 0);
  const maturityValue = DEPOSITS.filter((d) => d.status === "Active").reduce((s, d) => s + d.maturityAmount, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Active Deposits" value={String(DEPOSITS.filter((d) => d.status === "Active").length)} icon={PiggyBank} />
          <Stat label="Principal Invested" value={formatINR(total)} icon={TrendingUp} />
          <Stat label="Maturity Value" value={formatINR(maturityValue)} icon={Calendar} accent="text-success" />
        </div>

        <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">My Deposits</h2>
            <Button onClick={() => toast.success("Open FD request received")}><Plus className="w-4 h-4 mr-1" /> Open new FD</Button>
          </div>
          <div className="space-y-3">
            {DEPOSITS.map((d) => (
              <div key={d.id} className="border border-border rounded-xl p-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="font-semibold">{d.id} <span className="text-xs text-muted-foreground font-normal">• {d.tenure}</span></div>
                    <div className="text-xs text-muted-foreground mt-1">Started {formatDate(d.startDate)} • Matures {formatDate(d.maturityDate)}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${d.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{d.status}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                  <Cell label="Principal" value={formatINR(d.amount)} />
                  <Cell label="Rate" value={`${d.rate}% p.a.`} />
                  <Cell label="Maturity Amount" value={formatINR(d.maturityAmount)} accent="text-success" />
                  <Cell label="Interest Earned" value={formatINR(d.maturityAmount - d.amount)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
          <h2 className="font-bold mb-4">Current Interest Rates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr><th className="text-left p-3">Tenure</th><th className="text-left p-3">General Public</th><th className="text-left p-3">Senior Citizen</th></tr>
              </thead>
              <tbody>
                {RATE_CARD.map((r, i) => (
                  <tr key={r.tenure} className={i % 2 ? "bg-secondary" : ""}>
                    <td className="p-3">{r.tenure}</td><td className="p-3 font-semibold">{r.general}</td><td className="p-3 font-semibold text-success">{r.senior}</td>
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

function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof PiggyBank; accent?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between"><div className="text-xs text-muted-foreground uppercase">{label}</div><Icon className="w-4 h-4 text-muted-foreground" /></div>
      <div className={`text-2xl font-bold mt-1 ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}
function Cell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className={`font-semibold ${accent ?? ""}`}>{value}</div></div>;
}
