import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
 * Subscribe once (at the app shell) to realtime changes for the user's
 * banking tables and invalidate the corresponding Query caches. Replaces
 * 30s polling everywhere.
 */
export function useBankingRealtime(userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    // Private channel: realtime.messages RLS restricts the topic
    // `banking:<uid>` to its owner, so other authenticated users cannot
    // subscribe to this user's account/transaction/beneficiary stream.
    const channel = supabase
      .channel(`banking:${userId}`, { config: { private: true } })
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: qk.transactions(userId) });
        qc.invalidateQueries({ queryKey: qk.accounts(userId) });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts", filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: qk.accounts(userId) });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "beneficiaries", filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: qk.beneficiaries(userId) });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}
