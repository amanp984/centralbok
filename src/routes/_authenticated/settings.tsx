import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Central Bank of India" }] }),
  component: () => <StubPage title="Settings" description="Update your profile, change password, configure notifications and security preferences." />,
});
