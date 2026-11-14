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

    const description = buildTransactionDescription(data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("change_demo_transaction", {
      p_user_id: context.userId,
      p_action: "add",
      p_transaction_id: "00000000-0000-0000-0000-000000000000",
      p_transaction: {
        amount: data.amount,
        direction: directionForTransactionType(data.transactionType),
        mode: data.paymentMode === "Other" ? "OTHER" : data.paymentMode,
        beneficiary_name: data.name.trim(),
        upi_id: data.upiId.trim(),
        beneficiary_account: data.accountNumber.trim() || (data.accountSuffix.trim() ? `XXXX${data.accountSuffix.trim()}` : ""),
        beneficiary_ifsc: data.ifsc.trim().toUpperCase(),
        reference: data.reference.trim(),
        description,
        created_at: new Date().toISOString(),
      },
    });
    if (error) throw error;
    return result;
  });
