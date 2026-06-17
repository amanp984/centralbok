import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/pfm")({
  head: () => ({ meta: [{ title: "Personal Finance — Central Bank of India" }] }),
  component: () => <StubPage title="Personal Finance Manager" description="Track spending across categories, set budgets and monitor financial goals." />,
});
