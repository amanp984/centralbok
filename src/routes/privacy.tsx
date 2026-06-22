import { createFileRoute, Link } from "@tanstack/react-router";
import bannerAsset from "@/assets/cbi-official-logo.png.asset.json";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Central Bank of India" },
      {
        name: "description",
        content:
          "How Central Bank of India collects, uses, stores, shares and protects personal information of customers using its Internet Banking portal.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PolicyShell
      title="Privacy Policy"
      intro="How we collect, use, share, retain and protect your personal information on the Central Bank of India Internet Banking portal."
    >
      <Section title="1. Introduction">
        Central Bank of India (“the Bank”, “we”, “us”, “our”) is committed to safeguarding the privacy of
        every customer who uses its Internet Banking, Mobile Banking, UPI and ancillary digital services.
        This Privacy Policy describes the categories of personal information we collect, the purposes for
        which it is used, the parties with whom it may be shared, the security measures we deploy, the
        retention periods we follow, and the rights available to you under applicable Indian law, including
        the Information Technology Act 2000 (and the SPDI Rules 2011), the Reserve Bank of India (RBI)
        Master Directions on Digital Payment Security Controls, and the Digital Personal Data Protection
        Act, 2023. By accessing this portal you acknowledge that you have read and understood the terms
        of this Policy.
      </Section>

      <Section title="2. Information We Collect">
        We collect personal information that is necessary to establish your identity, evaluate your
        eligibility for banking products, execute your instructions, comply with regulatory obligations
        and protect both you and the Bank from fraud. The categories include:
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li><strong>Identification data</strong> — full name, date of birth, gender, photograph, signature, PAN, Aadhaar (masked), passport, voter ID, driving licence and other KYC documents.</li>
          <li><strong>Contact data</strong> — residential, mailing and communication addresses, registered mobile number, email address and nominee particulars.</li>
          <li><strong>Financial data</strong> — account numbers, IFSC, balances, beneficiary details, transaction amounts, payment instructions, loan and investment holdings, credit-bureau information and tax identifiers.</li>
          <li><strong>Authentication data</strong> — User ID, hashed password, MPIN, OTPs, biometric reference identifiers, security question responses and device-binding tokens.</li>
          <li><strong>Technical and usage data</strong> — IP address, device fingerprint, operating system, browser, geolocation (where permitted), session timestamps, click-paths and error logs collected through cookies and similar technologies.</li>
          <li><strong>Voluntary data</strong> — information you provide in service requests, grievance forms, surveys, video-KYC sessions or correspondence with our branches and call centres.</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        Your information is processed only for specified, lawful and legitimate purposes, including:
        opening and operating your account; executing fund transfers over NEFT, RTGS, IMPS, UPI and
        cards; authenticating you and detecting impersonation; complying with the Prevention of Money
        Laundering Act 2002 (PMLA), Know Your Customer (KYC), Combating Financing of Terrorism (CFT)
        and Foreign Account Tax Compliance Act (FATCA) obligations; reporting Suspicious Transaction
        Reports (STR) and Cash Transaction Reports (CTR) to the Financial Intelligence Unit-India
        (FIU-IND); preventing, detecting and investigating fraud; managing credit and operational risk;
        servicing nominations, mandates and standing instructions; recovering dues; conducting internal
        audits; producing aggregated, anonymised analytics; and improving the user experience of this
        portal. We never sell your personal information to advertisers or unrelated third parties.
      </Section>

      <Section title="4. Legal Bases for Processing">
        Depending on the activity, we rely on one or more of the following legal bases: (a) performance
        of a contract for the banking service you have requested; (b) compliance with statutory and
        regulatory obligations imposed on banks; (c) protection of your or our vital interests, including
        fraud prevention; (d) the Bank’s legitimate interests in operating, maintaining and improving
        the portal; and (e) your specific consent where required, for example for marketing
        communications or sharing data with optional value-added service providers.
      </Section>

      <Section title="5. Sharing of Information">
        Information may be disclosed only to the extent necessary, and to the following categories of
        recipients: regulators and statutory authorities (RBI, SEBI, IRDAI, FIU-IND, income-tax and
        GST authorities, law-enforcement agencies under valid orders); payment-system operators
        (NPCI, card networks, NEFT/RTGS/IMPS rails, SWIFT for cross-border remittances); credit
        information companies (CIBIL, Experian, Equifax, CRIF High Mark); empanelled vendors providing
        printing, courier, hosting, security testing, analytics or customer-support services under
        binding confidentiality and data-processing agreements; nominees and joint holders to the
        extent required by the mandate; and external auditors, advisors and insurers acting under a
        duty of confidentiality. All such disclosures are subject to the “need-to-know” principle and
        appropriate contractual safeguards.
      </Section>

      <Section title="6. Cross-Border Transfers">
        Where data is transferred outside India — for example to correspondent banks handling foreign
        inward or outward remittances, or to cloud sub-processors in jurisdictions notified by the
        Central Government — we ensure that the recipient provides a comparable level of protection
        through standard contractual clauses, encryption in transit, and access controls aligned with
        RBI’s data-localisation directions for payment-system data.
      </Section>

      <Section title="7. Data Security">
        We deploy a defence-in-depth security programme. Sessions are encrypted with industry-standard
        Transport Layer Security (TLS 1.2+); passwords are stored only as salted cryptographic hashes;
        transaction signing relies on time-bound One-Time Passwords delivered to your registered mobile
        and email; suspicious-activity engines monitor every login and payment in real time; access to
        production systems is restricted to authorised personnel using multi-factor authentication and
        privileged-access management. The Bank maintains an information-security management system
        aligned with ISO/IEC 27001 and undergoes periodic VAPT and red-team assessments. Despite our
        best efforts, no Internet transmission is 100% secure; you are responsible for keeping your
        device free of malware and your credentials confidential.
      </Section>

      <Section title="8. Cookies and Similar Technologies">
        We use strictly necessary cookies to maintain your authenticated session, preference cookies
        to remember your display settings, and analytical cookies to understand aggregated usage of
        the portal so we can improve performance and usability. You may disable non-essential cookies
        from your browser settings; doing so will not affect your ability to bank with us, but may
        sign you out of secure sessions or reduce certain conveniences.
      </Section>

      <Section title="9. Retention">
        Personal information is retained only for as long as it is necessary to fulfil the purpose for
        which it was collected or for the period prescribed by law. Transaction records, KYC documents,
        and customer correspondence are typically retained for a minimum of eight to ten years from the
        date of cessation of the customer relationship in accordance with RBI, PMLA and Income-Tax Act
        recordkeeping rules. After the retention period expires, data is securely deleted, anonymised
        or archived in offline encrypted storage.
      </Section>

      <Section title="10. Your Rights">
        Subject to applicable law, you have the right to:
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>request confirmation of, and access to, the personal information we hold about you;</li>
          <li>correct any data that is inaccurate, outdated or incomplete;</li>
          <li>withdraw consent for processing that is based solely on consent (such as marketing);</li>
          <li>nominate a representative to exercise these rights in the event of death or incapacity;</li>
          <li>raise a grievance and, where unresolved, escalate to the RBI Banking Ombudsman or the
              Data Protection Board of India.</li>
        </ul>
        To exercise any of these rights, write to <strong>grievance@centralbankofindia.co.in</strong> from
        your registered email, quoting your CIF.
      </Section>

      <Section title="11. Children's Information">
        Internet Banking accounts are issued to individuals aged 18 years and above. Minor accounts
        operated by guardians are subject to special safeguards: data of minors is processed only as
        necessary to operate the account and is not used for marketing or profiling.
      </Section>

      <Section title="12. Grievance Redressal">
        The Bank has appointed a Grievance Officer and a Nodal Officer for digital-channel complaints.
        Their contact details, along with the escalation matrix culminating with the RBI Integrated
        Ombudsman Scheme 2021, are published on the Bank’s public website. Most disputes are resolved
        within 30 days of receipt of a complete complaint.
      </Section>

      <Section title="13. Changes to this Policy">
        We may update this Privacy Policy from time to time to reflect changes in law, regulation,
        technology or our business practices. Material changes will be communicated through this portal
        and to your registered email or mobile number. The “Last updated” date below indicates when the
        Policy was most recently revised.
      </Section>

      <Disclaimer />
    </PolicyShell>
  );
}

export function PolicyShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
      <header className="bg-gradient-to-r from-[#0B4DA2] via-[#1356b5] to-[#1E63C6] shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="inline-block">
            <img src={bannerAsset.url} alt="Central Bank of India" className="h-10 sm:h-12 w-auto object-contain drop-shadow" />
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
      <div className="text-foreground/90">{children}</div>
    </section>
  );
}

export function Disclaimer() {
  return (
    <div className="mt-10 border-t border-border pt-6">
      <div className="rounded-xl border border-[#0B4DA2]/20 bg-[#EAF2FB] p-5 text-sm leading-relaxed text-[#0B4DA2]">
        <strong>Important Notice:</strong> This website is a demonstration and educational
        project. It is not affiliated with, endorsed by, or operated by any real financial
        institution. No real banking services are provided through this platform and no real
        funds are moved by any action taken here.
      </div>
    </div>
  );
}
