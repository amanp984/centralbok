// SMS Parser Utility — prepared for future SMS Forwarder webhook integration.
// Pure functions; no side effects. Connect to a webhook later.

export type ParsedSms = {
  direction: "DEBIT" | "CREDIT";
  mode: "IMPS" | "NEFT" | "RTGS" | "UPI" | "TRANSFER";
  amount: number;
  counterparty: string;
  counterpartyAccount?: string;
  reference?: string; // UTR / Ref no
  accountLast4?: string; // own account
  raw: string;
};

const num = (s: string) => Number(s.replace(/,/g, ""));

/** Parse a bank SMS string. Returns null if not recognised. */
export function parseSms(input: string): ParsedSms | null {
  const sms = input.replace(/\s+/g, " ").trim();
  const upper = sms.toUpperCase();

  // Amount
  const amtMatch = sms.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d+)?)/i);
  if (!amtMatch) return null;
  const amount = num(amtMatch[1]);

  // Direction
  const isDebit = /\b(sent|debited|paid|withdrawn|transferred to)\b/i.test(sms);
  const isCredit = /\b(received|credited|deposit(?:ed)?|added)\b/i.test(sms);
  const direction: "DEBIT" | "CREDIT" = isCredit && !isDebit ? "CREDIT" : "DEBIT";

  // Mode
  let mode: ParsedSms["mode"] = "TRANSFER";
  if (upper.includes("IMPS")) mode = "IMPS";
  else if (upper.includes("UPI")) mode = "UPI";
  else if (upper.includes("RTGS")) mode = "RTGS";
  else if (upper.includes("NEFT")) mode = "NEFT";

  // Own account last 4 (A/c XX1234 / A/c XXXX1234)
  const ownMatch = sms.match(/(?:in\s+)?A\/c\s*X+(\d{4})/i);
  const accountLast4 = ownMatch?.[1];

  // Reference / UTR / Ref No
  const refMatch =
    sms.match(/\bUTR[:\s]*([A-Z0-9]{8,})/i) ??
    sms.match(/\bRef(?:erence)?\s*(?:No\.?|#)?[:\s]*([A-Z0-9]{6,})/i) ??
    sms.match(/\bTxn(?:\s*ID)?[:\s]*([A-Z0-9]{6,})/i);
  const reference = refMatch?.[1];

  // Counterparty
  let counterparty = "";
  let counterpartyAccount: string | undefined;

  // Pattern: from/to <Name> A/c XX####
  const partyAcct = sms.match(/(?:from|to)\s+([A-Za-z][A-Za-z .&'-]{1,60}?)\s+A\/c\s*(X+\d{2,6})/i);
  if (partyAcct) {
    counterparty = partyAcct[1].trim();
    counterpartyAccount = partyAcct[2].toUpperCase();
  } else {
    // Pattern: from/to <Name>. Ref...
    const party = sms.match(/(?:from|to)\s+([A-Za-z][A-Za-z .&'-]{1,60}?)(?=\s*(?:\.|,|;|UTR|Ref|UPI|IMPS|RTGS|NEFT|$))/i);
    if (party) counterparty = party[1].trim();
  }

  return {
    direction,
    mode,
    amount,
    counterparty: counterparty.toUpperCase().trim(),
    counterpartyAccount,
    reference,
    accountLast4,
    raw: sms,
  };
}

/** Format a parsed SMS into the display string used in transaction lists. */
export function formatParsedSms(p: ParsedSms): string {
  const parts = [p.direction, p.mode, p.counterparty || "UNKNOWN"];
  if (p.counterpartyAccount) parts.push(`A/C ${p.counterpartyAccount}`);
  if (p.reference) parts.push(`UTR ${p.reference}`);
  return parts.filter(Boolean).join(" / ");
}

/**
 * Apply a parsed SMS to a running balance. Credits increase, debits decrease.
 * Future webhook can call this to keep the local ledger in sync.
 */
export function applySmsToBalance(currentBalance: number, p: ParsedSms): number {
  return p.direction === "CREDIT" ? currentBalance + p.amount : currentBalance - p.amount;
}
