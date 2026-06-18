import { createFileRoute } from "@tanstack/react-router";
import { Shield, Heart, Car, Home, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/banking";

export const Route = createFileRoute("/_authenticated/insurance")({
  head: () => ({ meta: [{ title: "Insurance — Central Bank of India" }] }),
  component: InsurancePage,
});

const POLICIES = [
  { id: "LI-2024-008", type: "Life Insurance", icon: Heart, sumInsured: 5000000, premium: 18500, frequency: "Yearly", renewalDate: "2026-03-15", status: "Active" },
  { id: "HI-2025-012", type: "Health Insurance", icon: Shield, sumInsured: 1000000, premium: 14200, frequency: "Yearly", renewalDate: "2026-08-22", status: "Active" },
  { id: "MV-2024-101", type: "Motor Insurance", icon: Car, sumInsured: 850000, premium: 12480, frequency: "Yearly", renewalDate: "2026-01-10", status: "Active" },
];
const PRODUCTS = [
  { icon: Heart, name: "Term Life", desc: "Pure protection from ₹500/month" },
  { icon: Shield, name: "Health Plan", desc: "Cashless at 10,000+ hospitals" },
  { icon: Home, name: "Home Insurance", desc: "Protect your home & belongings" },
  { icon: Car, name: "Motor Insurance", desc: "Quick claims, 24×7 assistance" },
  { icon: Plane, name: "Travel Insurance", desc: "International & domestic cover" },
];
const CLAIMS = [
  { id: "CLM-78912", policy: "HI-2025-012", date: "2025-11-04", amount: 48500, status: "Settled" },
  { id: "CLM-72340", policy: "MV-2024-101", date: "2025-09-18", amount: 12800, status: "In Review" },
];

function InsurancePage() {
  const totalCover = POLICIES.reduce((s, p) => s + p.sumInsured, 0);
  const totalPremium = POLICIES.reduce((s, p) => s + p.premium, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Active Policies" value={String(POLICIES.length)} />
          <Stat label="Total Cover" value={formatINR(totalCover)} accent="text-primary" />
          <Stat label="Annual Premium" value={formatINR(totalPremium)} />
        </div>

        <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
          <h2 className="font-bold mb-4">My Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {POLICIES.map((p) => (
              <div key={p.id} className="border border-border rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><p.icon className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <div className="font-semibold">{p.type}</div>
                    <div className="text-xs text-muted-foreground">{p.id}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-success/10 text-success">{p.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <Cell label="Sum Insured" value={formatINR(p.sumInsured)} />
                  <Cell label="Premium" value={`${formatINR(p.premium)} / ${p.frequency.toLowerCase()}`} />
                  <Cell label="Renewal" value={formatDate(p.renewalDate)} />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => toast.success("Renewal scheduled")}>Renew</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Claim initiated")}>File Claim</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Buy New Policy</h2>
            <Button onClick={() => toast.success("We'll get in touch shortly")}><Plus className="w-4 h-4 mr-1" /> Get quote</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {PRODUCTS.map((p) => (
              <button key={p.name} onClick={() => toast.success(`${p.name} quote requested`)} className="text-left border border-border rounded-xl p-4 hover:border-primary hover:shadow-md transition-all">
                <p.icon className="w-8 h-8 text-primary mb-2" />
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
          <h2 className="font-bold mb-4">Claims History</h2>
          <table className="w-full text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr><th className="text-left p-3">Claim ID</th><th className="text-left p-3">Policy</th><th className="text-left p-3">Date</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr>
            </thead>
            <tbody>
              {CLAIMS.map((c, i) => (
                <tr key={c.id} className={i % 2 ? "bg-secondary" : ""}>
                  <td className="p-3 font-mono">{c.id}</td>
                  <td className="p-3">{c.policy}</td>
                  <td className="p-3">{formatDate(c.date)}</td>
                  <td className="p-3 font-semibold">{formatINR(c.amount)}</td>
                  <td className="p-3"><span className={`text-xs font-semibold px-2 py-1 rounded ${c.status === "Settled" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
function Cell({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>;
}
