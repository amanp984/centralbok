import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, Sprout, GraduationCap, Heart, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/gov-schemes")({
  head: () => ({ meta: [{ title: "Government Schemes — Central Bank of India" }] }),
  component: GovSchemesPage,
});

const SCHEMES = [
  { icon: Users, name: "Pradhan Mantri Jan Dhan Yojana (PMJDY)", category: "Financial Inclusion", desc: "Zero-balance savings account with overdraft, RuPay card, and accident insurance cover.", eligibility: "Any Indian citizen above 10 years of age." },
  { icon: Heart, name: "Pradhan Mantri Jeevan Jyoti Bima Yojana", category: "Insurance", desc: "Life insurance cover of ₹2 lakh at ₹436/year premium.", eligibility: "Age 18–50 with bank account & Aadhaar." },
  { icon: Heart, name: "Pradhan Mantri Suraksha Bima Yojana", category: "Insurance", desc: "Accident insurance cover of ₹2 lakh at ₹20/year premium.", eligibility: "Age 18–70 with bank account." },
  { icon: Sprout, name: "Atal Pension Yojana (APY)", category: "Pension", desc: "Guaranteed pension of ₹1,000–₹5,000/month after age 60.", eligibility: "Age 18–40, Indian citizen with savings account." },
  { icon: Home, name: "Pradhan Mantri Mudra Yojana", category: "MSME Loans", desc: "Loans up to ₹10 lakh for non-corporate, non-farm small/micro enterprises.", eligibility: "Existing or new micro-enterprise owners." },
  { icon: GraduationCap, name: "Sukanya Samriddhi Yojana", category: "Savings", desc: "Long-term savings account for a girl child with 8.2% interest p.a.", eligibility: "Parents/guardian of a girl child below 10 years." },
  { icon: Sprout, name: "Kisan Credit Card (KCC)", category: "Agriculture", desc: "Short-term credit for crop cultivation, post-harvest expenses, and consumption needs.", eligibility: "Farmers (owner-cultivators, tenants, share croppers)." },
  { icon: Home, name: "Stand-Up India", category: "Entrepreneurship", desc: "Bank loans between ₹10 lakh and ₹1 crore for SC/ST and women entrepreneurs.", eligibility: "SC/ST and women entrepreneurs aged 18+." },
];

function GovSchemesPage() {
  return (
    <>
      <div className="space-y-6">
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-4">
            <Building2 className="w-10 h-10 shrink-0" />
            <div>
              <h2 className="text-xl font-bold">Government of India Banking Schemes</h2>
              <p className="text-sm mt-1 text-white/90">Central Bank of India is an authorized partner for all major financial-inclusion schemes. Apply directly from your home branch or through this portal.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCHEMES.map((s) => (
            <div key={s.name} className="bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] p-5 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><s.icon className="w-6 h-6" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary uppercase">{s.category}</div>
                <div className="font-bold mt-1">{s.name}</div>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                <div className="mt-3 p-2 bg-secondary rounded text-xs"><strong>Eligibility:</strong> {s.eligibility}</div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => toast.success(`Application started for ${s.name}`)}>Apply</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Brochure download will start shortly")}>Learn more</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
