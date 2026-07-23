import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, FileSpreadsheet, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useTransactionsWithBalances, type TransactionWithBalance } from "@/hooks/use-banking-data";
import { useNewIds } from "@/hooks/use-new-ids";
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
function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function StatementsPage() {
  const { user } = useAuth();
  const { data: accounts } = useAccounts(user?.id);
  // Empty by default → show ALL transactions. Filters only apply once the
  // user picks a value.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [direction, setDirection] = useState<"all" | "credit" | "debit">("all");
  const [mode, setMode] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: computed, isLoading } = useTransactionsWithBalances(user?.id);
  const allItems = useMemo(() => computed?.items ?? [], [computed]);

  // Filter for display: date range + direction/mode/search. Balances on each
  // row are the client-computed running balance across ALL transactions, so
  // filtering never invalidates them.
  const inRange = useMemo(() => {
    if (!from && !to) return allItems;
    const start = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
    const end = to ? new Date(to + "T23:59:59.999").getTime() : Infinity;
    return allItems.filter((t) => {
      const ts = new Date(t.created_at).getTime();
      return ts >= start && ts <= end;
    });
  }, [allItems, from, to]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = inRange.filter((t) => {
      if (direction !== "all" && t.direction !== direction) return false;
      if (mode !== "all" && t.mode !== mode) return false;
      if (q && !`${t.reference} ${t.description ?? ""} ${t.beneficiary_name ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    // Display newest-first; balances stay authoritative (were computed asc).
    return [...rows].reverse();
  }, [inRange, direction, mode, search]);
  const newTxIds = useNewIds(filtered);

  const primary = accounts?.find((a) => a.is_primary) ?? accounts?.[0];
  const totals = filtered.reduce(
    (a: { credit: number; debit: number }, t: TransactionWithBalance) => {
      if (t.direction === "credit") a.credit += Number(t.amount);
      else a.debit += Number(t.amount);
      return a;
    },
    { credit: 0, debit: 0 }
  );

  // Opening balance for the selected range = computed balance right BEFORE
  // the earliest in-range transaction (in ascending order). Closing = last
  // in-range balance. Both derived from the shared computation.
  const ascInRange = useMemo(() => [...inRange].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ), [inRange]);
  const firstAsc = ascInRange[0];
  const lastAsc = ascInRange[ascInRange.length - 1];
  const opening = firstAsc
    ? firstAsc.computed_balance - (firstAsc.direction === "credit" ? Number(firstAsc.amount) : -Number(firstAsc.amount))
    : (computed?.finalBalance ?? 0);
  const closing = lastAsc ? lastAsc.computed_balance : opening;

  // Downloads: default to the current month when the user hasn't chosen a
  // date range. The website table always shows every transaction.
  const exportRange = useMemo(() => {
    const f = from || firstOfMonth();
    const t = to || today();
    return { from: f, to: t };
  }, [from, to]);

  const exportItems = useMemo(() => {
    const start = new Date(exportRange.from + "T00:00:00").getTime();
    const end = new Date(exportRange.to + "T23:59:59.999").getTime();
    const q = search.toLowerCase();
    const rows = allItems.filter((t) => {
      const ts = new Date(t.created_at).getTime();
      if (ts < start || ts > end) return false;
      if (direction !== "all" && t.direction !== direction) return false;
      if (mode !== "all" && t.mode !== mode) return false;
      if (q && !`${t.reference} ${t.description ?? ""} ${t.beneficiary_name ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...rows].reverse();
  }, [allItems, exportRange, direction, mode, search]);

  const expOpening = (() => {
    const asc = [...exportItems].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const first = asc[0];
    return first
      ? first.computed_balance - (first.direction === "credit" ? Number(first.amount) : -Number(first.amount))
      : (computed?.finalBalance ?? 0);
  })();
  const expClosing = exportItems[0]?.computed_balance ?? expOpening;

  const meta = {
    customerName: DEMO_PROFILE.fullName,
    accountNumber: primary?.account_number ?? "",
    ifsc: primary?.ifsc ?? DEMO_PROFILE.ifsc,
    cif: DEMO_PROFILE.cif,
    branch: DEMO_PROFILE.branch,
    openingBalance: expOpening,
    closingBalance: expClosing,
    fromDate: exportRange.from,
    toDate: exportRange.to,
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
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
          <p className="text-[11px] text-muted-foreground mt-3">
            Downloads default to the current month ({exportRange.from} → {exportRange.to}). Pick a custom From/To to change the export range. The list below always shows every transaction.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" disabled={!exportItems.length} onClick={() => exportTransactionsPDF(exportItems, meta, `statement-${exportRange.from}-${exportRange.to}.pdf`)}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" disabled={!exportItems.length} onClick={() => exportTransactionsExcel(exportItems, `statement-${exportRange.from}-${exportRange.to}.xlsx`)}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" disabled={!exportItems.length} onClick={() => exportTransactionsCSV(exportItems, `statement-${exportRange.from}-${exportRange.to}.csv`)}>
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
                      <TableCell>{formatINR(t.computed_balance)}</TableCell>
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
