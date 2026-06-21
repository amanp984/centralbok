import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Home, Car, GraduationCap, Briefcase, Smartphone, CheckCircle2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatINR } from "@/lib/banking";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/loans")({
  head: () => ({ meta: [{ title: "Loans — Central Bank of India" }] }),
  component: LoansPage,
});

const PRODUCTS = [
  { icon: Briefcase, name: "Personal Loan", rate: "10.99% p.a.", max: 4000000, tenure: "5 years" },
  { icon: Home, name: "Home Loan", rate: "8.40% p.a.", max: 50000000, tenure: "30 years" },
  { icon: Car, name: "Vehicle Loan", rate: "9.25% p.a.", max: 5000000, tenure: "7 years" },
  { icon: GraduationCap, name: "Education Loan", rate: "9.50% p.a.", max: 2000000, tenure: "15 years" },
  { icon: Smartphone, name: "Consumer Loan", rate: "12.50% p.a.", max: 500000, tenure: "3 years" },
];

function LoansPage() {
  return (
    <div className="space-y-6">
      <Section title="My Loans">
        <div className="py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
            <Landmark className="w-7 h-7" />
          </div>
          <div className="mt-4 font-semibold">No active loans found</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You currently have no active loan accounts. Browse our loan products below to get started.
          </p>
        </div>
      </Section>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Loan Eligibility Checker"><EligibilityChecker /></Section>
        <Section title="EMI Calculator"><EmiCalculator /></Section>
      </div>

      <Section title="Eligibility Criteria">
        <ul className="space-y-2 text-sm">
          {["Indian citizen, age 21–65 years", "Minimum monthly income ₹25,000", "Stable employment of 2+ years", "CIBIL score 700+", "KYC documents (Aadhaar, PAN, address proof)"].map((r) => (
            <li key={r} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" /> {r}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function EligibilityChecker() {
  const [income, setIncome] = useState(50000);
  const eligible = Math.round(income * 60);
  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-wider text-muted-foreground">Monthly income (₹)</label>
      <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value) || 0)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <div className="text-xs text-muted-foreground">Indicative eligibility</div>
        <div className="text-2xl font-bold text-primary">{formatINR(eligible)}</div>
      </div>
    </div>
  );
}

function EmiCalculator() {
  const [amount, setAmount] = useState(1000000);
  const [rate, setRate] = useState(9.5);
  const [years, setYears] = useState(5);
  const r = rate / 12 / 100;
  const n = years * 12;
  const emi = r === 0 ? amount / n : (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return (
    <div className="space-y-3 text-sm">
      <Field label="Amount (₹)" value={amount} onChange={setAmount} />
      <Field label="Rate (% p.a.)" value={rate} onChange={setRate} step={0.1} />
      <Field label="Tenure (years)" value={years} onChange={setYears} />
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
        <Calculator className="w-5 h-5 text-primary" />
        <div>
          <div className="text-xs text-muted-foreground">Monthly EMI</div>
          <div className="text-xl font-bold text-primary">{formatINR(Math.round(emi))}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-full border border-border rounded-lg px-3 py-2" />
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
