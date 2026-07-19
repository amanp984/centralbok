import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeRunningBalances, type WithComputedBalance } from "@/lib/banking";

export type Account = {
  id: string;
  user_id: string;
  account_number: string;
  account_type: string;
  ifsc: string;
  balance: number;
  is_primary: boolean;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  direction: "credit" | "debit";
  mode: string;
  description: string | null;
  reference: string;
  running_balance: number | null;
  beneficiary_name: string | null;
  beneficiary_account: string | null;
  beneficiary_ifsc: string | null;
  created_at: string;
};

export type Beneficiary = {
  id: string;
  user_id: string;
  name: string;
  account_number: string;
  ifsc: string;
  nickname: string | null;
  is_favourite: boolean;
  created_at: string;
};

export const qk = {
  accounts: (uid: string) => ["accounts", uid] as const,
  transactions: (uid: string) => ["transactions", uid] as const,
  beneficiaries: (uid: string) => ["beneficiaries", uid] as const,
};

export function useAccounts(userId: string | undefined) {
  return useQuery({
    queryKey: qk.accounts(userId ?? ""),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });
}

export function useTransactions(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: [...qk.transactions(userId ?? ""), { limit }],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export function useBeneficiaries(userId: string | undefined) {
  return useQuery({
    queryKey: qk.beneficiaries(userId ?? ""),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("is_favourite", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Beneficiary[];
    },
  });
}

/**
 * Fetch ALL transactions for the user and compute an authoritative running
 * balance client-side (oldest → newest). Any stored `running_balance` on the
 * DB rows is ignored — the computed value is the single source of truth for
 * every UI surface (dashboard, statements, exports).
 */
export type TransactionWithBalance = WithComputedBalance<Transaction>;

export function useTransactionsWithBalances(userId: string | undefined) {
  return useQuery({
    queryKey: ["transactions", "with-balances", userId ?? ""] as const,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const txs = (data ?? []) as Transaction[];
      return computeRunningBalances<Transaction>(txs, 0);
    },
  });
}

/**
 * Subscribe (once at the app shell) to realtime changes for the user's
 * banking tables and invalidate any related Query caches. Falls back to
 * a lightweight 2.5s polling loop whenever the realtime channel is not
 * in the SUBSCRIBED state.
 */
export function useBankingRealtime(userId: string | undefined) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const invalidateAll = () => {
      // Invalidate every transactions/accounts/beneficiaries-derived query
      // (dashboard, statements custom range, etc.) via predicate.
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey?.[0];
          return k === "transactions" || k === "accounts" || k === "beneficiaries" || k === "statement";
        },
      });
    };

    const channel = supabase
      .channel(`banking:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, invalidateAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts", filter: `user_id=eq.${userId}` }, invalidateAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "beneficiaries", filter: `user_id=eq.${userId}` }, invalidateAll)
      .subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        connectedRef.current = ok;
        setConnected(ok);
      });

    // Fallback background poll (every 2.5s) whenever realtime is not
    // currently connected. Cheap: invalidateQueries is a no-op for
    // inactive queries and only refetches ones that are mounted.
    const poll = setInterval(() => {
      if (!connectedRef.current) invalidateAll();
    }, 2500);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return { connected };
}
