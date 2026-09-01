import { z } from "zod";

export const transactionTypes = ["Credit", "Debit", "Refund"] as const;
export const paymentModes = ["UPI", "IMPS", "NEFT", "RTGS", "TFR", "Other"] as const;

export type TransactionType = (typeof transactionTypes)[number];
export type PaymentMode = (typeof paymentModes)[number];

export const demoTransactionSchema = z.object({
  transactionType: z.enum(transactionTypes),
  paymentMode: z.enum(paymentModes),
  amount: z.number().finite().positive().max(100_000_000),
  name: z.string().trim().min(1).max(120),
  upiId: z.string().trim().max(120),
  accountSuffix: z.string().trim().regex(/^\d{4}$/, "Account suffix must be 4 digits").or(z.literal("")),
  reference: z.string().trim().min(3).max(80),
  accountNumber: z.string().trim().regex(/^\d{9,18}$/, "Account number must be 9–18 digits").or(z.literal("")),
  ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC").or(z.literal("")),
  bankDetails: z.string().trim().max(160),
}).superRefine((value, ctx) => {
  const needsName = value.paymentMode !== "Other" || value.transactionType === "Refund";
  if (needsName && !value.name.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name"], message: "Name is required" });
  }
  if ((value.paymentMode === "UPI" || value.paymentMode === "IMPS") && !value.accountSuffix) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["accountSuffix"], message: "Account suffix is required" });
  }
  if (value.paymentMode === "UPI" && !value.upiId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["upiId"], message: "UPI ID is required" });
  }
  if (["NEFT", "RTGS", "TFR"].includes(value.paymentMode) && !value.accountNumber) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["accountNumber"], message: "Account number is required" });
  }
  if (["NEFT", "RTGS"].includes(value.paymentMode) && !value.ifsc) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ifsc"], message: "IFSC is required" });
  }
});

export type DemoTransactionInput = z.infer<typeof demoTransactionSchema>;

const modeLabel = (mode: PaymentMode) => mode === "Other" ? "OTHER" : mode;

export function buildTransactionDescription(input: DemoTransactionInput): string {
  const action = input.transactionType.toUpperCase();
  const mode = modeLabel(input.paymentMode);
  const parts = [`${action} via ${mode}`, `Amount ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(input.amount)}`];

  if (input.name.trim()) parts.push(`Name ${input.name.trim()}`);
  if (input.upiId.trim()) parts.push(`UPI ${input.upiId.trim()}`);
  if (input.accountSuffix.trim()) parts.push(`A/c XX${input.accountSuffix.trim()}`);
  if (input.accountNumber.trim()) parts.push(`A/c ${input.accountNumber.trim()}`);
  if (input.ifsc.trim()) parts.push(`IFSC ${input.ifsc.trim().toUpperCase()}`);
  if (input.reference.trim()) parts.push(`Ref ${input.reference.trim()}`);
  if (input.bankDetails.trim()) parts.push(input.bankDetails.trim());

  return parts.join(" • ");
}

export function directionForTransactionType(type: TransactionType): "credit" | "debit" {
  return type === "Debit" ? "debit" : "credit";
}
