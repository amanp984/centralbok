import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_USER_ID } from "@/lib/demo-user";
import {
  buildTransactionDescription,
  demoTransactionSchema,
  directionForTransactionType,
} from "@/lib/demo-transaction-builder";

export const addDemoTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => demoTransactionSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (context.userId !== DEMO_USER_ID) {
      throw new Response("Demo administration is not available for this account", { status: 403 });
    }

    const { data: account, error: accountError } = await context.supabase
      .from("accounts")
      .select("id")
      .eq("user_id", context.userId)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account) throw new Error("Primary demo account not found");

    const description = buildTransactionDescription(data);
    const { data: transaction, error } = await context.supabase
      .from("transactions")
      .insert({
        user_id: context.userId,
        account_id: account.id,
        amount: data.amount,
        direction: directionForTransactionType(data.transactionType),
        mode: data.paymentMode === "Other" ? "OTHER" : data.paymentMode,
        description,
        reference: data.reference,
        beneficiary_name: data.name.trim() || null,
        beneficiary_account: data.accountNumber.trim() || (data.accountSuffix.trim() ? `XXXX${data.accountSuffix.trim()}` : null),
        beneficiary_ifsc: data.ifsc.trim().toUpperCase() || null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return transaction;
  });
