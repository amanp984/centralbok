import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil, Trash2, Star, Search, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useBeneficiaries, qk, type Beneficiary } from "@/hooks/use-banking-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { IFSC_REGEX, ACCOUNT_REGEX } from "@/lib/banking";

export const Route = createFileRoute("/_authenticated/beneficiaries")({
  head: () => ({ meta: [{ title: "Beneficiaries — Central Bank of India" }] }),
  component: BeneficiariesPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name required").max(80),
  nickname: z.string().trim().max(40).optional().or(z.literal("")),
  account_number: z.string().regex(ACCOUNT_REGEX, "9–18 digit account number"),
  ifsc: z.string().toUpperCase().regex(IFSC_REGEX, "Invalid IFSC code"),
});
type FormVals = z.infer<typeof schema>;

function BeneficiariesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: beneficiaries, isLoading } = useBeneficiaries(user?.id);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Beneficiary | null>(null);

  const filtered = (beneficiaries ?? []).filter((b) => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || b.account_number.includes(q) || b.ifsc.toLowerCase().includes(q) || (b.nickname ?? "").toLowerCase().includes(q);
  });

  const saveMut = useMutation({
    mutationFn: async (vals: FormVals & { id?: string }) => {
      const payload = { name: vals.name, nickname: vals.nickname || null, account_number: vals.account_number, ifsc: vals.ifsc.toUpperCase(), user_id: user!.id };
      if (vals.id) {
        const { error } = await supabase.from("beneficiaries").update(payload).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("beneficiaries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Beneficiary updated" : "Beneficiary added"); setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: qk.beneficiaries(user!.id) }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("beneficiaries").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Beneficiary removed"); setToDelete(null); qc.invalidateQueries({ queryKey: qk.beneficiaries(user!.id) }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const favMut = useMutation({
    mutationFn: async (b: Beneficiary) => { const { error } = await supabase.from("beneficiaries").update({ is_favourite: !b.is_favourite }).eq("id", b.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.beneficiaries(user!.id) }),
  });

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)]">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-border">
          <div>
            <div className="text-sm text-muted-foreground">{beneficiaries?.length ?? 0} of 12 beneficiaries</div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payees…" className="pl-9" />
            </div>
            <Button onClick={() => { setEditing(null); setOpen(true); }} disabled={(beneficiaries?.length ?? 0) >= 12}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? "No matches." : "No beneficiaries yet. Add one to get started."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((b) => (
                <div key={b.id} className="border border-border rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
                  <button onClick={() => favMut.mutate(b)} className="mt-1" aria-label="Toggle favourite">
                    <Star className={`w-5 h-5 ${b.is_favourite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{b.name}</div>
                    {b.nickname && <div className="text-xs text-muted-foreground">{b.nickname}</div>}
                    <div className="text-xs text-muted-foreground mt-1 font-mono">{b.account_number} • {b.ifsc}</div>
                  </div>
                  <div className="flex gap-1">
                    <Link to="/transfer" search={{ beneficiaryId: b.id }}>
                      <Button size="icon" variant="ghost" title="Send money"><Send className="w-4 h-4" /></Button>
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }} title="Edit"><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setToDelete(b)} title="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BeneficiaryFormDialog
        open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        editing={editing} onSubmit={(v) => saveMut.mutate({ ...v, id: editing?.id })} pending={saveMut.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete beneficiary?</AlertDialogTitle>
            <AlertDialogDescription>Remove {toDelete?.name} from your payee list. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => toDelete && deleteMut.mutate(toDelete.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BeneficiaryFormDialog({
  open, onOpenChange, editing, onSubmit, pending,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Beneficiary | null; onSubmit: (v: FormVals) => void; pending: boolean }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormVals>({
    values: editing ? { name: editing.name, nickname: editing.nickname ?? "", account_number: editing.account_number, ifsc: editing.ifsc } : { name: "", nickname: "", account_number: "", ifsc: "" },
    resolver: async (data) => {
      const r = schema.safeParse(data);
      if (r.success) return { values: r.data, errors: {} };
      const fieldErrors: Record<string, { message: string; type: string }> = {};
      r.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = { message: i.message, type: "validation" }; });
      return { values: {}, errors: fieldErrors as never };
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Beneficiary" : "Add Beneficiary"}</DialogTitle>
          <DialogDescription>Enter the payee's bank details. Cooling-off period applies for first transfer.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Beneficiary Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="nickname">Nickname (optional)</Label>
            <Input id="nickname" {...register("nickname")} />
          </div>
          <div>
            <Label htmlFor="account_number">Account Number</Label>
            <Input id="account_number" inputMode="numeric" {...register("account_number")} />
            {errors.account_number && <p className="text-xs text-destructive mt-1">{errors.account_number.message}</p>}
          </div>
          <div>
            <Label htmlFor="ifsc">IFSC Code</Label>
            <Input id="ifsc" className="uppercase" {...register("ifsc")} />
            {errors.ifsc && <p className="text-xs text-destructive mt-1">{errors.ifsc.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
