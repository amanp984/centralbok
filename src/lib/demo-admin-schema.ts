import { z } from "zod";

export const DEFAULT_DEMO_STATEMENT_TITLE = "DEMO STATEMENT OF ACCOUNT";
export const DEFAULT_DEMO_STATEMENT_DISCLOSURE = "DEMO RECORD – NOT BANK-ISSUED OR BANK-VERIFIED";
export const demoStatementTitleSchema = z.string().trim().min(1, "Enter a statement title").max(80, "Use 80 characters or fewer");
export const demoStatementDisclosureSchema = z
  .string()
  .trim()
  .min(1, "A visible demo disclosure is required")
  .max(160, "Use 160 characters or fewer")
  .refine((text) => {
    const normalized = text.toLowerCase();
    return normalized.includes("demo")
      && /\bnot\s+bank[-\s]issued\b/.test(normalized)
      && (/\bnot\s+bank[-\s]verified\b/.test(normalized) || /\bor\s+bank[-\s]verified\b/.test(normalized));
  }, "Include that this is a demo and is not bank-issued or bank-verified");

export function resolveDemoStatementDisclosure(configuredText?: string) {
  const candidate = configuredText ?? DEFAULT_DEMO_STATEMENT_DISCLOSURE;
  const parsed = demoStatementDisclosureSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_DEMO_STATEMENT_DISCLOSURE;
}

const optionalText = (max: number) => z.string().trim().max(max);

export const demoProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  mobile: optionalText(32),
  customerId: optionalText(64),
  accountNumber: z.string().trim().regex(/^\d{9,18}$/, "Enter a 9–18 digit account number"),
  accountType: z.string().trim().min(1).max(40),
  ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC code"),
  branch: optionalText(120),
  branchAddress: optionalText(240),
  communicationAddress: optionalText(500),
  username: z.string().trim().min(1).max(128),
  password: z.string().max(256).refine((value) => value.length === 0 || value.length >= 8, "Use at least 8 characters for a new password").optional().default(""),
});

export const demoTransactionChangeSchema = z.object({
  action: z.enum(["add", "update", "delete"]),
  id: z.string().uuid().optional(),
  amount: z.number().finite().positive().max(100_000_000).optional(),
  direction: z.enum(["credit", "debit"]).optional(),
  mode: z.enum(["UPI", "IMPS", "NEFT", "RTGS", "TFR", "TRANSFER", "DEPOSIT", "WITHDRAWAL", "OTHER"]).optional(),
  beneficiaryName: optionalText(120).optional(),
  upiId: optionalText(120).optional(),
  beneficiaryAccount: optionalText(32).optional(),
  beneficiaryIfsc: optionalText(11).optional(),
  reference: z.string().trim().min(3).max(80).optional(),
  description: z.string().trim().min(1).max(240).optional(),
  createdAt: z.string().datetime({ offset: true }).optional(),
}).superRefine((input, ctx) => {
  if (input.action !== "delete") {
    for (const key of ["amount", "direction", "mode", "reference", "description", "createdAt"] as const) {
      if (input[key] === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: "This field is required" });
      }
    }
  }
  if (input.action !== "add" && !input.id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["id"], message: "Transaction is required" });
  }
  if (input.beneficiaryIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(input.beneficiaryIfsc)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["beneficiaryIfsc"], message: "Enter a valid IFSC code" });
  }
  if (input.action === "add" && input.mode === "UPI" && !input.upiId?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["upiId"], message: "UPI ID is required for a new UPI transaction" });
  }
  if (input.action === "add" && ["IMPS", "NEFT"].includes(input.mode ?? "")) {
    if (!/^[0-9]{9,18}$/.test(input.beneficiaryAccount ?? "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["beneficiaryAccount"], message: "Enter a 9–18 digit recipient account number" });
    }
    if (!input.beneficiaryIfsc?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["beneficiaryIfsc"], message: "IFSC is required for this transfer" });
    }
  }
  if (input.action === "add" && !input.beneficiaryName?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["beneficiaryName"], message: "Sender or beneficiary name is required" });
  }
});

export type DemoProfileUpdate = z.infer<typeof demoProfileUpdateSchema>;
export type DemoTransactionChange = z.infer<typeof demoTransactionChangeSchema>;