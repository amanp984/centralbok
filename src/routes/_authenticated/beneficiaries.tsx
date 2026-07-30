import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Star, Search, Send, Building2, ShieldCheck,
  Clock, CheckCircle2, Eye, Users, Copy, Info,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useBeneficiaries, qk, type Beneficiary } from "@/hooks/use-banking-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { IFSC_REGEX, ACCOUNT_REGEX, formatDate } from "@/lib/banking";
import { BankSelect } from "@/components/BankSelect";
import { OTHER_BANK } from "@/lib/indian-banks";
import { beneficiaryStatus, PARTIAL_LIMIT } from "@/lib/beneficiary-status";

export const Route = createFileRoute("/_authenticated/beneficiaries")({
  head: () => ({
    meta: [
      { title: "Manage Beneficiaries — Central Bank of India" },
      { name: "description", content: "Add, edit and manage saved payees for IMPS, NEFT, RTGS and UPI transfers." },
    ],
  }),
  component: BeneficiariesPage,
});

type Filter = "all" | "favourite" | "pending" | "active";

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

function StatusChip({ createdAt }: { createdAt: string }) {
  const st = beneficiaryStatus(createdAt);
  if (st.state === "active") {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-600/30 bg-emerald-600/10 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-amber-600/30 bg-amber-500/10 text-amber-700">
      <Clock className="h-3 w-3" /> {st.label}
    </Badge>
  );
}

function BeneficiariesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: beneficiaries, isLoading } = useBeneficiaries(user?.id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Beneficiary | null>(null);
  const [viewing, setViewing] = useState<Beneficiary | null>(null);
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);

  const list = beneficiaries ?? [];

  const counts = useMemo(() => ({
    all: list.length,
    favourite: list.filter((b) => b.is_favourite).length,
    pending: list.filter((b) => beneficiaryStatus(b.created_at).state !== "active").length,
    active: list.filter((b) => beneficiaryStatus(b.created_at).state === "active").length,
  }), [list]);

  const filtered = list.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.account_number.includes(q) ||
      b.ifsc.toLowerCase().includes(q) ||
      (b.bank_name ?? "").toLowerCase().includes(q) ||
      (b.nickname ?? "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    const active = beneficiaryStatus(b.created_at).state === "active";
    if (filter === "favourite") return b.is_favourite;
    if (filter === "pending") return !active;
    if (filter === "active") return active;
    return true;
  });

  const saveMut = useMutation({
    mutationFn: async (vals: FormVals & { id?: string }) => {
      const payload = {
        name: vals.name.trim(),
        nickname: vals.nickname.trim() || null,
        account_number: vals.account_number.trim(),
        ifsc: vals.ifsc.trim().toUpperCase(),
        bank_name: (vals.bank === OTHER_BANK ? vals.customBank.trim() : vals.bank) || null,
        user_id: user!.id,
      };
      if (vals.id) {
        const { error } = await supabase.from("beneficiaries").update(payload).eq("id", vals.id);
        if (error) throw error;
        return { updated: true, name: payload.name };
      }
      const { error } = await supabase.from("beneficiaries").insert(payload);
      if (error) throw error;
      return { updated: false, name: payload.name };
    },
    onSuccess: (res) => {
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: qk.beneficiaries(user!.id) });
      if (res.updated) toast.success("Beneficiary updated successfully");
      else setAddedSuccess(res.name);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("beneficiaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Beneficiary removed");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: qk.beneficiaries(user!.id) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const favMut = useMutation({
    mutationFn: async (b: Beneficiary) => {
      const { error } = await supabase.from("beneficiaries").update({ is_favourite: !b.is_favourite }).eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.beneficiaries(user!.id) }),
  });

  return (
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { key: "all", label: "Total Payees", value: `${counts.all} / 12`, icon: Users },
          { key: "active", label: "Active", value: counts.active, icon: ShieldCheck },
          { key: "pending", label: "Pending Activation", value: counts.pending, icon: Clock },
          { key: "favourite", label: "Favourites", value: counts.favourite, icon: Star },
        ] as const).map((s) => (
          <div key={s.key} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <s.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{s.label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">Registered Beneficiaries</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A maximum of 12 payees can be registered. Newly added payees are activated as per bank policy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, account, IFSC or bank"
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setEditing(null); setOpen(true); }} disabled={counts.all >= 12} className="shrink-0">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3 sm:px-6">
          {([
            { key: "all", label: `All (${counts.all})` },
            { key: "active", label: `Active (${counts.active})` },
            { key: "pending", label: `Pending (${counts.pending})` },
            { key: "favourite", label: `Favourites (${counts.favourite})` },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-foreground">
                {search || filter !== "all" ? "No matching beneficiaries" : "No beneficiaries registered"}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                {search || filter !== "all"
                  ? "Try a different search term or clear the filters to view all your saved payees."
                  : "Add a payee to start sending money via IMPS, NEFT, RTGS or UPI."}
              </p>
              {!search && filter === "all" && (
                <Button className="mt-4" onClick={() => { setEditing(null); setOpen(true); }}>
                  <Plus className="mr-1 h-4 w-4" /> Add Beneficiary
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filtered.map((b) => {
                const st = beneficiaryStatus(b.created_at);
                return (
                  <div
                    key={b.id}
                    className="group animate-in fade-in slide-in-from-bottom-1 rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {initials(b.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-semibold text-foreground">{b.name}</span>
                          {b.is_favourite && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        </div>
                        {b.nickname && <div className="truncate text-xs text-muted-foreground">{b.nickname}</div>}
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{b.bank_name ?? "Bank not specified"}</span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          {b.account_number} • {b.ifsc}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusChip createdAt={b.created_at} />
                          {st.state !== "active" && (
                            <span className="text-[11px] text-muted-foreground">
                              {st.state === "pending" ? "Activates in" : "Full limit in"} {st.remaining}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => favMut.mutate(b)}
                        className="shrink-0 rounded-md p-1 hover:bg-accent"
                        aria-label={b.is_favourite ? "Remove from favourites" : "Mark as favourite"}
                      >
                        <Star className={`h-4 w-4 ${b.is_favourite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <Link to="/transfer" search={{ beneficiaryId: b.id }} className="shrink-0">
                        <Button size="sm" className="h-8"><Send className="mr-1 h-3.5 w-3.5" /> Send</Button>
                      </Link>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setViewing(b)}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> Details
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => { setEditing(b); setOpen(true); }}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" onClick={() => setToDelete(b)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BeneficiaryFormDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        onSubmit={(v) => saveMut.mutate({ ...v, id: editing?.id })}
        pending={saveMut.isPending}
      />

      {/* Details */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beneficiary Details</DialogTitle>
            <DialogDescription>Verify the payee details before initiating a transfer.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(viewing.name)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{viewing.name}</div>
                  <div className="text-xs text-muted-foreground">{viewing.nickname || "No nickname"}</div>
                </div>
                <div className="ml-auto shrink-0"><StatusChip createdAt={viewing.created_at} /></div>
              </div>
              <dl className="divide-y divide-border rounded-xl border border-border">
                {[
                  ["Account Number", viewing.account_number],
                  ["IFSC Code", viewing.ifsc],
                  ["Bank Name", viewing.bank_name ?? "—"],
                  ["Registered On", formatDate(viewing.created_at)],
                  ["Maximum Transfer", beneficiaryStatus(viewing.created_at).state === "active"
                    ? "No restriction"
                    : `₹${PARTIAL_LIMIT.toLocaleString("en-IN")}`],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="truncate text-right font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="flex gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {beneficiaryStatus(viewing.created_at).message}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard?.writeText(viewing.account_number);
                    toast.success("Account number copied");
                  }}
                >
                  <Copy className="mr-1 h-4 w-4" /> Copy Account No.
                </Button>
                <Link to="/transfer" search={{ beneficiaryId: viewing.id }} className="flex-1">
                  <Button className="w-full"><Send className="mr-1 h-4 w-4" /> Send Money</Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success */}
      <Dialog open={!!addedSuccess} onOpenChange={(o) => !o && setAddedSuccess(null)}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <DialogHeader className="mt-4">
              <DialogTitle className="text-center">Beneficiary Added Successfully</DialogTitle>
              <DialogDescription className="text-center">
                {addedSuccess} has been successfully registered.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 w-full space-y-2 rounded-xl bg-secondary/60 p-3 text-left text-xs text-muted-foreground">
              <p>As per bank security policy, transfers up to ₹25,000 will be allowed after 4 hours.</p>
              <p>Full transfer limit will be available after 24 hours.</p>
              <p className="font-medium text-foreground">Thank you for banking with us.</p>
            </div>
            <Button className="mt-4 w-full" onClick={() => setAddedSuccess(null)}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete beneficiary?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} will be removed from your payee list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => toDelete && deleteMut.mutate(toDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type FormVals = {
  name: string;
  account_number: string;
  confirm_account: string;
  ifsc: string;
  bank: string;
  customBank: string;
  nickname: string;
};

const EMPTY: FormVals = { name: "", account_number: "", confirm_account: "", ifsc: "", bank: "", customBank: "", nickname: "" };

function validate(v: FormVals) {
  const e: Partial<Record<keyof FormVals, string>> = {};
  if (v.name.trim().length < 2) e.name = "Enter the account holder's name (min. 2 characters)";
  else if (v.name.trim().length > 80) e.name = "Name must be 80 characters or less";
  if (!ACCOUNT_REGEX.test(v.account_number.trim())) e.account_number = "Enter a valid 9–18 digit account number";
  if (!v.confirm_account.trim()) e.confirm_account = "Re-enter the account number";
  else if (v.confirm_account.trim() !== v.account_number.trim()) e.confirm_account = "Account numbers do not match";
  if (!IFSC_REGEX.test(v.ifsc.trim().toUpperCase())) e.ifsc = "Invalid IFSC (e.g. CBIN0280001)";
  if (!v.bank) e.bank = "Select the beneficiary's bank";
  else if (v.bank === OTHER_BANK && v.customBank.trim().length < 3) e.customBank = "Enter the bank name";
  if (v.nickname.trim().length > 40) e.nickname = "Nickname must be 40 characters or less";
  return e;
}

function BeneficiaryFormDialog({
  open, onOpenChange, editing, onSubmit, pending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Beneficiary | null;
  onSubmit: (v: FormVals) => void;
  pending: boolean;
}) {
  const [vals, setVals] = useState<FormVals>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setTouched({});
    setVals(
      editing
        ? {
            name: editing.name,
            account_number: editing.account_number,
            confirm_account: editing.account_number,
            ifsc: editing.ifsc,
            bank: editing.bank_name && !INCLUDES(editing.bank_name) ? OTHER_BANK : editing.bank_name ?? "",
            customBank: editing.bank_name && !INCLUDES(editing.bank_name) ? editing.bank_name : "",
            nickname: editing.nickname ?? "",
          }
        : EMPTY,
    );
  }, [open, editing]);

  const errors = validate(vals);
  const isValid = Object.keys(errors).length === 0;
  const set = (k: keyof FormVals, v: string) => setVals((p) => ({ ...p, [k]: v }));
  const err = (k: keyof FormVals) => (touched[k] ? errors[k] : undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(vals).map((k) => [k, true])));
    if (isValid) onSubmit(vals);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Beneficiary" : "Add Beneficiary"}</DialogTitle>
          <DialogDescription>
            Enter the payee's bank details exactly as per their bank records.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Account Holder Name" error={err("name")} htmlFor="name" required>
            <Input
              id="name" value={vals.name} autoComplete="off"
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="As per bank records"
              className={err("name") ? "border-destructive" : ""}
            />
          </Field>

          <Field label="Account Number" error={err("account_number")} htmlFor="account_number" required>
            <Input
              id="account_number" inputMode="numeric" value={vals.account_number} autoComplete="off"
              onChange={(e) => set("account_number", e.target.value.replace(/\D/g, ""))}
              onBlur={() => setTouched((t) => ({ ...t, account_number: true }))}
              placeholder="9–18 digits"
              className={err("account_number") ? "border-destructive" : ""}
            />
          </Field>

          <Field label="Re-enter Account Number" error={err("confirm_account")} htmlFor="confirm_account" required>
            <Input
              id="confirm_account" inputMode="numeric" value={vals.confirm_account} autoComplete="off"
              onPaste={(e) => e.preventDefault()}
              onChange={(e) => set("confirm_account", e.target.value.replace(/\D/g, ""))}
              onBlur={() => setTouched((t) => ({ ...t, confirm_account: true }))}
              placeholder="Re-type to confirm"
              className={err("confirm_account") ? "border-destructive" : ""}
            />
          </Field>

          <Field label="IFSC Code" error={err("ifsc")} htmlFor="ifsc" required>
            <Input
              id="ifsc" value={vals.ifsc} autoComplete="off"
              onChange={(e) => set("ifsc", e.target.value.toUpperCase())}
              onBlur={() => setTouched((t) => ({ ...t, ifsc: true }))}
              placeholder="e.g. CBIN0280001"
              className={`uppercase ${err("ifsc") ? "border-destructive" : ""}`}
            />
          </Field>

          <Field label="Bank Name" error={err("bank")} required>
            <BankSelect
              value={vals.bank}
              invalid={!!err("bank")}
              onChange={(v) => { set("bank", v); setTouched((t) => ({ ...t, bank: true })); }}
            />
          </Field>

          {vals.bank === OTHER_BANK && (
            <Field label="Enter Bank Name" error={err("customBank")} htmlFor="customBank" required>
              <Input
                id="customBank" value={vals.customBank}
                onChange={(e) => set("customBank", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, customBank: true }))}
                placeholder="Type the bank name"
                className={err("customBank") ? "border-destructive" : ""}
              />
            </Field>
          )}

          <Field label="Nickname (optional)" error={err("nickname")} htmlFor="nickname">
            <Input
              id="nickname" value={vals.nickname}
              onChange={(e) => set("nickname", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, nickname: true }))}
              placeholder="e.g. Home rent"
            />
          </Field>

          <p className="flex gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Newly added beneficiaries can receive up to ₹25,000 after 4 hours; the full transfer limit is available after 24 hours.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending || !isValid}>
              {pending ? "Saving…" : editing ? "Update Beneficiary" : "Confirm & Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, error, htmlFor, required, children,
}: { label: string; error?: string; htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Helper kept out of render: is the stored bank part of the standard list?
import { INDIAN_BANKS } from "@/lib/indian-banks";
const INCLUDES = (b: string) => INDIAN_BANKS.includes(b);
