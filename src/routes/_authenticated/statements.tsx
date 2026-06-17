import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/statements")({
  head: () => ({ meta: [{ title: "Statements — Central Bank of India" }] }),
  component: () => <StubPage title="Statements" description="View, filter and export account statements as PDF, Excel or CSV." />,
});
