import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutGrid, Wallet, ArrowLeftRight, PiggyBank, Landmark, TrendingUp,
  Shield, BarChart3, FileText, Building2, LogOut, Bell, Search, Power,
  Receipt, Users, Settings, Plane, Hotel, ShoppingBag, Gift, Ticket,
  MoreHorizontal, Percent, Banknote, FileSpreadsheet, ChevronRight, Eye,
  EyeOff, CreditCard, ClipboardList, Cog, ArrowUpRight, ArrowDownLeft, Menu
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Central Bank of India" },
      { name: "description", content: "Your personal banking dashboard. View accounts, recent transactions, payments and more." },
    ],
  }),
  component: Dashboard,
});

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, active: true },
  { label: "Accounts", icon: Wallet },
  { label: "Payments & Transfers", icon: ArrowLeftRight },
  { label: "Deposits", icon: PiggyBank },
  { label: "Loans", icon: Landmark },
  { label: "Investment", icon: TrendingUp },
  { label: "Insurance", icon: Shield },
  { label: "PFM", icon: BarChart3 },
  { label: "ASBA/IPO", icon: FileText },
  { label: "Government Schemes", icon: Building2 },
];

const payments = [
  { label: "Pay Bills", icon: Receipt },
  { label: "Transfer Funds", icon: Landmark },
  { label: "Manage Payee", icon: Users },
  { label: "Manage Billers", icon: ClipboardList },
  { label: "Manage SI", icon: Cog },
  { label: "Manage FasTag", icon: CreditCard },
];

const discover = [
  { label: "Apply Loan", sub: "Get best interest rates", bg: "bg-rose-50", icon: Landmark, iconBg: "bg-rose-100 text-rose-600" },
  { label: "Open Fixed Deposit", sub: "Create Fixed deposits", bg: "bg-emerald-50", icon: PiggyBank, iconBg: "bg-emerald-100 text-emerald-600" },
  { label: "Create Financial Goals", sub: "Manage your personal", bg: "bg-amber-50", icon: TrendingUp, iconBg: "bg-amber-100 text-amber-700" },
  { label: "Get Insurance", sub: "Provide financial", bg: "bg-orange-50", icon: Shield, iconBg: "bg-orange-100 text-orange-600" },
];

const shopping = [
  { label: "Book Flights", icon: Plane },
  { label: "Book Hotels", icon: Hotel },
  { label: "Shop & Earn", icon: ShoppingBag },
  { label: "Entertainment", icon: Ticket },
  { label: "Get e-Vouchers", icon: Gift },
  { label: "Explore More", icon: MoreHorizontal },
];

const wealth = [
  { label: "Buy Mutual Funds", icon: TrendingUp },
  { label: "Govt. Schemes", icon: Building2 },
  { label: "Apply for IPO", icon: FileSpreadsheet },
  { label: "Demat A/C", icon: Percent },
  { label: "Apply for NPS", icon: Banknote },
  { label: "Insurance", icon: Shield },
];

const transactions = [
  { date: "23 May 2026", amount: "₹ 5,959.00", type: "TO TRANSFER", out: true },
  { date: "23 May 2026", amount: "₹ 100.00", type: "BY TRANSFER", out: false },
  { date: "23 May 2026", amount: "₹ 1.00", type: "BY TRANSFER", out: false },
  { date: "23 May 2026", amount: "₹ 1,000.00", type: "BY TRANSFER", out: false },
  { date: "23 May 2026", amount: "₹ 19,253.00", type: "TO TRANSFER", out: true },
];

