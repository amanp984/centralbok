import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEMO_USER_ID } from "@/lib/demo-user";

export const verifyDemoLoginCredentials = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ username: z.string().max(128), password: z.string().max(256) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyDemoPassword } = await import("@/lib/demo-login-crypto.server");
    const { data: configured, error } = await supabaseAdmin
      .from("demo_login_config")
      .select("username,password_salt,password_hash")
      .eq("user_id", DEMO_USER_ID)
      .maybeSingle();
    if (error) throw new Error("Unable to verify your sign-in.");
    if (configured) {
      if (data.username !== configured.username) return false;
      return verifyDemoPassword(data.password, configured.password_salt, configured.password_hash);
    }
    const expectedUsername = process.env["DEMO_LOGIN_USERNAME"];
    const expectedPassword = process.env["DEMO_LOGIN_PASSWORD"];

    if (!expectedUsername || !expectedPassword) return false;
    return data.username === expectedUsername && data.password === expectedPassword;
  });
