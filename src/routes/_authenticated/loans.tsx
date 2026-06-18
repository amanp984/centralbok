import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Home, Car, GraduationCap, Briefcase, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { formatINR } from "@/lib/banking";

export const Route = createFileRoute("/_authenticated/loans")({
  head: () => ({ meta: [{ title: "Loans — Central Bank of India" }] }),
  component: LoansPage,
});

const PRODUCTS = [
  { icon: Home, name: "Home Loan", rate: "8.40% p.a.", max: 50000000, tenure: "30 years" },
  { icon: Car, name: "Car Loan", rate: "9.25% p.a.", max: 5000000, tenure: "7 years" },
  { icon: GraduationCap, name: "Education Loan", rate: "9.50% p.a.", max: 2000000, tenure: "15 years" },
  { icon: Briefcase, name: "Personal Loan", rate: "10.99% p.a.", max: 4000000, tenure: "5 years" },
  { icon: Smartphone, name: "Consumer Loan", rate: "12.50% p.a.", max: 500000, tenure: "3 years" },
];

const HISTORY = [
  { id: "LN-2024-001", type: "Home Loan", amount: 3500000, status: "Active", emi: 28450, progress: 22 },
  { id: "LN-2023-118", type: "Personal Loan", amount: 200000, status: "Closed", emi: 0, progress: 100 },
];

function LoansPage() {
  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Eligibility" value={formatINR(2500000)} sub="Pre-approved" />
          <Stat label="Active Loans" value="1" sub="Home Loan" />
          <Stat label="Outstanding EMI" value={formatINR(28450)} sub="Due 5th of every month" />
        </div>

        <Section title="Loan Products">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3"><p.icon className="w-6 h-6" /></div>
                <div className="font-bold">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Up to {formatINR(p.max)} • {p.tenure}</div>
                <div className="text-sm font-semibold text-primary mt-2">Starts at {p.rate}</div>
                <Button size="sm" className="mt-4 w-full" onClick={() => toast.success(`${p.name} application started — we will call you back`)}>Apply now</Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="My Loan Applications">
          <div className="space-y-3">
            {HISTORY.map((h) => (
              <div key={h.id} className="border border-border rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{h.type} <span className="text-xs text-muted-foreground font-normal">• {h.id}</span></div>
                    <div className="text-xs text-muted-foreground">Sanctioned {formatINR(h.amount)} • EMI {formatINR(h.emi)}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${h.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{h.status}</span>
                </div>
                <div className="mt-3"><Progress value={h.progress} /><div className="text-xs text-muted-foreground mt-1">{h.progress}% paid</div></div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Eligibility Criteria">
          <ul className="space-y-2 text-sm">
            {["Indian citizen, age 21–65 years", "Minimum monthly income ₹25,000", "Stable employment of 2+ years", "CIBIL score 700+", "KYC documents (Aadhaar, PAN, address proof)"].map((r) => (
              <li key={r} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success mt-0.5" /> {r}</li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-6">
      <h2 className="font-bold mb-4 flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" /> {title}</h2>
      {children}
    </section>
  );
}
