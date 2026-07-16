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
        // TODO(security): Re-enable x-webhook-secret validation before
        // production. Auth is temporarily disabled to unblock SMS Forwarder
        // end-to-end testing in the dev environment. Restore the
        // shared-secret check (compare request header `x-webhook-secret`
        // against `process.env.SMS_WEBHOOK_SECRET` with a length-safe
        // equality check, fail closed when the env var is missing) before
        // exposing this endpoint to the public internet.

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
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { data: primary, error: acctErr } = await supabaseAdmin
            .from("accounts")
            .select("id,user_id,balance")
            .eq("user_id", "00000000-0000-0000-0000-0000000000d1")
            .eq("is_primary", true)
            .limit(1)
            .maybeSingle();

          if (acctErr) {
            console.error("[sms webhook] account lookup failed", acctErr);
            return json({ ok: false, stage: "account_lookup", error: acctErr.message, parsed }, 500);
          }
          if (!primary) {
            return json(
              { ok: false, stage: "account_lookup", error: "Demo primary account not found. Seed it first.", parsed },
              500,
            );
          }

          const newBalance =
            parsed.direction === "CREDIT"
              ? Number(primary.balance) + parsed.amount
              : Number(primary.balance) - parsed.amount;

          const { error: updErr } = await supabaseAdmin
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", primary.id);
          if (updErr) {
            console.error("[sms webhook] balance update failed", updErr);
            return json({ ok: false, stage: "balance_update", error: updErr.message, parsed }, 500);
          }

          const { data: tx, error: insErr } = await supabaseAdmin
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

          if (insErr) {
            console.error("[sms webhook] transaction insert failed", insErr);
            return json({ ok: false, stage: "transaction_insert", error: insErr.message, parsed }, 500);
          }

          return json({ ok: true, parsed, display, persisted: tx });
        } catch (err) {
          console.error("[sms webhook] unexpected error", err);
          return json(
            { ok: false, stage: "exception", error: (err as Error).message, parsed },
            500,
          );
        }

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
