import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/transfer")({
  head: () => ({ meta: [{ title: "Fund Transfer — Central Bank of India" }] }),
  component: () => <StubPage title="Fund Transfer" description="Send money instantly using UPI, IMPS, NEFT or RTGS to any bank account." />,
});
