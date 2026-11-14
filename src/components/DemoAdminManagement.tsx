import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactionsWithBalances, type TransactionWithBalance } from "@/hooks/use-banking-data";
import { formatDate, formatINR, maskAccount } from "@/lib/banking";
import { DEFAULT_DEMO_STATEMENT_DISCLOSURE, DEFAULT_DEMO_STATEMENT_TITLE, demoProfileUpdateSchema, demoStatementDisclosureSchema, demoStatementTitleSchema, demoTransactionChangeSchema, resolveDemoStatementDisclosure, type DemoProfileUpdate } from "@/lib/demo-admin-schema";
import { changeDemoTransaction, getDemoAdminProfile, getDemoStatementAppearance, saveDemoAdminProfile, saveDemoStatementDisclosure, saveDemoStatementTitle } from "@/lib/demo-admin.functions";
import { toast } from "sonner";

type Props = { userId: string; onChanged: () => void };

type ProfileForm = Omit<DemoProfileUpdate, "password"> & { password: string };

const blankProfile: ProfileForm = {
  fullName: "", email: "", mobile: "", customerId: "", accountNumber: "", accountType: "Current Account",
  ifsc: "", branch: "", branchAddress: "", communicationAddress: "", username: "", password: "",
};

function profileFrom(data: Awaited<ReturnType<typeof getDemoAdminProfile>>): ProfileForm {
  const profile = data.profile;
  const account = data.account;
  return {
    fullName: profile?.full_name ?? data.defaults.fullName,
    email: profile?.email ?? data.defaults.email,
    mobile: profile?.mobile ?? data.defaults.mobile,
    customerId: profile?.customer_id ?? data.defaults.customerId,
    accountNumber: account?.account_number ?? "",
    accountType: account?.account_type ?? "Current Account",
    ifsc: account?.ifsc ?? "",
    branch: profile?.branch ?? data.defaults.branch,
    branchAddress: profile?.branch_address ?? data.defaults.branchAddress,
    communicationAddress: profile?.communication_address ?? data.defaults.address,
    username: data.username,
    password: "",
  };
}

