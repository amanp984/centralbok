import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyDemoLoginCredentials = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ username: z.string().max(128), password: z.string().max(256) }).parse(input),
  )
  .handler(async ({ data }) => {
    const expectedUsername = process.env["DEMO_LOGIN_USERNAME"];
    const expectedPassword = process.env["DEMO_LOGIN_PASSWORD"];

    if (!expectedUsername || !expectedPassword) return false;
    return data.username === expectedUsername && data.password === expectedPassword;
  });
