import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/insurance")({
  head: () => ({ meta: [{ title: "Insurance — Central Bank of India" }] }),
  component: () => <StubPage title="Insurance" description="Protect what matters with life, health, vehicle and travel insurance options." />,
});
