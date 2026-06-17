import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Construction } from "lucide-react";
import type { ReactNode } from "react";

type StubConfig = {
  path: string;
  title: string;
  description: string;
};

export function buildStubRoute({ path, title, description }: StubConfig) {
  const route = createFileRoute(path as any)({
    head: () => ({ meta: [{ title: `${title} — Central Bank of India` }, { name: "description", content: description }] }),
    component: () => (
      <AppShell title={title}>
        <StubContent title={title} description={description} />
      </AppShell>
    ),
  });
  return route;
}

export function StubContent({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-10 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {children}
      <p className="mt-6 text-xs text-muted-foreground">
        This module will be expanded in the upcoming phases of the upgrade plan.
      </p>
    </div>
  );
}