export function DemoAdminManagement({ userId, onChanged }: Props) {
  const queryClient = useQueryClient();
  const getProfile = useServerFn(getDemoAdminProfile);
  const saveProfile = useServerFn(saveDemoAdminProfile);
  const changeTransaction = useServerFn(changeDemoTransaction);
  const getAppearance = useServerFn(getDemoStatementAppearance);
  const saveStatementTitle = useServerFn(saveDemoStatementTitle);
  const saveStatementDisclosure = useServerFn(saveDemoStatementDisclosure);
  const { data: txData } = useTransactionsWithBalances(userId);
  const { data: savedProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["demo-admin-profile", userId],
    queryFn: () => getProfile(),
  });
  const { data: savedAppearance, isLoading: appearanceLoading } = useQuery({
    queryKey: ["demo-statement-appearance", userId],
    queryFn: () => getAppearance(),
  });
  const [form, setForm] = useState<ProfileForm>(blankProfile);
  const [statementTitle, setStatementTitle] = useState(DEFAULT_DEMO_STATEMENT_TITLE);
  const [statementDisclosure, setStatementDisclosure] = useState(DEFAULT_DEMO_STATEMENT_DISCLOSURE);
  const [profileConfirmOpen, setProfileConfirmOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const profileLoaded = useRef(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [mode, setMode] = useState("all");
  const [direction, setDirection] = useState("all");
  const [editing, setEditing] = useState<TransactionWithBalance | null>(null);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>(blankTransaction());
  const [transactionConfirmOpen, setTransactionConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "update" | "delete" | null>(null);
  const [transactionSaving, setTransactionSaving] = useState(false);
  const [statementAppearanceSaving, setStatementAppearanceSaving] = useState(false);

  useEffect(() => {
    if (savedProfile && !profileLoaded.current) {
      profileLoaded.current = true;
      setForm(profileFrom(savedProfile));
    }
  }, [savedProfile]);

  useEffect(() => {
    if (savedAppearance) {
      setStatementTitle(savedAppearance.title);
      setStatementDisclosure(savedAppearance.disclosureText);
    }
  }, [savedAppearance]);

  const transactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : -Infinity;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Infinity;
    return [...(txData?.items ?? [])]
      .filter((tx) => {
        const time = new Date(tx.created_at).getTime();
        if (time < from || time > to) return false;
        if (mode !== "all" && tx.mode.toUpperCase() !== mode) return false;
        if (direction !== "all" && tx.direction !== direction) return false;
        if (q && !`${tx.reference} ${tx.beneficiary_name ?? ""} ${tx.description ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [txData, search, fromDate, toDate, mode, direction]);

  const setProfileField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setProfileErrors((current) => ({ ...current, [key]: "" }));
  };

  const requestProfileSave = () => {
    const parsed = demoProfileUpdateSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        next[field] ??= issue.message;
      }
      setProfileErrors(next);
      toast.error("Review the highlighted account and profile details.");
      return;
    }
    setProfileConfirmOpen(true);
  };

  const submitProfile = async () => {
    const parsed = demoProfileUpdateSchema.safeParse(form);
    if (!parsed.success) return;
    setProfileSaving(true);
    try {
      await saveProfile({ data: parsed.data });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["demo-admin-profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["demo-profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["accounts", userId] }),
      ]);
      setForm({ ...parsed.data, password: "" });
      setProfileConfirmOpen(false);
      toast.success("Demo account and profile updated.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save demo profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const submitStatementTitle = async () => {
    const parsed = demoStatementTitleSchema.safeParse(statementTitle);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a valid statement title.");
      return;
    }
    setStatementAppearanceSaving(true);
    try {
      const result = await saveStatementTitle({ data: parsed.data });
      setStatementTitle(result.title);
      await queryClient.invalidateQueries({ queryKey: ["demo-statement-appearance", userId] });
      toast.success("Statement title saved.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the statement title.");
    } finally {
      setStatementAppearanceSaving(false);
    }
  };

  const submitStatementDisclosure = async () => {
    const parsed = demoStatementDisclosureSchema.safeParse(statementDisclosure);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Enter a visible disclosure.");
      return;
    }
    setStatementAppearanceSaving(true);
    try {
      const result = await saveStatementDisclosure({ data: parsed.data });
      setStatementDisclosure(result.disclosureText);
      await queryClient.invalidateQueries({ queryKey: ["demo-statement-appearance", userId] });
      toast.success("Statement disclosure saved.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the statement disclosure.");
    } finally {
      setStatementAppearanceSaving(false);
    }
  };

  const openTransactionEditor = (tx?: TransactionWithBalance) => {
    setEditing(tx ?? null);
    setTransactionForm(tx ? transactionFormFrom(tx) : blankTransaction());
    setPendingAction(tx ? "update" : "add");
  };

  const requestTransactionSave = () => {
    const action = pendingAction ?? (editing ? "update" : "add");
    const payload = transactionPayload(transactionForm, action, editing?.id);
    const parsed = demoTransactionChangeSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the transaction details.");
      return;
    }
    setTransactionConfirmOpen(true);
  };

  const submitTransactionChange = async () => {
    if (!pendingAction) return;
    const parsed = demoTransactionChangeSchema.safeParse(transactionPayload(transactionForm, pendingAction, editing?.id));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the transaction details.");
      return;
    }
    setTransactionSaving(true);
    try {
      await changeTransaction({ data: parsed.data });
      await queryClient.invalidateQueries({
        predicate: (query) => ["transactions", "accounts", "statement"].includes(String(query.queryKey[0])),
      });
      setTransactionConfirmOpen(false);
      setPendingAction(null);
      setEditing(null);
      toast.success(pendingAction === "add" ? "Demo transaction added." : "Demo transaction changes saved.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the demo transaction.");
    } finally {
      setTransactionSaving(false);
    }
  };

  const requestDelete = (tx: TransactionWithBalance) => {
    setEditing(tx);
    setPendingAction("delete");
    setTransactionConfirmOpen(true);
  };

  const submitDelete = async () => {
    if (!editing) return;
    setTransactionSaving(true);
    try {
      await changeTransaction({ data: { action: "delete", id: editing.id } });
      await queryClient.invalidateQueries({
        predicate: (query) => ["transactions", "accounts", "statement"].includes(String(query.queryKey[0])),
      });
      setTransactionConfirmOpen(false);
      setPendingAction(null);
      setEditing(null);
      toast.success("Demo transaction deleted; balances are recalculated from the ledger.");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete the demo transaction.");
    } finally {
      setTransactionSaving(false);
    }
  };

  return (
    <>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="profile">Account &amp; Profile Management</TabsTrigger>
          <TabsTrigger value="transactions">Manage Transactions</TabsTrigger>
          <TabsTrigger value="appearance">Statement Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4 pt-3">
          <div className="flex items-start gap-2 border-b border-border pb-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>Demo configuration only. Login password changes affect this demo sign-in and are never displayed or logged.</p>
          </div>
          {profileLoading ? <p className="text-sm text-muted-foreground">Loading saved details…</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Username" error={profileErrors.username}><Input autoComplete="off" value={form.username} onChange={(e) => setProfileField("username", e.target.value)} /></FormField>
            <FormField label="New password" error={profileErrors.password}><Input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => setProfileField("password", e.target.value)} placeholder="Leave blank to keep current" /></FormField>
            <FormField label="Email address" error={profileErrors.email}><Input type="email" value={form.email} onChange={(e) => setProfileField("email", e.target.value)} /></FormField>
            <FormField label="Account holder name" error={profileErrors.fullName}><Input value={form.fullName} onChange={(e) => setProfileField("fullName", e.target.value)} /></FormField>
            <FormField label="Account number" error={profileErrors.accountNumber}>
              <Input inputMode="numeric" value={form.accountNumber} onChange={(e) => setProfileField("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 18))} />
              <p className="text-xs text-muted-foreground">Masked account number: {form.accountNumber ? maskAccount(form.accountNumber) : "—"} · derived from the full account number</p>
            </FormField>
            <FormField label="Account type" error={profileErrors.accountType}><Input value={form.accountType} onChange={(e) => setProfileField("accountType", e.target.value)} /></FormField>
            <FormField label="IFSC code" error={profileErrors.ifsc}><Input value={form.ifsc} onChange={(e) => setProfileField("ifsc", e.target.value.toUpperCase().slice(0, 11))} /></FormField>
            <FormField label="CIF / Customer ID" error={profileErrors.customerId}><Input value={form.customerId} onChange={(e) => setProfileField("customerId", e.target.value)} /></FormField>
            <FormField label="Mobile number" error={profileErrors.mobile}><Input value={form.mobile} onChange={(e) => setProfileField("mobile", e.target.value)} /></FormField>
            <FormField label="Branch name" error={profileErrors.branch}><Input value={form.branch} onChange={(e) => setProfileField("branch", e.target.value)} /></FormField>
            <FormField label="Branch address" error={profileErrors.branchAddress}><Input value={form.branchAddress} onChange={(e) => setProfileField("branchAddress", e.target.value)} /></FormField>
            <FormField label="Residential / communication address" error={profileErrors.communicationAddress} className="sm:col-span-2"><Textarea value={form.communicationAddress} onChange={(e) => setProfileField("communicationAddress", e.target.value)} /></FormField>
          </div>
          <div className="flex justify-end"><Button onClick={requestProfileSave} disabled={profileSaving || profileLoading}>{profileSaving ? "Saving…" : "Save profile"}</Button></div>
        </TabsContent>
        <TabsContent value="appearance" className="space-y-4 pt-3">
          <div className="flex items-start gap-2 border-b border-border pb-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>The complete wording must identify this as a demo and state that it is not bank-issued or bank-verified.</p>
          </div>
          {appearanceLoading ? <p className="text-sm text-muted-foreground">Loading saved appearance…</p> : null}
          <FormField label="Statement Title">
            <Input maxLength={80} value={statementTitle} onChange={(event) => setStatementTitle(event.target.value)} placeholder={DEFAULT_DEMO_STATEMENT_TITLE} />
          </FormField>
          <div className="border-t border-border pt-3">
            <p className="text-center text-sm font-bold text-primary">{statementTitle.trim() || DEFAULT_DEMO_STATEMENT_TITLE}</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">{resolveDemoStatementDisclosure(statementDisclosure)}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => void submitStatementTitle()} disabled={statementAppearanceSaving || appearanceLoading}>
              {statementAppearanceSaving ? "Saving…" : "Save statement title"}
            </Button>
          </div>
          <FormField label="Statement Disclosure Text">
            <Textarea maxLength={160} rows={3} value={statementDisclosure} onChange={(event) => setStatementDisclosure(event.target.value)} placeholder={DEFAULT_DEMO_STATEMENT_DISCLOSURE} />
          </FormField>
          <div className="flex justify-end">
            <Button onClick={() => void submitStatementDisclosure()} disabled={statementAppearanceSaving || appearanceLoading}>
              {statementAppearanceSaving ? "Saving…" : "Save disclosure text"}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">DEMO / SIMULATED transactions only. Each change is recorded in the audit history.</p>
            <Button size="sm" onClick={() => openTransactionEditor()}><Plus className="h-4 w-4" /> Add</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative sm:col-span-2 lg:col-span-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search UTR or name" aria-label="Search transactions" /></div>
            <FormField label="From"><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></FormField>
            <FormField label="To"><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></FormField>
            <FormField label="Mode"><Select value={mode} onValueChange={setMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All modes</SelectItem>{["UPI", "IMPS", "NEFT", "RTGS", "TFR", "TRANSFER", "OTHER"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></FormField>
            <FormField label="Type"><Select value={direction} onValueChange={setDirection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent></Select></FormField>
          </div>
          <div className="max-h-[42vh] overflow-auto border border-border">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="sticky top-0 bg-secondary text-muted-foreground"><tr>{["Date", "Reference", "Description", "Mode", "Amount", "Balance", ""].map((label) => <th key={label} className="px-3 py-2 font-semibold">{label}</th>)}</tr></thead>
              <tbody>
                {transactions.map((tx) => <tr key={tx.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(tx.created_at)}</td>
                  <td className="px-3 py-2 font-mono">{tx.reference}</td>
                  <td className="max-w-48 px-3 py-2"><span className="block truncate">{tx.description ?? tx.beneficiary_name ?? "—"}</span>{tx.beneficiary_account && <span className="text-muted-foreground">{displayMaskedAccount(tx.beneficiary_account)}</span>}</td>
                  <td className="px-3 py-2">{tx.mode} · {tx.direction}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatINR(tx.amount)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatINR(tx.computed_balance)}</td>
                  <td className="px-3 py-2"><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Edit ${tx.reference}`} onClick={() => openTransactionEditor(tx)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${tx.reference}`} onClick={() => requestDelete(tx)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></td>
                </tr>)}
                {!transactions.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No matching demo transactions.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={pendingAction === "add" || pendingAction === "update"} onOpenChange={(open) => { if (!open && !transactionSaving) { setPendingAction(null); setEditing(null); } }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit demo transaction" : "Add demo transaction"}</DialogTitle><DialogDescription>Changes affect the simulated ledger only; running balances are recalculated from the saved transaction history.</DialogDescription></DialogHeader>
          <TransactionEditor form={transactionForm} setForm={setTransactionForm} />
          <DialogFooter><Button variant="outline" onClick={() => { setPendingAction(null); setEditing(null); }}>Cancel</Button><Button onClick={requestTransactionSave} disabled={transactionSaving}>{editing ? "Save changes" : "Add transaction"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={profileConfirmOpen} onOpenChange={setProfileConfirmOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Save demo account details?</AlertDialogTitle><AlertDialogDescription>Profile fields and demo sign-in details will be updated. A password is only changed when a new one is entered.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={profileSaving}>Cancel</AlertDialogCancel><AlertDialogAction disabled={profileSaving} onClick={(event) => { event.preventDefault(); void submitProfile(); }}>{profileSaving ? "Saving…" : "Confirm save"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={transactionConfirmOpen} onOpenChange={setTransactionConfirmOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{pendingAction === "delete" ? "Delete this demo transaction?" : "Save transaction changes?"}</AlertDialogTitle><AlertDialogDescription>{pendingAction === "delete" ? "This simulated ledger entry will be removed. Later running balances will recalculate from the remaining history. The edit will be recorded." : "The transaction will be saved to the demo ledger and an audit entry will be created."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={transactionSaving}>Cancel</AlertDialogCancel><AlertDialogAction disabled={transactionSaving} onClick={(event) => { event.preventDefault(); void (pendingAction === "delete" ? submitDelete() : submitTransactionChange()); }}>{transactionSaving ? "Saving…" : pendingAction === "delete" ? "Delete transaction" : "Confirm save"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type TransactionForm = {
  createdAt: string; direction: string; mode: string; amount: string; name: string; upiId: string;
  account: string; ifsc: string; reference: string; description: string;
};

function blankTransaction(): TransactionForm {
  return { createdAt: new Date().toISOString().slice(0, 16), direction: "debit", mode: "UPI", amount: "", name: "", upiId: "", account: "", ifsc: "", reference: "", description: "" };
}

function transactionFormFrom(tx: TransactionWithBalance): TransactionForm {
  const transactionDate = new Date(tx.created_at);
  const localDate = new Date(transactionDate.getTime() - transactionDate.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return { createdAt: localDate, direction: tx.direction, mode: tx.mode.toUpperCase(), amount: String(tx.amount), name: tx.beneficiary_name ?? "", upiId: tx.upi_id ?? "", account: tx.beneficiary_account ?? "", ifsc: tx.beneficiary_ifsc ?? "", reference: tx.reference, description: tx.description ?? tx.beneficiary_name ?? tx.mode };
}

function transactionPayload(form: TransactionForm, action: "add" | "update" | "delete", id?: string) {
  const transactionDate = new Date(form.createdAt);
  return {
    action,
    ...(id ? { id } : {}),
    amount: Number(form.amount),
    direction: form.direction,
    mode: form.mode,
    beneficiaryName: form.name,
    upiId: form.upiId,
    beneficiaryAccount: form.account,
    beneficiaryIfsc: form.ifsc,
    reference: form.reference,
    description: form.description,
    createdAt: Number.isNaN(transactionDate.getTime()) ? "" : transactionDate.toISOString(),
  };
}

function displayMaskedAccount(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `XXXX XXXX ${digits.slice(-4)}` : value;
}

function TransactionEditor({ form, setForm }: { form: TransactionForm; setForm: React.Dispatch<React.SetStateAction<TransactionForm>> }) {
  const update = (key: keyof TransactionForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="grid gap-3 sm:grid-cols-2">
    <FormField label="Date and time"><Input type="datetime-local" value={form.createdAt} onChange={(e) => update("createdAt", e.target.value)} /></FormField>
    <FormField label="Type"><Select value={form.direction} onValueChange={(value) => update("direction", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent></Select></FormField>
    <FormField label="Payment mode"><Select value={form.mode} onValueChange={(value) => update("mode", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["UPI", "IMPS", "NEFT", "RTGS", "TFR", "TRANSFER", "DEPOSIT", "WITHDRAWAL", "OTHER"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></FormField>
    <FormField label="Amount (INR)"><Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => update("amount", e.target.value)} /></FormField>
    <FormField label="Beneficiary / sender"><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></FormField>
    <FormField label="UPI ID"><Input value={form.upiId} onChange={(e) => update("upiId", e.target.value)} /></FormField>
    <FormField label="Account number"><Input value={form.account} onChange={(e) => update("account", e.target.value)} /></FormField>
    <FormField label="IFSC code"><Input value={form.ifsc} onChange={(e) => update("ifsc", e.target.value.toUpperCase())} /></FormField>
    <FormField label="UTR / reference"><Input value={form.reference} onChange={(e) => update("reference", e.target.value)} /></FormField>
    <FormField label="Description / narration" className="sm:col-span-2"><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} /></FormField>
  </div>;
}

function FormField({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <div className={`min-w-0 space-y-1.5 ${className}`}><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}