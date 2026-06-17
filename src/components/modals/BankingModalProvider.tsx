import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Smartphone, XCircle } from "lucide-react";

type TransferConfirmPayload = {
  beneficiary: string;
  account: string;
  ifsc: string;
  amount: number;
  mode: string;
  onConfirm: () => void | Promise<void>;
};

type CardSuccessPayload = { title: string; message: string };
type RegisterFailedPayload = { reason?: string };

type ModalState =
  | { kind: "mobile-only" }
  | { kind: "register-failed"; data: RegisterFailedPayload }
  | { kind: "card-success"; data: CardSuccessPayload }
  | { kind: "transfer-confirm"; data: TransferConfirmPayload }
  | null;

type Ctx = {
  showMobileOnly: () => void;
  showRegisterFailed: (data?: RegisterFailedPayload) => void;
  showCardSuccess: (data: CardSuccessPayload) => void;
  showTransferConfirm: (data: TransferConfirmPayload) => void;
  close: () => void;
};

const BankingModalCtx = createContext<Ctx | null>(null);

export function useBankingModal() {
  const ctx = useContext(BankingModalCtx);
  if (!ctx) throw new Error("useBankingModal must be used inside BankingModalProvider");
  return ctx;
}

export function BankingModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);

  const close = useCallback(() => setState(null), []);

  const value: Ctx = {
    showMobileOnly: () => setState({ kind: "mobile-only" }),
    showRegisterFailed: (data) => setState({ kind: "register-failed", data: data ?? {} }),
    showCardSuccess: (data) => setState({ kind: "card-success", data }),
    showTransferConfirm: (data) => setState({ kind: "transfer-confirm", data }),
    close,
  };

  return (
    <BankingModalCtx.Provider value={value}>
      {children}

      <Dialog open={state?.kind === "mobile-only"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Available on Mobile Only</DialogTitle>
            <DialogDescription className="text-center">
              This feature is currently only accessible from our official mobile app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={close}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={state?.kind === "register-failed"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Registration Failed</DialogTitle>
            <DialogDescription className="text-center">
              {state?.kind === "register-failed" ? state.data.reason ?? "We could not complete your registration. Please try again later." : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={close}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={state?.kind === "card-success"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <DialogTitle className="text-center">
              {state?.kind === "card-success" ? state.data.title : ""}
            </DialogTitle>
            <DialogDescription className="text-center">
              {state?.kind === "card-success" ? state.data.message : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={close}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={state?.kind === "transfer-confirm"} onOpenChange={(o) => !o && !busy && close()}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <DialogTitle className="text-center">Confirm Transfer</DialogTitle>
            <DialogDescription className="text-center">
              Please verify the details before authorising the transfer.
            </DialogDescription>
          </DialogHeader>
          {state?.kind === "transfer-confirm" && (
            <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2 text-sm">
              <Row label="Beneficiary" value={state.data.beneficiary} />
              <Row label="Account" value={state.data.account} />
              <Row label="IFSC" value={state.data.ifsc} />
              <Row label="Mode" value={state.data.mode} />
              <Row label="Amount" value={`₹ ${state.data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} strong />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={close}>Cancel</Button>
            <Button
              className="flex-1"
              disabled={busy}
              onClick={async () => {
                if (state?.kind !== "transfer-confirm") return;
                try {
                  setBusy(true);
                  await state.data.onConfirm();
                  close();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Processing…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BankingModalCtx.Provider>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold text-foreground" : "text-foreground font-medium"}>{value}</span>
    </div>
  );
}
