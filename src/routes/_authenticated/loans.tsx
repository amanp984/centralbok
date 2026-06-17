import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/loans")({
  head: () => ({ meta: [{ title: "Loans — Central Bank of India" }] }),
  component: () => <StubPage title="Loans" description="Apply for personal, home, vehicle or education loans at the best interest rates." />,
});
