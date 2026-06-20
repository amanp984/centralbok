import { createFileRoute } from "@tanstack/react-router";
import { Shield, Heart, Car, Home, Plane, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/insurance")({
  head: () => ({ meta: [{ title: "Insurance — Central Bank of India" }] }),
  component: InsurancePage,
});

const PRODUCTS = [
  { icon: Heart, name: "Term Life", desc: "Pure protection from ₹500/month" },
  { icon: Shield, name: "Health Plan", desc: "Cashless at 10,000+ hospitals" },
  { icon: Home, name: "Home Insurance", desc: "Protect your home & belongings" },
  { icon: Car, name: "Motor Insurance", desc: "Quick claims, 24×7 assistance" },
  { icon: Plane, name: "Travel Insurance", desc: "International & domestic cover" },
];

function InsurancePage() {
  return (
    <div className="space-y-6">
      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <h2 className="font-bold">My Policies</h2>
          <Button onClick={() => toast.success("We'll get in touch shortly")}><Plus className="w-4 h-4 mr-1" /> Get quote</Button>
        </div>
        <div className="py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <div className="mt-4 font-semibold">No active insurance policies found</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You don't have any active policies yet. Browse our products and request a quote to get started.
          </p>
        </div>
      </section>

      <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
        <h2 className="font-bold mb-4">Buy New Policy</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PRODUCTS.map((p) => (
            <button
              key={p.name}
              onClick={() => toast.success(`${p.name} quote requested`)}
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
