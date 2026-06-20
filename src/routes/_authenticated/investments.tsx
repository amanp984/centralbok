import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/investments")({
  head: () => ({ meta: [{ title: "Investments — Central Bank of India" }] }),
  component: InvestmentsPage,
});

const PRODUCTS = [
  { name: "Mutual Funds", desc: "SIP from ₹500/month across 1000+ funds", icon: TrendingUp },
  { name: "Equity Trading", desc: "Open a Demat account in minutes", icon: Briefcase },
  { name: "Gold ETF", desc: "Invest in digital gold from ₹100", icon: TrendingUp },
  { name: "NPS", desc: "Build retirement corpus with tax benefits", icon: Briefcase },
];

function InvestmentsPage() {
  return (
    <div className="space-y-6">
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <h2 className="font-bold">My Investments</h2>
          <Button onClick={() => toast.success("Start SIP request received")}><Plus className="w-4 h-4 mr-1" /> Start SIP</Button>
        </div>
        <div className="py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="mt-4 font-semibold">No active investments found</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You don't have any active investments yet. Explore our products to start building your portfolio.
          </p>
        </div>
      </section>

      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
        <h2 className="font-bold mb-4">Explore Investment Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRODUCTS.map((p) => (
            <button
              key={p.name}
              onClick={() => toast.success(`${p.name} request received`)}
              className="text-left border border-border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <p.icon className="w-7 h-7 text-primary mb-2" />
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
