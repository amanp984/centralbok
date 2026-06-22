import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { isLocallyAuthenticated } from "@/lib/demo-user";
import { isOtpVerified } from "@/lib/otp-pool";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!isLocallyAuthenticated()) {
      throw redirect({ to: "/" });
    }
    if (!isOtpVerified()) {
      throw redirect({ to: "/otp" });
    }
  },
  component: AuthenticatedLayout,
});

const ROUTE_META: Record<string, { title: string; description: string; section: string }> = {
  "/dashboard": { title: "Dashboard", description: "Overview of your accounts, balances and recent activity.", section: "Banking" },
  "/accounts": { title: "My Accounts", description: "Full account details, balances and statement summary.", section: "Banking" },
  "/beneficiaries": { title: "Beneficiaries", description: "Manage saved payees for IMPS, NEFT, RTGS and UPI transfers.", section: "Payments" },
  "/transfer": { title: "Fund Transfer", description: "Send money instantly using IMPS, NEFT, RTGS or UPI.", section: "Payments" },
  "/statements": { title: "Statements", description: "Download account statements and transaction history.", section: "Banking" },
  "/pfm": { title: "Personal Finance Management", description: "Track spending, income and savings trends.", section: "Insights" },
  "/loans": { title: "Loans", description: "Active loan accounts, EMIs and eligibility.", section: "Products" },
  "/deposits": { title: "Fixed Deposits", description: "Term deposits, maturity dates and interest earned.", section: "Products" },
  "/investments": { title: "Investments", description: "Mutual funds, bonds and demat holdings.", section: "Products" },
  "/insurance": { title: "Insurance", description: "Life, health and general insurance policies.", section: "Products" },
  "/gov-schemes": { title: "Government Schemes", description: "PMJDY, APY, PMSBY, PMJJBY and other government schemes.", section: "Products" },
  "/limits": { title: "Transaction Limits", description: "Daily and per-transaction limits for all payment modes.", section: "Payments" },
  "/settings": { title: "Settings", description: "Profile, security, KYC and notification preferences.", section: "Account" },
};

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const meta = ROUTE_META[pathname] ?? { title: "Central Bank of India", description: "", section: "Banking" };

  return (
    <AppShell
      title={meta.title}
      description={meta.description}
      section={meta.section}
      routeLoading={isLoading}
    >
      <Outlet />
    </AppShell>
  );
}
