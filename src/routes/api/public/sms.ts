import { createFileRoute } from "@tanstack/react-router";
import { parseSms, formatParsedSms } from "@/lib/sms-parser";

/**
 * Public SMS Forwarder webhook.
 *
 *   POST /api/sms
 *   { "message": "Rs 1500 sent via IMPS from A/c XX8572 to Suraj Sharma A/c XX6292. UTR 123456789012." }
 *
 * Architecture:
 *   SMS → Forwarder APK → /api/sms → parser → DB insert → realtime → UI
 *
 * For now the endpoint parses, optionally inserts a transaction (debit/credit)
 * against the demo primary account and returns the structured payload.
 * Wire your forwarder later — no external services are connected yet.
 */
export const Route = createFileRoute("/api/public/sms")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          JSON.stringify({
            ok: true,
            endpoint: "/api/public/sms",
            method: "POST",
            body: { message: "string" },
            note: "Forward bank SMS bodies here. Returns parsed { direction, mode, counterparty, reference, amount }.",
          }),
          { headers: { "content-type": "application/json" } },
        ),

      POST: async ({ request }) => {
        // Shared-secret check — reject anonymous callers. The forwarder must
        // send `x-webhook-secret: <SMS_WEBHOOK_SECRET>`. Without a configured
        // server secret the endpoint refuses all writes (fail closed).
        const expected = process.env.SMS_WEBHOOK_TEST;
        const provided = request.headers.get("x-webhook-secret") ?? "";
        // Diagnostic — does not leak the value
        console.log(
          "[sms] env.SMS_WEBHOOK_TEST set:",
          typeof expected === "string",
          "expected.length:",
          expected?.length ?? 0,
          "expected.trimmed.length:",
          expected?.trim().length ?? 0,
          "expected.startsWithWs:",
          expected ? /^\s/.test(expected) : false,
          "expected.endsWithWs:",
          expected ? /\s$/.test(expected) : false,
          "provided.length:",
          provided.length,
          "env keys with SMS:",
          Object.keys(process.env).filter((k) => k.includes("SMS")).join(","),
        );
        if (!expected) {
          return json(
            { ok: false, error: "Webhook secret not configured on server" },
            503,
          );
        }
        if (provided.length !== expected.length || provided !== expected) {
          return json({ ok: false, error: "Unauthorized" }, 401);
        }

        let body: { message?: string } = {};
        try {
          body = (await request.json()) as { message?: string };
        } catch {
          return json({ ok: false, error: "Invalid JSON body" }, 400);
        }

        const message = (body?.message ?? "").trim();
        if (!message) return json({ ok: false, error: "Missing 'message'" }, 400);

        const parsed = parseSms(message);
        if (!parsed) {
          return json({ ok: false, error: "Could not parse SMS", raw: message }, 422);
        }

        const display = formatParsedSms(parsed);

        // Best-effort persistence using the service role client. If the demo
        // primary account is not found, we still return the parsed payload
        // so the forwarder can debug end-to-end without writing to the DB.
        let persisted: unknown = null;
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data: primary } = await supabaseAdmin
            .from("accounts")
            .select("id,user_id,balance")
            .eq("user_id", "00000000-0000-0000-0000-0000000000d1")
            .eq("is_primary", true)
            .limit(1)
            .maybeSingle();

          if (primary) {
            const newBalance =
              parsed.direction === "CREDIT"
                ? Number(primary.balance) + parsed.amount
                : Number(primary.balance) - parsed.amount;

            await supabaseAdmin
              .from("accounts")
              .update({ balance: newBalance })
              .eq("id", primary.id);

            const { data: tx } = await supabaseAdmin
              .from("transactions")
              .insert({
                user_id: primary.user_id,
                account_id: primary.id,
                amount: parsed.amount,
                direction: parsed.direction === "CREDIT" ? "credit" : "debit",
                mode: parsed.mode,
                description: display,
                reference: parsed.reference ?? `SMS-${Date.now()}`,
                running_balance: newBalance,
                beneficiary_name: parsed.counterparty || null,
                beneficiary_account: parsed.counterpartyAccount ?? null,
                beneficiary_ifsc: null,
              })
              .select()
              .single();
            persisted = tx;
          }
        } catch (err) {
          // Persistence is best-effort — return parser output regardless.
          persisted = { error: (err as Error).message };
        }

        return json({ ok: true, parsed, display, persisted });
      },
    },
  },
});

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}
