import { createFileRoute, Link } from "@tanstack/react-router";
import bannerAsset from "@/assets/cbi-banner.png.asset.json";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Central Bank of India" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <PolicyShell title="Privacy Policy" intro="How we collect, use, and protect your personal information.">
    <Section title="1. Information We Collect">
      We collect personal identification details (name, contact information, KYC documents),
      transaction information (account numbers, amounts, beneficiaries), and technical data
      (IP address, device, browser) when you use our Internet Banking services.
    </Section>
    <Section title="2. How We Use Your Information">
      Your information is used to authenticate access, process transactions, comply with
      regulatory obligations (RBI/KYC/AML), prevent fraud, and improve our banking services.
      We never sell your personal data to third parties.
    </Section>
    <Section title="3. Data Sharing">
      We share information only with regulators, payment networks (NPCI, NEFT/RTGS/IMPS rails),
      and authorised service providers strictly to perform banking operations. All partners
      are bound by confidentiality agreements.
    </Section>
    <Section title="4. Data Security">
      Sessions are protected with TLS encryption, multi-factor OTP authentication, automatic
      session timeouts and continuous fraud monitoring. Passwords are stored as cryptographic
      hashes — never in plaintext.
    </Section>
    <Section title="5. Cookies">
      We use functional cookies to keep you signed in and analytical cookies to improve the
      portal. You can clear cookies from your browser at any time, but doing so may sign
      you out of secure sessions.
    </Section>
    <Section title="6. Your Rights">
      You may request a copy of your personal data, ask us to correct inaccuracies, or
      withdraw marketing consent at any time by writing to grievance@centralbankofindia.co.in.
    </Section>
    <Section title="7. Retention">
      We retain transaction records for the period mandated by RBI guidelines (typically
      8–10 years) and personal data for as long as your relationship with us remains active.
    </Section>
    <Section title="8. Changes to this Policy">
      We may update this Privacy Policy from time to time. Material changes will be
      communicated through this portal and via registered email/SMS.
    </Section>
    <Disclaimer />
  </PolicyShell>;
}

export function PolicyShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      <header className="bg-gradient-to-r from-[#0B4DA2] via-[#1356b5] to-[#1E63C6] shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="bg-white rounded-md p-1 shadow-sm inline-block">
            <img src={bannerAsset.url} alt="Central Bank of India" className="h-10 sm:h-11 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-4 text-white/90 text-sm">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/disclaimer" className="hover:text-white">Disclaimer</Link>
            <Link to="/auth" className="bg-white text-[#0B4DA2] px-3 py-1 rounded-full font-semibold hover:bg-white/90">Login</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-[#0B4DA2]">{title}</h1>
          <p className="mt-2 text-muted-foreground">{intro}</p>
          <p className="mt-1 text-xs text-muted-foreground">Last updated: 21 June 2026</p>
          <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-foreground">
            {children}
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        © 2026 Central Bank of India — Demonstration project.
      </footer>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#0B4DA2] mb-2">{title}</h2>
      <p className="text-foreground/90">{children}</p>
    </section>
  );
}

export function Disclaimer() {
  return (
    <div className="mt-10 border-t border-border pt-6">
      <div className="rounded-xl border border-[#0B4DA2]/20 bg-[#EAF2FB] p-5 text-sm leading-relaxed text-[#0B4DA2]">
        <strong>Important Notice:</strong> This website is a demonstration and educational
        project. It is not affiliated with, endorsed by, or operated by any real financial
        institution. No real banking services are provided through this platform.
      </div>
    </div>
  );
}
