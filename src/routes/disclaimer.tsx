import { createFileRoute } from "@tanstack/react-router";
import { PolicyShell, Section, Disclaimer } from "./privacy";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Central Bank of India" },
      {
        name: "description",
        content:
          "Important notices regarding the information, data, third-party links, security and demonstration nature of the Central Bank of India Internet Banking portal.",
      },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <PolicyShell
      title="Disclaimer"
      intro="Information published on this portal is provided in good faith for general guidance only."
    >
      <Section title="1. General Information">
        The content on this portal — including product descriptions, indicative interest rates,
        schedules of charges, calculators, FAQs and educational articles — is provided for general
        informational purposes only. It is intended to help you understand the Bank’s offerings, not
        as a definitive statement of contractual terms. Actual rates, charges and product features may
        differ based on your customer category, tenure, location, regulatory directives and prevailing
        market conditions. Always confirm the latest applicable terms with your home branch or with
        the Bank’s customer-care helpline before making a financial decision.
      </Section>

      <Section title="2. No Financial, Investment, Tax or Legal Advice">
        Nothing on this portal constitutes investment advice, portfolio recommendation, tax planning
        guidance or legal counsel. Calculators, illustrations, asset-allocation suggestions and
        scenario tools are simplified educational aids and do not account for your personal financial
        circumstances, risk appetite, tax position or regulatory status. You are strongly encouraged
        to consult a SEBI-registered investment adviser, qualified chartered accountant or licensed
        legal practitioner before acting on any information displayed here.
      </Section>

      <Section title="3. Forward-Looking Statements">
        Certain statements on this portal may constitute forward-looking statements concerning the
        Bank’s strategy, growth plans, market outlook or economic projections. Such statements are
        based on assumptions and expectations as of the date of publication and are subject to
        material risks, uncertainties and changes in circumstance. Actual results may differ
        materially. The Bank does not undertake any obligation to update forward-looking statements
        to reflect subsequent events or developments.
      </Section>

      <Section title="4. Third-Party Links and Content">
        This portal may contain hyperlinks to websites, applications or content operated by third
        parties — including payment networks, regulators, partner insurance and mutual-fund houses,
        government portals and informational resources. Such links are provided solely for your
        convenience. The Bank does not control, monitor or endorse the content, accuracy, security,
        availability, privacy practices or terms of use of any third-party site. Your access to and
        use of third-party sites is entirely at your own risk and governed by the terms and policies
        of those sites.
      </Section>

      <Section title="5. Accuracy and Timeliness of Data">
        While the Bank takes reasonable care to ensure that information displayed on this portal is
        accurate and up to date, no warranty — express or implied — is given regarding the
        completeness, reliability, accuracy, timeliness or fitness for any particular purpose of any
        information. Account balances, transaction histories and statements shown in real time are
        indicative; final positions are reconciled at end-of-day by the Bank’s core banking system.
        In case of any discrepancy between the information displayed here and the Bank’s books of
        account, the latter shall prevail.
      </Section>

      <Section title="6. Limitation of Liability">
        To the maximum extent permitted under applicable law, the Bank, its directors, employees,
        agents and service providers shall not be liable for any direct, indirect, incidental,
        special, consequential, exemplary or punitive damages — including without limitation loss of
        profits, business opportunity, anticipated savings, goodwill, data or reputation — arising
        from your use of, reliance upon, or inability to access this portal, even if advised of the
        possibility of such damages.
      </Section>

      <Section title="7. Security Reminders">
        For your safety, please observe the following:
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>always verify that the address bar shows the official Bank URL and a valid HTTPS padlock before entering credentials;</li>
          <li>the Bank will never ask for your full password, OTP, MPIN, card number, CVV or expiry date over phone, SMS, email or social media;</li>
          <li>do not install screen-sharing or remote-access software (AnyDesk, TeamViewer, QuickSupport, etc.) at the request of any caller claiming to be from the Bank or a regulator;</li>
          <li>treat unsolicited offers of refunds, lottery winnings, KYC re-verification, electricity-bill suspension or “bank account block” warnings as fraudulent until independently verified;</li>
          <li>report suspicious calls, emails, SMS or transactions immediately to the Bank’s anti-fraud helpline and to the National Cyber Crime Reporting Portal (cybercrime.gov.in) or the 1930 helpline.</li>
        </ul>
      </Section>

      <Section title="8. Intellectual Property Notice">
        The Central Bank of India name, logo, taglines and the design and code of this portal are
        proprietary to the Bank or its licensors and are protected by copyright, trademark and other
        intellectual-property laws. Unauthorised reproduction, redistribution or commercial use is
        prohibited.
      </Section>

      <Section title="9. Regulatory Information">
        Central Bank of India is a banking company incorporated under the Companies Act and a public-
        sector bank governed by the Banking Regulation Act 1949. It is regulated by the Reserve Bank
        of India. Deposits with the Bank are insured by the Deposit Insurance and Credit Guarantee
        Corporation (DICGC) up to the limit notified from time to time (currently ₹5,00,000 per
        depositor per bank).
      </Section>

      <Section title="10. Demonstration Notice">
        Account numbers, IFSC codes, balances, transactions, beneficiaries, statements and any other
        financial data displayed on this portal are <strong>simulated</strong> for demonstration,
        training and educational purposes only. They do not correspond to any real customer, account
        or transaction. No real money is moved by any action taken on this portal.
      </Section>

      <Disclaimer />
    </PolicyShell>
  );
}
