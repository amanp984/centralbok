import { maskAccount } from "@/lib/banking";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  PiggyBank, Landmark, TrendingUp, Shield, Receipt, Users, Settings,
  ClipboardList, Cog, CreditCard, FileText, Building2, FileSpreadsheet,
  Percent, Banknote, Plane, Hotel, ShoppingBag, Gift, Ticket,
  MoreHorizontal, ChevronRight, Eye, EyeOff, ArrowUpRight, ArrowDownLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useTransactionsWithBalances } from "@/hooks/use-banking-data";
import { useNewIds } from "@/hooks/use-new-ids";
import { DEMO_PROFILE } from "@/lib/demo-user";
import logoAsset from "@/assets/cbi-emblem.png.asset.json";

import { useBankingModal } from "@/components/modals/BankingModalProvider";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Central Bank of India" },
      { name: "description", content: "Your personal banking dashboard. View accounts, recent transactions, payments and more." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: accounts, isLoading: accountsLoading } = useAccounts(user?.id);
  const { data: computed, isLoading: txLoading } = useTransactionsWithBalances(user?.id);
  const recentTx = (computed?.items ?? []).slice(-5).reverse();
  const finalBalance = computed?.finalBalance ?? 0;
  const newTxIds = useNewIds(recentTx);
  const modal = useBankingModal();
  const [showBalance, setShowBalance] = useState(false);

  const primary = accounts?.find((a) => a.is_primary) ?? accounts?.[0];

  return (
    <>
      <div className="space-y-6">
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-white/80">{DEMO_PROFILE.accountType}</div>
                    <div className="inline-block mt-2 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded">PRIMARY</div>
                  </div>
                  <img
                    src={logoAsset.url}
                    alt="CBI"
                    className="w-15 h-15 shrink-0 object-contain"
                    style={{ width: "60px", height: "60px" }}
                  />
                </div>
                <div className="mt-4 font-mono text-lg sm:text-xl tracking-[0.18em] break-all">
                  {accountsLoading ? "Loading…" : primary ? maskAccount(primary.account_number) : "—"}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:text-xs text-white/90">
                  <div className="min-w-0">
                    <dt className="text-white/60 uppercase tracking-wider">Account Holder</dt>
                    <dd className="font-semibold truncate">{DEMO_PROFILE.fullName}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-white/60 uppercase tracking-wider">CIF</dt>
                    <dd className="font-semibold truncate">{DEMO_PROFILE.cif}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-white/60 uppercase tracking-wider">IFSC</dt>
                    <dd className="font-semibold truncate">{DEMO_PROFILE.ifsc}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-white/60 uppercase tracking-wider">Branch</dt>
                    <dd className="font-semibold truncate">{DEMO_PROFILE.branch}</dd>
                  </div>
                </dl>

                <div className="mt-4 text-xs text-white/80">Available Balance</div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-2xl font-bold">
                    {txLoading && !computed ? <Skeleton className="h-8 w-40 bg-white/20" /> : showBalance ? formatINR(finalBalance) : "₹ ●●●●●●●●"}
                  </div>
                  <button onClick={() => setShowBalance(!showBalance)} className="flex items-center gap-1 text-xs text-white/90 hover:text-white">
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showBalance ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="mt-5 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
                  <CardAction icon={FileText} label="View Statement" to="/statements" />
                  <CardAction
                    icon={CreditCard} label="Manage Debit Card"
                    onClick={() => modal.showCardSuccess({ title: "Request Received", message: "We'll process your debit-card request shortly." })}
                  />
                  <CardAction icon={Settings} label="Apply Services" to="/settings" />
                </div>
              </div>
            </div>
          </section>


          {/* Payments */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle className="mb-0">Payments</SectionTitle>
              <Link to="/transfer" className="text-sm font-medium text-primary flex items-center gap-1">
                Go to Payments <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] grid grid-cols-3 gap-4">
              <IconTile icon={Receipt} label="Pay Bills" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Landmark} label="Transfer Funds" to="/transfer" />
              <IconTile icon={Users} label="Manage Payee" to="/beneficiaries" />
              <IconTile icon={ClipboardList} label="Manage Billers" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Cog} label="Manage SI" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={CreditCard} label="Manage FasTag" onClick={() => modal.showMobileOnly()} />
            </div>
          </section>

          {/* Discover More */}
          <section>
            <SectionTitle>Discover More</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <DiscoverCard to="/loans" bg="bg-rose-50" iconBg="bg-rose-100 text-rose-600" icon={Landmark} label="Apply Loan" sub="Get best interest rates" />
              <DiscoverCard to="/deposits" bg="bg-emerald-50" iconBg="bg-emerald-100 text-emerald-600" icon={PiggyBank} label="Open Fixed Deposit" sub="Create Fixed deposits" />
              <DiscoverCard to="/investments" bg="bg-amber-50" iconBg="bg-amber-100 text-amber-700" icon={TrendingUp} label="Financial Goals" sub="Manage your personal" />
              <DiscoverCard to="/insurance" bg="bg-orange-50" iconBg="bg-orange-100 text-orange-600" icon={Shield} label="Get Insurance" sub="Provide financial cover" />
            </div>
          </section>
        </div>

        {/* Offers */}
        <section>
          <SectionTitle>Offers For You</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OfferCard color="from-teal-700 to-teal-500" title="Get 10 points" body="per debit card purchase of ₹ 2000 or more" foot="(up to 100 transactions a year)" />
            <OfferCard color="from-rose-700 to-rose-500" title="Earn 100 points" body="for spending over ₹30,000 monthly with debit card" foot="(1st year only)" />
            <OfferCard color="from-blue-800 to-blue-600" title="Receive 500 points" body="for a new retail loan" foot="(up to 5 bills per month)" />
          </div>
        </section>

        {/* Recent + Shopping + Wealth */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-6">
          <section className="min-w-0">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle className="mb-0">Recent Transactions</SectionTitle>
              <Link to="/statements" className="text-sm font-medium text-primary flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-x-auto">
              <table className="w-full text-[10px] table-fixed">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[13%]" />
                  <col className="w-[35%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="text-left px-2.5 py-2 font-semibold">Date</th>
                    <th className="text-left px-2.5 py-2 font-semibold">Amount</th>
                    <th className="text-left px-2.5 py-2 font-semibold">Type</th>
                    <th className="text-left px-2.5 py-2 font-semibold">Details</th>
                    <th className="text-right px-2.5 py-2 font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="border-t border-border">
                        <td colSpan={5} className="px-2.5 py-2.5"><Skeleton className="h-3 w-full" /></td>
                      </tr>
                    ))
                  ) : recentTx.length > 0 ? (
                    recentTx.map((t) => (
                      <tr key={t.id} className={`border-t border-border hover:bg-secondary/50 transition-colors align-top ${newTxIds.has(t.id) ? "row-highlight" : ""}`}>
                        <td className="px-2.5 py-2.5 text-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td className="px-2.5 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-medium ${t.direction === "debit" ? "text-destructive" : "text-success"}`}>
                            {t.direction === "debit" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            {formatINR(t.amount)}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 whitespace-nowrap">
                          <span className={`inline-block rounded px-1 py-[1px] text-[8px] font-bold uppercase tracking-wide ${t.direction === "debit" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                            {t.direction === "debit" ? "DEBIT" : "CREDIT"}
                          </span>
                          <span className="ml-1 text-[9px] font-semibold uppercase text-foreground/80">{t.mode}</span>
                        </td>
                        <td className="px-2.5 py-2.5 text-muted-foreground text-[9px] font-medium tracking-wide uppercase whitespace-normal break-words leading-snug">{t.description ?? "—"}</td>
                        <td className="px-2.5 py-2.5 whitespace-nowrap text-right font-semibold text-foreground">{formatINR(t.computed_balance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-muted-foreground">No transactions yet. Make a transfer to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>


          <section>
            <SectionTitle>Shopping</SectionTitle>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] grid grid-cols-3 gap-4">
              <IconTile icon={Plane} label="Book Flights" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Hotel} label="Book Hotels" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={ShoppingBag} label="Shop & Earn" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Ticket} label="Entertainment" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Gift} label="Get e-Vouchers" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={MoreHorizontal} label="Explore More" onClick={() => modal.showMobileOnly()} />
            </div>
          </section>

          <section>
            <SectionTitle>Wealth Planning</SectionTitle>
            <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)] grid grid-cols-3 gap-4">
              <IconTile icon={TrendingUp} label="Buy Mutual Funds" to="/investments" />
              <IconTile icon={Building2} label="Govt. Schemes" to="/gov-schemes" />
              <IconTile icon={FileSpreadsheet} label="Apply for IPO" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Percent} label="Demat A/C" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Banknote} label="Apply for NPS" onClick={() => modal.showMobileOnly()} />
              <IconTile icon={Shield} label="Insurance" to="/insurance" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function formatINR(n: number) {
  return `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3 ${className}`}>{children}</h2>;
}

