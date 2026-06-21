import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, RefreshCw, Volume2, ShieldCheck, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DEMO_USERNAME,
  DEMO_PASSWORD,
  isLocallyAuthenticated,
  setLocallyAuthenticated,
} from "@/lib/demo-user";
import { isOtpVerified, setOtpVerified } from "@/lib/otp-pool";
import { BrandLoader } from "@/components/BrandLoader";
import cbiOfficialLogo from "@/assets/cbi-logo-new.png.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login — Central Bank of India Online Banking" },
      { name: "description", content: "Login to your Central Bank of India personal internet banking account securely." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [captchaInput, setCaptchaInput] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLocallyAuthenticated() && isOtpVerified()) {
      navigate({ to: "/dashboard", replace: true });
    } else if (isLocallyAuthenticated()) {
      navigate({ to: "/otp", replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.trim() !== captcha) {
      toast.error("Captcha doesn't match. Please try again.");
      setCaptcha(Math.floor(100000 + Math.random() * 900000).toString());
      setCaptchaInput("");
      return;
    }
    if (username.trim() === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setLoading(true);
      setLocallyAuthenticated(true);
      setOtpVerified(false);
      setTimeout(() => navigate({ to: "/otp", replace: true }), 1500);
    } else {
      toast.error("Invalid username or password");
      setCaptcha(Math.floor(100000 + Math.random() * 900000).toString());
      setCaptchaInput("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img
                src={cbiOfficialLogo.url}
                alt="Central Bank of India"
                className="h-15 sm:h-[4.375rem] w-auto object-contain"
              />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-[10px] text-white/80 uppercase tracking-wider">{"\n"}</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#" className="hover:text-white/80">Contact Us</a>
            <span className="text-white/30">|</span>
            <a href="#" className="hover:text-white/80">Calculator</a>
            <span className="text-white/30">|</span>
            <a href="#" className="hover:text-white/80">Help</a>
            <span className="text-white/30">|</span>
            <a href="#" className="hover:text-white/80">More</a>
            <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-md">
              English <ChevronDown className="w-4 h-4" />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1" style={{ background: "linear-gradient(135deg, #0b4da2 0%, #134a93 50%, #1c64c4 100%)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 items-start">
          <div className="text-white">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Welcome to<br />Online Banking!</h1>
            <p className="mt-6 text-white/85 text-base sm:text-lg max-w-xl leading-relaxed">
              Explore our One Stop Banking Solution – your secure, user-friendly gateway to effortless banking, anytime, anywhere, and experience the seamless journey.
            </p>
            <div className="mt-16 max-w-xl">
              <h2 className="text-lg font-semibold">Security Tips to avoid Phishing Attacks</h2>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                Always visit our Internet Banking Site directly through the website or through the link provided in our official website Central Bank of India.
              </p>
              <p className="mt-3 text-sm text-white/80">Keep your user id and password information safe and secure.</p>
            </div>
          </div>

          <div className="lg:justify-self-end w-full max-w-md">
            <div className="bg-secondary rounded-2xl shadow-2xl p-8">
              <h2 className="text-xl font-semibold text-foreground text-center">Login to Personal Banking</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-6 text-center">VERSION: V1.3.27</p>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Username <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                    className="w-full px-4 py-3 rounded-lg border border-primary bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-primary bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Captcha</label>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2.5 bg-white border border-border rounded font-mono font-bold tracking-widest text-foreground">{captcha}</div>
                      <button type="button" className="text-primary hover:text-primary/80" aria-label="Audio captcha">
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <button type="button" onClick={() => setCaptcha(Math.floor(100000 + Math.random() * 900000).toString())} className="text-primary hover:text-primary/80" aria-label="Refresh captcha">
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Enter Captcha</label>
                    <input
                      type="text" required value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Type captcha"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button type="submit" disabled={loading} className="px-10 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60">
                    {loading ? "Please wait…" : "Login"}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground bg-white/60 border border-border rounded-md p-3 text-center">
                  Demo credentials — username: <strong>demo123</strong> · password: <strong>demo123</strong>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span className="font-medium">Secure SSL Connection</span>
          </div>
          <a href="#" className="text-foreground hover:text-primary">Privacy Policy</a>
          <span className="text-border">|</span>
          <a href="#" className="text-foreground hover:text-primary">Terms &amp; Conditions</a>
          <span className="text-border">|</span>
          <a href="#" className="text-foreground hover:text-primary">Disclaimer</a>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" /> © 2026 Central Bank of India
          </div>
        </div>
      </footer>

      {loading && <BrandLoader message="Securing your session…" />}
    </div>
  );
}
