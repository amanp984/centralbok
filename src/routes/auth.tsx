import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Central Bank of India" },
      { name: "description", content: "Sign in or create an account to access secure online banking." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success("Account created — you can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm">
            <span className="text-primary font-extrabold text-lg leading-none">CBI</span>
          </div>
          <div className="leading-tight">
            <div className="text-base sm:text-lg font-bold tracking-wide">Central Bank of India</div>
            <div className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wider">Central to You Since 1911</div>
          </div>
          <Link to="/" className="ml-auto text-sm text-white/80 hover:text-white">Back to home</Link>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-12" style={{ background: "linear-gradient(135deg, #0b4da2 0%, #134a93 50%, #1c64c4 100%)" }}>
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-foreground text-center">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6 text-center">Secure Online Banking</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                <input
                  required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <button
              type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="w-full text-sm text-primary hover:underline"
            >
              {mode === "signin" ? "New to Central Bank? Create an account" : "Already have an account? Sign in"}
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-white border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span className="font-medium">Secure SSL Connection</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" /> © 2026 Central Bank of India
          </div>
        </div>
      </footer>
    </div>
  );
}
