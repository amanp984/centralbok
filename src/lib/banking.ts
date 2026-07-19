export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

export const maskAccount = (acc: string) =>
  acc.length <= 4 ? acc : `XXXX XXXX ${acc.slice(-4)}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_REGEX = /^\d{9,18}$/;

/**
 * Compute running balances by walking transactions oldest → newest.
 * Ignores any stored running_balance on the input rows. Returns items
 * in ascending (oldest-first) order with an authoritative `computed_balance`
 * field on each item, plus the final balance after all transactions.
 */
export type WithComputedBalance<T> = T & { computed_balance: number };

export function computeRunningBalances<
  T extends { created_at: string; amount: number | string; direction: "credit" | "debit" }
>(transactions: readonly T[], openingBalance = 0): { items: WithComputedBalance<T>[]; finalBalance: number } {
  const asc = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  let bal = Number(openingBalance) || 0;
  const items = asc.map((t) => {
    const amt = Number(t.amount) || 0;
    bal = t.direction === "credit" ? bal + amt : bal - amt;
    return { ...t, computed_balance: Math.round(bal * 100) / 100 };
  });
  return { items, finalBalance: Math.round(bal * 100) / 100 };
}
