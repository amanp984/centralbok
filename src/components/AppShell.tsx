import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, Bell, Search, Power, ChevronRight, Home } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/use-auth";
import { useBankingRealtime } from "@/hooks/use-banking-data";
  import { setLocallyAuthenticated, DEMO_DISPLAY_NAME } from "@/lib/demo-user";
import { setOtpVerified } from "@/lib/otp-pool";
import { AppLoader } from "./AppLoader";

const MIN_OVERLAY_MS = 700;

export function AppShell({
  title,
  description,
  section,
  children,
  routeLoading = false,
}: {
  title: string;
  description?: string;
  section?: string;
  children: ReactNode;
  routeLoading?: boolean;
}) {
  const { user } = useAuth();
  useBankingRealtime(user?.id);
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fullName = DEMO_DISPLAY_NAME;

  // Show a brief overlay on every route change to mask white flashes.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Show on initial mount too so the dashboard init after login shows the loader.
  const [overlayVisible, setOverlayVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOverlayVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOverlayVisible(false), MIN_OVERLAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Also extend the overlay while the router is actually still loading.
  useEffect(() => {
    if (routeLoading) setOverlayVisible(true);
    else if (!timerRef.current) setOverlayVisible(false);
  }, [routeLoading]);

  const handleSignOut = () => {
    setOtpVerified(false);
    setLocallyAuthenticated(false);
    navigate({ to: "/", replace: true });
  };

  // Auto sign-out after 3 minutes of inactivity.
  useEffect(() => {
    const TIMEOUT_MS = 3 * 60 * 1000;
    let t: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setOtpVerified(false);
        setLocallyAuthenticated(false);
        navigate({ to: "/", replace: true });
      }, TIMEOUT_MS);
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex bg-background w-full">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} fullName={fullName} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-border">
          {/* Route transition indicator */}
          <div
            aria-hidden
            className={`h-0.5 w-full overflow-hidden ${routeLoading ? "opacity-100" : "opacity-0"} transition-opacity`}
          >
            <div className="h-full w-1/3 bg-primary animate-[loadingbar_1.2s_ease-in-out_infinite]" />
          </div>
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
                onClick={handleSignOut}
                className="p-2 text-muted-foreground hover:text-destructive"
                aria-label="Sign out"
              >
                <Power className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-gradient-to-r from-[#F5F8FD] to-white px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-primary">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            {section && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{section}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{title}</span>
          </nav>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl">{description}</p>
          )}
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="border-t border-border bg-white px-6 py-4 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© 2026 Central Bank of India. All rights reserved.</span>
          <span>Secure Banking • SSL Encrypted</span>
        </footer>
      </div>

      <AppLoader variant="overlay" visible={overlayVisible} />
    </div>
  );
}
