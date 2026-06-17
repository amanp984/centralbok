import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Central Bank of India" }] }),
  component: () => <StubPage title="Accounts" description="View all your savings, current and salary accounts with balances and quick actions." />,
});
