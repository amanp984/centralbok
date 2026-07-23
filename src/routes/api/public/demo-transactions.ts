import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/demo-transactions")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { DEMO_USER_ID } = await import("@/lib/demo-user");

          const { data, error } = await supabaseAdmin
            .from("transactions")
            .select("*")
            .eq("user_id", DEMO_USER_ID)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("[demo-transactions] failed to load", error);
            return json({ ok: false, error: error.message }, 500);
          }

          return json({ ok: true, data: data ?? [] });
        } catch (err) {
          console.error("[demo-transactions] unexpected error", err);
          return json({ ok: false, error: (err as Error).message }, 500);
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
