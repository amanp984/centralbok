import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, FileSpreadsheet, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useTransactionsWithBalances, type TransactionWithBalance } from "@/hooks/use-banking-data";
import { useNewIds } from "@/hooks/use-new-ids";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatDate, maskAccount } from "@/lib/banking";
import { exportTransactionsCSV, exportTransactionsExcel, exportTransactionsPDF } from "@/lib/exports";
import { DEMO_PROFILE } from "@/lib/demo-user";

export const Route = createFileRoute("/_authenticated/statements")({
  head: () => ({ meta: [{ title: "Statements — Central Bank of India" }] }),
  component: StatementsPage,
});

function today() { return new Date().toISOString().slice(0,10); }

function StatementsPage() {
  const { user } = useAuth();
  const { data: accounts } = useAccounts(user?.id);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [direction, setDirection] = useState<"all" | "credit" | "debit">("all");
  const [mode, setMode] = useState<string>("all");
  const [search, setSearch] = useState("");
  const userAdjustedRef = useRef(false);

  // Auto-adjust default date range to the most recent transaction date if
  // "today" has no transactions. Runs once on mount; skipped if the user
  // has already changed the from/to inputs.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const t = today();
      const { data: todays } = await supabase
        .from("transactions")
        .select("id")
        .gte("created_at", `${t}T00:00:00`)
        .lte("created_at", `${t}T23:59:59.999`)
        .limit(1);
      if (cancelled || userAdjustedRef.current) return;
      if (todays && todays.length > 0) return;
      const { data: latest } = await supabase
        .from("transactions")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled || userAdjustedRef.current) return;
      const first = latest?.[0]?.created_at;
      if (first) {
        const d = String(first).slice(0, 10);
        setFrom(d);
        setTo(d);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const { data, isLoading } = useQuery({
    queryKey: ["statement", user?.id, from, to],
    enabled: !!user?.id,
    queryFn: async () => {
      const start = new Date(from + "T00:00:00").toISOString();
      const end = new Date(to + "T23:59:59").toISOString();
      const { data, error } = await supabase.from("transactions").select("*")
        .gte("created_at", start).lte("created_at", end)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((t) => {
      if (direction !== "all" && t.direction !== direction) return false;
      if (mode !== "all" && t.mode !== mode) return false;
      const q = search.toLowerCase();
      if (q && !`${t.reference} ${t.description ?? ""} ${t.beneficiary_name ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, direction, mode, search]);
  const newTxIds = useNewIds(filtered);

  const primary = accounts?.find((a) => a.is_primary) ?? accounts?.[0];
  const totals = filtered.reduce((a, t) => {
    if (t.direction === "credit") a.credit += t.amount; else a.debit += t.amount;
    return a;
  }, { credit: 0, debit: 0 });

  const opening = filtered.length ? Number(filtered[filtered.length - 1].running_balance ?? 0) - (filtered[filtered.length - 1].direction === "credit" ? Number(filtered[filtered.length - 1].amount) : -Number(filtered[filtered.length - 1].amount)) : Number(primary?.balance ?? 0);
  const closing = filtered.length ? Number(filtered[0].running_balance ?? 0) : Number(primary?.balance ?? 0);

  const meta = {
    customerName: DEMO_PROFILE.fullName,
    accountNumber: primary?.account_number ?? "",
    ifsc: primary?.ifsc ?? DEMO_PROFILE.ifsc,
    cif: DEMO_PROFILE.cif,
    branch: DEMO_PROFILE.branch,
    openingBalance: opening,
    closingBalance: closing,
    fromDate: from,
    toDate: to,
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} onChange={(e) => { userAdjustedRef.current = true; setFrom(e.target.value); }} /></div>
            <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} onChange={(e) => { userAdjustedRef.current = true; setTo(e.target.value); }} /></div>
            <div>
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {["UPI","IMPS","NEFT","RTGS","TRANSFER","DEPOSIT","WITHDRAWAL"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input id="search" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ref / payee" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" disabled={!filtered.length} onClick={() => exportTransactionsPDF(filtered, meta, `statement-${from}-${to}.pdf`)}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" disabled={!filtered.length} onClick={() => exportTransactionsExcel(filtered, `statement-${from}-${to}.xlsx`)}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" disabled={!filtered.length} onClick={() => exportTransactionsCSV(filtered, `statement-${from}-${to}.csv`)}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Transactions" value={String(filtered.length)} />
          <StatCard label="Total Credits" value={formatINR(totals.credit)} accent="text-success" />
          <StatCard label="Total Debits" value={formatINR(totals.debit)} accent="text-destructive" />
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-bold">{primary ? maskAccount(primary.account_number) : "—"}</h2>
              <p className="text-xs text-muted-foreground">{primary?.ifsc}</p>
            </div>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No transactions for the selected period.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-primary">
                  <TableRow>
                    {["Date","Reference","Description","Mode","Amount","Balance"].map((h) => (
                      <TableHead key={h} className="text-primary-foreground font-semibold">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id} className={newTxIds.has(t.id) ? "row-highlight" : ""}>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(t.created_at)}</TableCell>
                      <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                      <TableCell className="max-w-xs truncate">{t.description ?? t.beneficiary_name ?? "—"}</TableCell>
                      <TableCell><span className="px-2 py-0.5 bg-secondary rounded text-xs">{t.mode}</span></TableCell>
                      <TableCell className={`font-semibold ${t.direction === "credit" ? "text-success" : "text-destructive"}`}>
                        {t.direction === "credit" ? "+" : "−"} {formatINR(t.amount)}
                      </TableCell>
                      <TableCell>{formatINR(t.running_balance ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}
