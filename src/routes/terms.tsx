import { createFileRoute } from "@tanstack/react-router";
import { PolicyShell, Section, Disclaimer } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Central Bank of India" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PolicyShell title="Terms & Conditions" intro="Please read these terms carefully before using our Internet Banking portal.">
      <Section title="1. Acceptance">
        By accessing or using this Internet Banking portal you agree to be bound by these
        Terms &amp; Conditions and all applicable laws and regulations. If you do not agree,
        please discontinue use immediately.
      </Section>
      <Section title="2. Eligibility">
        Internet Banking is available to account holders aged 18 years and above who have
        completed KYC verification and have been issued valid login credentials.
      </Section>
      <Section title="3. Credentials & Security">
        You are solely responsible for the confidentiality of your CIF/User ID, password and
        OTPs. Never share these with anyone. The bank will never ask for your full password,
        OTP, or card PIN over phone, email or SMS.
      </Section>
      <Section title="4. Transactions">
        All transactions are subject to applicable RBI rules, daily/per-transaction limits and
        cut-off timings. The bank may decline or reverse transactions suspected of fraud,
        money laundering or sanctions breaches.
      </Section>
      <Section title="5. Charges">
        Standard service charges apply for NEFT/RTGS/IMPS and value-added services as per the
        published schedule of charges, which may be revised from time to time with notice.
      </Section>
      <Section title="6. Liability">
        Liability for unauthorised transactions shall be determined as per RBI's Customer
        Protection Framework. Prompt reporting of any unauthorised activity is mandatory.
      </Section>
      <Section title="7. Service Availability">
        While we strive for 24x7 availability, the portal may be temporarily unavailable for
        scheduled maintenance, upgrades, or events beyond our reasonable control.
      </Section>
      <Section title="8. Governing Law">
        These terms are governed by the laws of India. All disputes shall be subject to the
        exclusive jurisdiction of competent courts in Mumbai, Maharashtra.
      </Section>
      <Section title="9. Termination">
        We reserve the right to suspend or terminate Internet Banking access for breach of
        these terms, regulatory direction or risk-based reasons.
      </Section>
      <Disclaimer />
    </PolicyShell>
  );
}
