import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_PROFILE, DEMO_USER_ID } from "@/lib/demo-user";
import { demoProfileUpdateSchema, demoTransactionChangeSchema } from "@/lib/demo-admin-schema";

function assertDemoAdmin(userId: string) {
  if (userId !== DEMO_USER_ID) {
    throw new Response("Demo administration is not available for this account", { status: 403 });
  }
}

export const getDemoAdminProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertDemoAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile, error: profileError }, { data: account, error: accountError }, { data: login, error: loginError }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      supabaseAdmin.from("accounts").select("*").eq("user_id", context.userId).eq("is_primary", true).limit(1).maybeSingle(),
      supabaseAdmin.from("demo_login_config").select("username").eq("user_id", context.userId).maybeSingle(),
    ]);
    if (profileError) throw profileError;
    if (accountError) throw accountError;
    if (loginError) throw loginError;
    return {
      profile,
      account,
      username: login?.username ?? process.env["DEMO_LOGIN_USERNAME"] ?? "",
      defaults: {
        fullName: DEMO_PROFILE.fullName,
        email: DEMO_PROFILE.email,
        mobile: DEMO_PROFILE.mobile,
        customerId: DEMO_PROFILE.customerId,
        address: DEMO_PROFILE.address,
        branch: DEMO_PROFILE.branch,
        branchAddress: "",
      },
    };
  });

export const saveDemoAdminProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => demoProfileUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertDemoAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashDemoPassword } = await import("@/lib/demo-login-crypto.server");
    const { data: oldLogin, error: loginReadError } = await supabaseAdmin
      .from("demo_login_config")
      .select("password_salt,password_hash")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (loginReadError) throw loginReadError;

    const profileValues = {
      full_name: data.fullName,
      email: data.email,
      mobile: data.mobile,
      customer_id: data.customerId,
      branch: data.branch,
      branch_address: data.branchAddress,
      communication_address: data.communicationAddress,
    };
    const accountValues = {
      account_number: data.accountNumber,
      account_type: data.accountType,
      ifsc: data.ifsc,
    };

    let passwordSalt = oldLogin?.password_salt;
    let passwordHash = oldLogin?.password_hash;
    if (data.password) {
      const hashed = await hashDemoPassword(data.password);
      passwordSalt = hashed.salt;
      passwordHash = hashed.hash;
    } else if (!passwordSalt || !passwordHash) {
      const existingPassword = process.env["DEMO_LOGIN_PASSWORD"];
      if (!existingPassword) throw new Error("Enter a new demo password before saving these changes.");
      const hashed = await hashDemoPassword(existingPassword);
      passwordSalt = hashed.salt;
      passwordHash = hashed.hash;
    }

    const { error } = await supabaseAdmin.rpc("save_demo_admin_profile", {
      p_user_id: context.userId,
      p_profile: profileValues,
      p_account: accountValues,
      p_login: {
      username: data.username,
      password_salt: passwordSalt,
      password_hash: passwordHash,
        password_changed: Boolean(data.password),
      },
    });
    if (error) throw error;

    return { ok: true as const };
  });

export const changeDemoTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => demoTransactionChangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    assertDemoAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("change_demo_transaction", {
      p_user_id: context.userId,
      p_action: data.action,
      p_transaction_id: data.id ?? "00000000-0000-0000-0000-000000000000",
      p_transaction: {
        amount: data.amount,
        direction: data.direction,
        mode: data.mode,
        beneficiary_name: data.beneficiaryName?.trim() ?? "",
        upi_id: data.upiId?.trim() ?? "",
        beneficiary_account: data.beneficiaryAccount?.trim() ?? "",
        beneficiary_ifsc: data.beneficiaryIfsc?.trim().toUpperCase() ?? "",
        reference: data.reference,
        description: data.description,
        created_at: data.createdAt,
      },
    });
    if (error) throw error;
    const resultRecord = result && typeof result === "object" ? result as { id?: string } : {};
    return { ok: true as const, id: resultRecord.id ?? data.id ?? "" };
  });