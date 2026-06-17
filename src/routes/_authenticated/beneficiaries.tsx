import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/beneficiaries")({
  head: () => ({ meta: [{ title: "Beneficiaries — Central Bank of India" }] }),
  component: () => <StubPage title="Beneficiaries" description="Manage payees you frequently transfer money to. Up to 12 beneficiaries supported." />,
});
