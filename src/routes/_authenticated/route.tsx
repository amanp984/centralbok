import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { isLocallyAuthenticated } from "@/lib/demo-user";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    if (!isLocallyAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "My Accounts",
  "/beneficiaries": "Beneficiaries",
  "/transfer": "Fund Transfer",
  "/statements": "Statements",
  "/pfm": "Personal Finance Management",
  "/loans": "Loans",
  "/deposits": "Fixed Deposits",
  "/investments": "Investments",
  "/insurance": "Insurance",
  "/gov-schemes": "Government Schemes",
  "/settings": "Settings",
};

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const title = TITLES[pathname] ?? "Central Bank of India";

  return (
    <AppShell title={title} routeLoading={isLoading}>
      <Outlet />
    </AppShell>
  );
}