function Dashboard() {
  const [showBalance, setShowBalance] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[270px] bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-3">
              <span className="text-2xl font-bold">RP</span>
            </div>
            <div className="font-bold text-base">Mr. RAMBABU PRAJAPATI</div>
            <div className="text-xs text-white/70 mt-1">Last Login: 29 May 2026 06:47:44 PM</div>
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-400/95 text-amber-950 px-3 py-1.5 rounded-md text-xs font-bold">
              <span className="w-2 h-2 bg-amber-700 rounded-full" />
              0 REWARDS POINTS
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white border-b border-border">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-foreground"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-full px-4 py-2 w-64 lg:w-80">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="How can I help you?"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button className="relative p-2 text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-destructive" aria-label="Power">
                <Power className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Overview */}
            <section>
              <SectionTitle>Account Overview</SectionTitle>
              <div
                className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
                style={{ background: "var(--gradient-account)" }}
              >
                <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -right-20 -top-10 w-32 h-32 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-white/80">My Current A/C</div>
                      <div className="inline-block mt-2 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded">PRIMARY</div>
                    </div>
                    <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                      <span className="text-primary text-xs font-extrabold">CBI</span>
                    </div>
                  </div>
                  <div className="mt-5 font-mono text-xl sm:text-2xl tracking-[0.2em]">
                    XXXX X751 74
                  </div>
                  <div className="mt-5 text-sm text-white/80">Account Balance</div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="text-2xl font-bold">
                      {showBalance ? "₹ 2,48,512.00" : "₹ ●●●●●●●●"}
                    </div>
                    <button onClick={() => setShowBalance(!showBalance)} className="flex items-center gap-1 text-xs text-white/90 hover:text-white">
                      {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showBalance ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mt-6 pt-5 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
                    {[
                      { icon: FileText, label: "View Statement" },
                      { icon: CreditCard, label: "Manage Debit Card" },
                      { icon: Settings, label: "Apply Services" },
                    ].map((a) => (
                      <button key={a.label} className="flex flex-col items-center gap-2 text-xs hover:opacity-80">
                        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                          <a.icon className="w-5 h-5" />
                        </div>
                        <span className="leading-tight">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Payments */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle className="mb-0">Payments</SectionTitle>
                <a href="#" className="text-sm font-medium text-primary flex items-center gap-1">
                  Go to Payments <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] grid grid-cols-3 gap-4">
                {payments.map((p) => (
                  <IconTile key={p.label} icon={p.icon} label={p.label} />
                ))}
              </div>
            </section>

            {/* Discover More */}
            <section>
              <SectionTitle>Discover More</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                {discover.map((d) => (
                  <button
                    key={d.label}
                    className={`${d.bg} rounded-2xl p-5 text-left border border-border/50 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className={`w-10 h-10 rounded-full ${d.iconBg} flex items-center justify-center`}>
                        <d.icon className="w-5 h-5" />
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-primary" />
                    </div>
                    <div className="font-semibold text-foreground text-sm">{d.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{d.sub}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Offers strip */}
          <section>
            <SectionTitle>Offers For You</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OfferCard color="from-teal-700 to-teal-500" title="Get 10 points" body="per debit card purchase of ₹ 2000 or more" foot="(up to 100 transactions a year)" />
              <OfferCard color="from-rose-700 to-rose-500" title="Earn 100 points" body="for spending over ₹30,000 monthly with debit card" foot="(1st year only)" />
              <OfferCard color="from-blue-800 to-blue-600" title="Receive 500 points" body="for a new retail loan" foot="(up to 5 bills per month)" />
            </div>
          </section>

          {/* Recent + Shopping + Wealth */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle className="mb-0">Recent Transactions</SectionTitle>
                <a href="#" className="text-sm font-medium text-primary flex items-center gap-1">View All <ChevronRight className="w-4 h-4" /></a>
              </div>
              <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="text-left px-5 py-3 font-semibold">Date</th>
                      <th className="text-left px-5 py-3 font-semibold">Amount</th>
                      <th className="text-left px-5 py-3 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className="border-t border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-5 py-3.5 text-foreground">{t.date}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 font-medium ${t.out ? "text-destructive" : "text-success"}`}>
                            {t.out ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                            {t.amount}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-xs font-medium tracking-wide">{t.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <SectionTitle>Shopping</SectionTitle>
              <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] grid grid-cols-3 gap-4">
                {shopping.map((p) => <IconTile key={p.label} icon={p.icon} label={p.label} />)}
              </div>
            </section>

            <section>
              <SectionTitle>Wealth Planning</SectionTitle>
              <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] grid grid-cols-3 gap-4">
                {wealth.map((p) => <IconTile key={p.label} icon={p.icon} label={p.label} />)}
              </div>
            </section>
          </div>
        </main>

        <footer className="border-t border-border bg-white px-6 py-4 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© 2026 Central Bank of India. All rights reserved.</span>
          <span>Secure Banking • SSL Encrypted</span>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3 ${className}`}>{children}</h2>
  );
}

function IconTile({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 text-center hover:opacity-80 transition-opacity group">
      <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
    </button>
  );
}

function OfferCard({ color, title, body, foot }: { color: string; title: string; body: string; foot: string }) {
  return (
    <div className={`rounded-2xl p-6 text-white bg-gradient-to-br ${color} shadow-md relative overflow-hidden`}>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="relative">
        <div className="text-lg font-bold">{title}</div>
        <div className="text-sm text-white/90 mt-1">{body}</div>
        <div className="text-xs text-white/70 mt-3">{foot}</div>
      </div>
    </div>
  );
}
