import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Copy, ArrowLeftRight, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts } from "@/hooks/use-banking-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, maskAccount } from "@/lib/banking";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Central Bank of India" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { user } = useAuth();
  const { data: accounts, isLoading } = useAccounts(user?.id);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  return (
    <AppShell title="My Accounts">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
        {isLoading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        {accounts?.map((a) => {
          const r = reveal[a.id];
          return (
            <div key={a.id} className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: "var(--gradient-account)" }}>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-white/80">{a.account_type}</div>
                    {a.is_primary && <div className="inline-block mt-1 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded">PRIMARY</div>}
                  </div>
                  <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                    <span className="text-primary text-xs font-extrabold">CBI</span>
                  </div>
                </div>
                <div className="mt-5 font-mono text-lg tracking-wider flex items-center gap-2">
                  {r ? a.account_number : maskAccount(a.account_number)}
                  <button onClick={() => setReveal({ ...reveal, [a.id]: !r })}>{r ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button onClick={() => { navigator.clipboard.writeText(a.account_number); toast.success("Account number copied"); }}><Copy className="w-4 h-4" /></button>
                </div>
                <div className="text-xs text-white/70 mt-1">IFSC: {a.ifsc}</div>
                <div className="mt-4 text-sm text-white/80">Available Balance</div>
                <div className="text-3xl font-bold">{formatINR(a.balance)}</div>
                <div className="mt-5 flex gap-2">
                  <Link to="/transfer"><Button size="sm" variant="secondary"><ArrowLeftRight className="w-4 h-4 mr-1" />Transfer</Button></Link>
                  <Link to="/statements"><Button size="sm" variant="secondary"><FileText className="w-4 h-4 mr-1" />Statement</Button></Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
