import { useState, type ReactNode } from "react";
import { Menu, Bell, Search, Power } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/use-auth";
import { useBankingRealtime } from "@/hooks/use-banking-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { user } = useAuth();
  useBankingRealtime(user?.id);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fullName = profile?.full_name ?? user?.email ?? "User";

  return (
    <div className="min-h-screen flex bg-background w-full">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} fullName={fullName} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-border">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-foreground"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-full px-4 py-2 w-64 lg:w-80">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="How can I help you?"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button className="relative p-2 text-muted-foreground hover:text-foreground" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/auth";
                }}
                className="p-2 text-muted-foreground hover:text-destructive"
                aria-label="Sign out"
              >
                <Power className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="border-t border-border bg-white px-6 py-4 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© 2026 Central Bank of India. All rights reserved.</span>
          <span>Secure Banking • SSL Encrypted</span>
        </footer>
      </div>
    </div>
  );
}
