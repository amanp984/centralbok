import { createFileRoute } from "@tanstack/react-router";
import { PolicyShell, Section, Disclaimer } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Central Bank of India" },
      {
        name: "description",
        content:
          "The legal terms governing your use of Central Bank of India's Internet Banking portal — eligibility, credentials, transactions, charges, liability and dispute resolution.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PolicyShell
      title="Terms & Conditions"
      intro="Please read these terms carefully before using the Central Bank of India Internet Banking portal."
    >
      <Section title="1. Acceptance of Terms">
        These Terms &amp; Conditions (“Terms”) constitute a binding legal agreement between you
        (“Customer”, “User”, “you”) and Central Bank of India (“the Bank”, “we”, “us”) governing your
        access to and use of the Bank’s Internet Banking portal, mobile applications, UPI handles and
        any associated digital channels (collectively, the “Services”). By logging in, initiating a
        transaction, or otherwise using the Services you confirm that you have read, understood and
        accepted these Terms in full, together with the Privacy Policy, the schedule of charges and
        any product-specific terms applicable to the accounts, deposits, loans, cards or investments
        you hold with the Bank. If you do not agree with any part of these Terms, you must discontinue
        use of the Services immediately.
      </Section>

      <Section title="2. Eligibility">
        Internet Banking access is available to individual resident and non-resident customers aged
        18 years or above who maintain at least one operative account with the Bank, have completed
        Know-Your-Customer (KYC) verification under RBI Master Directions, and have been issued
        Internet Banking credentials through an authorised channel. Joint accounts are enabled for
        view-only access by default; transaction rights require an explicit mandate signed by all
        holders. Accounts of minors, illiterate customers, customers under guardianship and certain
        restricted account categories may have limited or no Internet Banking access.
      </Section>

      <Section title="3. Customer Credentials and Security Obligations">
        You are solely responsible for the safekeeping and confidentiality of your Customer
        Identification File (CIF) number, User ID, login password, transaction password, MPIN,
        One-Time Passwords (OTP), debit-card PIN and any biometric tokens registered with the Bank.
        You agree to:
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>change your initial password immediately upon first login and at regular intervals thereafter;</li>
          <li>never write down, share, store in plaintext or transmit credentials to any third party, including persons claiming to be Bank staff, regulators or law-enforcement officials;</li>
          <li>never enter credentials on links received over SMS, email, WhatsApp, social media or any platform other than the Bank’s official URL;</li>
          <li>log out at the end of every session and avoid using public or shared computers;</li>
          <li>install and maintain reputable anti-malware software on devices used to access the Services.</li>
        </ul>
        The Bank shall never call, email or text you to ask for full passwords, OTPs, card PINs or
        CVV. Any such request is fraudulent and must be reported immediately.
      </Section>

      <Section title="4. Transactions, Limits and Cut-Off Timings">
        All payments initiated through the Services are subject to the daily and per-transaction
        limits notified by the Bank for each channel and payment mode (UPI, IMPS, NEFT, RTGS, internal
        transfer). The Bank may revise these limits, introduce additional verification steps, or
        decline a transaction in its sole discretion for reasons including suspected fraud, sanctions
        compliance, insufficient balance, technical failure, or non-compliance with RBI guidelines.
        NEFT and RTGS are settled within published settlement windows; instructions submitted outside
        cut-off timings are processed in the next available cycle. UPI and IMPS are available 24x7
        but may be subject to brief maintenance windows. You agree to verify the beneficiary name,
        account number and IFSC before confirming any transaction — once a payment is processed by
        the destination bank, recovery is not guaranteed and depends on the cooperation of the
        beneficiary and the receiving bank.
      </Section>

      <Section title="5. Beneficiary Management">
        You may add, modify, activate or remove beneficiaries through the Internet Banking portal,
        subject to a maximum number permitted per channel. Beneficiary additions may be subject to a
        cooling-off period and per-day caps as prescribed by the Bank. The Bank does not independently
        verify beneficiary names against account numbers — the responsibility for accuracy of
        beneficiary information rests entirely with you.
      </Section>

      <Section title="6. Standing Instructions and e-Mandates">
        Standing instructions, NACH mandates, UPI AutoPay and similar recurring authorisations remain
        in force until you cancel them through the appropriate channel or until expiry, whichever is
        earlier. The Bank will execute eligible debits on the scheduled date provided sufficient funds
        are available; failed instructions may attract return charges as per the schedule of charges.
      </Section>

      <Section title="7. Charges and Fees">
        Service charges, transaction fees, taxes (GST), and incidental costs applicable to the
        Services are listed in the Bank’s published Schedule of Charges, which forms part of these
        Terms. The Bank reserves the right to revise charges from time to time with prior notice
        through this portal, registered email/SMS, or the public website. Charges are debited from
        your account automatically and reflected in the transaction history.
      </Section>

      <Section title="8. Customer Liability for Unauthorised Transactions">
        Customer liability for unauthorised electronic banking transactions is determined in
        accordance with the RBI Circular on “Customer Protection — Limiting Liability of Customers in
        Unauthorised Electronic Banking Transactions” dated 6 July 2017 and subsequent amendments.
        Your liability depends on whether the loss arose from (a) the Bank’s contributory fraud or
        negligence, (b) third-party breach without fault of you or the Bank, or (c) your own
        negligence such as sharing credentials. Prompt notification — ideally within three working
        days — significantly reduces or eliminates your liability. Always report unauthorised activity
        immediately by calling the toll-free helpline, sending an SMS to the registered short-code,
        or using the in-app “Report Fraud” option.
      </Section>

      <Section title="9. Service Availability and Maintenance">
        The Bank endeavours to provide uninterrupted access to the Services on a 24x7 basis, but does
        not warrant continuous availability. The Services may be temporarily suspended for scheduled
        maintenance, upgrades, security incidents, regulatory directions, or events of force majeure
        including natural disasters, telecommunication failures, civil disturbance, strikes,
        cyber-attacks or actions of governmental authority. The Bank shall not be liable for any loss
        or inconvenience arising from such interruptions.
      </Section>

      <Section title="10. Intellectual Property">
        All content on this portal — including text, graphics, the Central Bank of India name and
        logo, software code, layouts and underlying technology — is the property of the Bank or its
        licensors and is protected under applicable copyright, trademark and other intellectual-
        property laws. You may not reproduce, distribute, scrape, reverse-engineer, or create
        derivative works from any portion of the portal without prior written permission.
      </Section>

      <Section title="11. Acceptable Use">
        You agree not to use the Services for any unlawful purpose, including money laundering,
        terror financing, tax evasion, dealing with sanctioned persons or entities, or any
        transaction prohibited under the Foreign Exchange Management Act 1999, PMLA 2002 or the
        Unlawful Activities (Prevention) Act 1967. You shall not attempt to gain unauthorised access
        to any account, system, network or data, nor introduce any malicious code into the portal.
      </Section>

      <Section title="12. Suspension and Termination">
        The Bank may suspend, restrict or terminate your access to the Services, with or without
        notice, in the event of (a) breach of these Terms; (b) suspected fraud, money laundering or
        sanctions exposure; (c) regulatory or court direction; (d) prolonged inactivity; or (e)
        closure of the underlying account. You may discontinue Internet Banking at any time by
        submitting a written request at your home branch.
      </Section>

      <Section title="13. Indemnity">
        You agree to indemnify and hold harmless the Bank, its directors, officers, employees and
        agents from and against any claim, loss, damage, cost or expense (including reasonable legal
        fees) arising out of your breach of these Terms, your negligence, your misuse of the Services,
        or your violation of any law or third-party right.
      </Section>

      <Section title="14. Limitation of Liability">
        To the maximum extent permitted by law, the Bank shall not be liable for any indirect,
        incidental, special, consequential, punitive or exemplary damages — including loss of
        profits, goodwill, data or business opportunity — arising from the use of, or inability to
        use, the Services. Direct liability, where established, is limited to the amount of the
        disputed transaction.
      </Section>

      <Section title="15. Governing Law and Jurisdiction">
        These Terms are governed by and construed in accordance with the laws of India. All disputes
        arising out of or in connection with the Services shall be subject to the exclusive
        jurisdiction of the competent courts at Mumbai, Maharashtra, without prejudice to the Bank’s
        right to initiate proceedings before any other court of competent jurisdiction.
      </Section>

      <Section title="16. Dispute Resolution and Ombudsman">
        Customer grievances should first be raised with the home branch or through the digital
        complaint form available on this portal. Unresolved complaints may be escalated to the
        Banking Ombudsman appointed under the Reserve Bank — Integrated Ombudsman Scheme, 2021.
        Details of the escalation matrix and Ombudsman contact information are available on the
        Bank’s public website.
      </Section>

      <Section title="17. Amendments">
        The Bank may amend these Terms from time to time. Material changes will be notified through
        the portal and/or your registered communication channels. Continued use of the Services after
        the effective date of any amendment constitutes acceptance of the revised Terms.
      </Section>

      <Disclaimer />
    </PolicyShell>
  );
}
