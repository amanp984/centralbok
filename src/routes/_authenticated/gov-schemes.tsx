import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/gov-schemes")({
  head: () => ({ meta: [{ title: "Government Schemes — Central Bank of India" }] }),
  component: () => <StubPage title="Government Schemes" description="Enroll in PMJDY, PMSBY, PMJJBY, APY and other government-backed schemes." />,
});
