import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid, Wallet, ArrowLeftRight, PiggyBank, Landmark, TrendingUp,
  Shield, BarChart3, FileText, Building2, LogOut, Users, Settings, Gauge,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { setLocallyAuthenticated } from "@/lib/demo-user";
import { setOtpVerified } from "@/lib/otp-pool";
import logoAsset from "@/assets/cbi-emblem.png.asset.json";


const navItems = [
  { label: "Dashboard", icon: LayoutGrid, to: "/dashboard" },
  { label: "Accounts", icon: Wallet, to: "/accounts" },
  { label: "Payments & Transfers", icon: ArrowLeftRight, to: "/transfer" },
  { label: "Beneficiaries", icon: Users, to: "/beneficiaries" },
  { label: "Deposits", icon: PiggyBank, to: "/deposits" },
  { label: "Loans", icon: Landmark, to: "/loans" },
  { label: "Investment", icon: TrendingUp, to: "/investments" },
  { label: "Insurance", icon: Shield, to: "/insurance" },
  { label: "PFM", icon: BarChart3, to: "/pfm" },
  { label: "Statements", icon: FileText, to: "/statements" },
  { label: "Government Schemes", icon: Building2, to: "/gov-schemes" },
  { label: "Limits", icon: Gauge, to: "/limits" },
  { label: "Settings", icon: Settings, to: "/settings" },
] as const;


export function AppSidebar({
  open, onClose, fullName,
}: { open: boolean; onClose: () => void; fullName: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await qc.cancelQueries();
    qc.clear();
    setOtpVerified(false);
    setLocallyAuthenticated(false);
    navigate({ to: "/", replace: true });
  };


  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[210px] bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex flex-col items-center text-center">
            <img
              src={logoAsset.url}
              alt="Central Bank of India"
              className="w-[100px] h-[100px] object-contain mb-3 drop-shadow"
            />
            <div className="font-bold text-sm uppercase truncate w-full">{fullName}</div>
            <div className="text-[11px] text-white/70 mt-1">Welcome back</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
    </>
  );
}
