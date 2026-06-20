import { createFileRoute } from "@tanstack/react-router";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/deposits")({
  head: () => ({ meta: [{ title: "Fixed Deposits — Central Bank of India" }] }),
  component: DepositsPage,
});

const RATE_CARD = [
  { tenure: "7–45 days", general: "3.50%", senior: "4.00%" },
  { tenure: "46–179 days", general: "4.50%", senior: "5.00%" },
  { tenure: "180 days – 1 year", general: "6.00%", senior: "6.50%" },
  { tenure: "1–2 years", general: "6.85%", senior: "7.35%" },
  { tenure: "2–5 years", general: "7.25%", senior: "7.75%" },
  { tenure: "5+ years", general: "6.75%", senior: "7.25%" },
];

function DepositsPage() {
  return (
    <div className="space-y-6">
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <h2 className="font-bold">My Deposits</h2>
          <Button onClick={() => toast.success("Open FD request received")}><Plus className="w-4 h-4 mr-1" /> Open new FD</Button>
        </div>
        <EmptyState
          icon={PiggyBank}
          title="No active deposits found"
          desc="You don't have any active Fixed Deposits or Recurring Deposits yet. Open a new FD to start earning interest."
        />
      </section>

      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
        <h2 className="font-bold mb-4">Current Interest Rates</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead className="bg-primary text-primary-foreground">
              <tr><th className="text-left p-3">Tenure</th><th className="text-left p-3">General</th><th className="text-left p-3">Senior</th></tr>
            </thead>
            <tbody>
              {RATE_CARD.map((r, i) => (
                <tr key={r.tenure} className={i % 2 ? "bg-secondary" : ""}>
                  <td className="p-3">{r.tenure}</td>
                  <td className="p-3 font-semibold">{r.general}</td>
                  <td className="p-3 font-semibold text-success">{r.senior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: typeof PiggyBank; title: string; desc: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
        <Icon className="w-7 h-7" />
      </div>
      <div className="mt-4 font-semibold text-foreground">{title}</div>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{desc}</p>
    </div>
  );
}
