import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/deposits")({
  head: () => ({ meta: [{ title: "Deposits — Central Bank of India" }] }),
  component: () => <StubPage title="Deposits" description="Open and manage Fixed Deposits and Recurring Deposits with competitive interest rates." />,
});
