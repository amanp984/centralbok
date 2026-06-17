import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/investments")({
  head: () => ({ meta: [{ title: "Investments — Central Bank of India" }] }),
  component: () => <StubPage title="Investments" description="Grow your wealth with mutual funds, IPOs, NPS and demat services." />,
});