function IconTile({ icon: Icon, label, to, onClick }: { icon: any; label: string; to?: any; onClick?: () => void }) {
  const inner = (
    <>
      <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
    </>
  );
  if (to) return <Link to={to} className="flex flex-col items-center gap-2 text-center hover:opacity-80 transition-opacity group">{inner}</Link>;
  return <button onClick={onClick} className="flex flex-col items-center gap-2 text-center hover:opacity-80 transition-opacity group">{inner}</button>;
}

function CardAction({ icon: Icon, label, to, onClick }: { icon: any; label: string; to?: any; onClick?: () => void }) {
  const inner = (
    <>
      <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mx-auto">
        <Icon className="w-5 h-5" />
      </div>
      <span className="leading-tight text-xs mt-2 block">{label}</span>
    </>
  );
  if (to) return <Link to={to} className="text-xs hover:opacity-80 block">{inner}</Link>;
  return <button onClick={onClick} className="text-xs hover:opacity-80">{inner}</button>;
}

function DiscoverCard({ to, bg, iconBg, icon: Icon, label, sub }: { to: any; bg: string; iconBg: string; icon: any; label: string; sub: string }) {
  return (
    <Link to={to} className={`${bg} rounded-2xl p-5 text-left border border-border/50 hover:shadow-md transition-shadow block`}>
      <div className="flex items-start justify-between mb-8">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-5 h-5 text-primary" />
      </div>
      <div className="font-semibold text-foreground text-sm">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </Link>
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
