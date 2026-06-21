import { createFileRoute } from "@tanstack/react-router";
import { PolicyShell, Section, Disclaimer } from "./privacy";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({ meta: [{ title: "Disclaimer — Central Bank of India" }] }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <PolicyShell title="Disclaimer" intro="Information published on this portal is provided in good faith for general guidance.">
      <Section title="1. General Information">
        The content on this portal — including product information, interest rates, charges
        and FAQs — is for general informational purposes only and is subject to change without
        notice. Always confirm the latest details with your home branch.
      </Section>
      <Section title="2. No Financial Advice">
        Nothing on this portal constitutes investment, tax or legal advice. You should consult
        a qualified professional before making any financial decision based on information
        viewed here.
      </Section>
      <Section title="3. Third Party Links">
        This portal may contain links to third-party websites. We are not responsible for the
        content, accuracy, or privacy practices of any third-party site and inclusion of a
        link does not imply endorsement.
      </Section>
      <Section title="4. Accuracy of Data">
        While we take reasonable care to ensure information displayed is accurate and current,
        we make no warranty regarding completeness, reliability, or suitability for any
        particular purpose.
      </Section>
      <Section title="5. Liability">
        The bank shall not be liable for any direct, indirect, incidental, consequential or
        punitive damages arising from use of, or inability to use, this portal — including
        loss of profits, data, or business interruption.
      </Section>
      <Section title="6. Security Reminder">
        Always verify the website URL before entering credentials. Report suspicious emails,
        SMS or phone calls claiming to be from the bank to our anti-fraud helpline.
      </Section>
      <Section title="7. Demonstration Notice">
        Account balances, transactions and beneficiaries shown in this portal are simulated
        for demonstration purposes and do not reflect any real customer account.
      </Section>
      <Disclaimer />
    </PolicyShell>
  );
}
