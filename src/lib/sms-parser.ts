// SMS Parser Utility — tolerant bank-transaction SMS parser.
// Pure functions; no side effects.

export type ParsedSms = {
  direction: "DEBIT" | "CREDIT";
  mode: "IMPS" | "NEFT" | "RTGS" | "UPI" | "CASH" | "TRANSFER";
  amount: number;
  counterparty: string;
  counterpartyAccount?: string;
  reference?: string; // UTR / Ref no
  accountLast4?: string; // own account
  availableBalance?: number;
  raw: string;
};

const num = (s: string) => Number(s.replace(/,/g, ""));

/** Currency amount: Rs / Rs. / INR / ₹ followed by digits with optional commas. */
const AMOUNT_RE = /(?:rs\.?|inr\.?|₹)\s*([0-9][0-9,\s]*(?:\.\d{1,2})?)/i;

/** Marketing / non-transaction keywords — reject outright. */
const PROMO_PATTERNS: RegExp[] = [
  /\bpre[-\s]?approved\b/i,
  /\bloan\s+(offer|amount|approved|eligib)/i,
  /\bpersonal\s+loan\b/i,
  /\bbusiness\s+loan\b/i,
  /\bgold\s+loan\b/i,
  /\bcredit\s+card\b/i,
  /\bemi\s+(offer|option|starting)/i,
  /\bno\s+cost\s+emi\b/i,
  /\binsurance\b/i,
  /\bpolicy\s+(renewal|premium)\b/i,
  /\breward\s+points?\b/i,
  /\bcash\s?back\b/i,
  /\boffer\s+(valid|ends|expires)/i,
  /\b(otp|one[-\s]?time\s+password)\b/i,
  /\bdo\s+not\s+share\b/i,
  /\bwelcome\s+to\b/i,
  /\bkyc\s+(update|pending|reminder|expire)/i,
  /\bclick\s+(here|the\s+link)\b/i,
  /\bapply\s+now\b/i,
  /\bdownload\s+(our|the)\s+app\b/i,
  /\bt&c\s+apply\b/i,
  /\binterest\s+rate(s)?\s+(as\s+low|starting)/i,
  /\bupgrade\s+your\b/i,
  /\bunsubscribe\b/i,
  /\bto\s+opt\s?-?\s?out\b/i,
];

/** Genuine transaction verbs/keywords — at least one must be present. */
const CREDIT_RE =
  /\b(credited|received|deposit(?:ed)?|cash\s+deposit|added\s+to\s+(?:your\s+)?a\/?c)\b/i;
const DEBIT_RE =
  /\b(debited|sent|paid|withdrawn|withdrawal|cash\s+withdrawal|transferred(?:\s+to)?|spent)\b/i;
const MODE_HINT_RE = /\b(imps|neft|rtgs|upi|cash\s+(deposit|withdrawal))\b/i;

/** Returns true when the SMS looks like a genuine debit/credit alert. */
export function isTransactionSms(input: string): boolean {
  const sms = normalize(input);
  if (!sms) return false;
  if (PROMO_PATTERNS.some((re) => re.test(sms))) return false;
  if (!AMOUNT_RE.test(sms)) return false;
  return CREDIT_RE.test(sms) || DEBIT_RE.test(sms) || MODE_HINT_RE.test(sms);
}

function normalize(input: string): string {
  return (input ?? "")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/, "");
}

/** Parse a bank SMS string. Returns null if it is not a genuine transaction SMS. */
export function parseSms(input: string): ParsedSms | null {
  const sms = normalize(input);
  if (!sms) return null;
  if (!isTransactionSms(sms)) return null;

  const upper = sms.toUpperCase();

  // Amount (first currency figure in the message)
  const amtMatch = sms.match(AMOUNT_RE);
  if (!amtMatch) return null;
  const amount = num(amtMatch[1].replace(/\s/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Direction — prefer the verb that appears first in the message.
  const cIdx = sms.search(CREDIT_RE);
  const dIdx = sms.search(DEBIT_RE);
  let direction: ParsedSms["direction"];
  if (cIdx >= 0 && dIdx >= 0) direction = cIdx < dIdx ? "CREDIT" : "DEBIT";
  else if (cIdx >= 0) direction = "CREDIT";
  else if (dIdx >= 0) direction = "DEBIT";
  else direction = /cash\s+deposit/i.test(sms) ? "CREDIT" : "DEBIT";

  // Mode
  let mode: ParsedSms["mode"] = "TRANSFER";
  if (upper.includes("IMPS")) mode = "IMPS";
  else if (upper.includes("UPI")) mode = "UPI";
  else if (upper.includes("RTGS")) mode = "RTGS";
  else if (upper.includes("NEFT")) mode = "NEFT";
  else if (/CASH\s+(DEPOSIT|WITHDRAWAL)/.test(upper)) mode = "CASH";

  // Own account last 4: "A/c XX1234", "AC no XXXX1234", "account ending 1234"
  const ownMatch =
    sms.match(/\ba\/?c(?:count)?\s*(?:no\.?|number)?\s*[:#]?\s*x+\s*(\d{3,6})\b/i) ??
    sms.match(/\baccount\s+ending\s+(?:with\s+)?(\d{3,6})\b/i);
  const accountLast4 = ownMatch?.[1]?.slice(-4);

  // Reference / UTR / Ref No / Txn ID
  const refMatch =
    sms.match(/\bUTR\s*(?:no\.?|number)?\s*[:#-]?\s*([A-Z0-9]{6,})/i) ??
    sms.match(/\bRRN\s*[:#-]?\s*([A-Z0-9]{6,})/i) ??
    sms.match(/\bRef(?:erence)?\s*(?:no\.?|id|#)?\s*[:#-]?\s*([A-Z0-9]{6,})/i) ??
    sms.match(/\bTxn\s*(?:no\.?|id)?\s*[:#-]?\s*([A-Z0-9]{6,})/i);
  const reference = refMatch?.[1]?.toUpperCase();

  // Available balance
  const balMatch = sms.match(
    /\b(?:avl|avbl|available|a\/?v)?\s*(?:bal|balance)\b[^0-9₹]{0,15}(?:rs\.?|inr\.?|₹)?\s*([0-9][0-9,\s]*(?:\.\d{1,2})?)/i,
  );
  const availableBalance = balMatch ? num(balMatch[1].replace(/\s/g, "")) : undefined;

  // Counterparty — collect every "from/to/by <Name>" candidate, then pick the
  // one that matches the transaction direction, skipping self-references.
  const SELF = /^(your|my|self|the|a|an|account|a\/c|ac)$/i;
  type Cand = { prep: string; name: string; acct?: string };
  const cands: Cand[] = [];

  const acctRe =
    /\b(from|to|by)\s+([A-Za-z][A-Za-z .&'-]{1,60}?)\s+a\/?c(?:count)?\s*(?:no\.?)?\s*[:#]?\s*(x*\d{3,6})/gi;
  for (const m of sms.matchAll(acctRe)) {
    cands.push({ prep: m[1].toLowerCase(), name: m[2], acct: m[3].toUpperCase() });
  }
  const plainRe =
    /\b(from|to|by)\s+([A-Za-z][A-Za-z .&'-]{1,60}?)(?=\s*(?:\.|,|;|-|\bon\b|\bvia\b|\bUTR\b|\bRRN\b|\bRef\b|\bTxn\b|\bUPI\b|\bIMPS\b|\bRTGS\b|\bNEFT\b|\bAvl\b|\bAvbl\b|\bBal\b|$))/gi;
  for (const m of sms.matchAll(plainRe)) {
    cands.push({ prep: m[1].toLowerCase(), name: m[2] });
  }

  const clean = cands
    .map((c) => ({ ...c, name: c.name.replace(/\s+/g, " ").trim() }))
    .filter((c) => !SELF.test(c.name) && !/^a\/?c$/i.test(c.name));

  const wanted = direction === "CREDIT" ? "from" : "to";
  const picked =
    clean.find((c) => c.prep === wanted && c.acct) ??
    clean.find((c) => c.prep === wanted) ??
    clean.find((c) => c.acct) ??
    clean[0];

  const counterparty = picked ? picked.name.toUpperCase() : "";
  const counterpartyAccount = picked?.acct;


  return {
    direction,
    mode,
    amount,
    counterparty,
    counterpartyAccount,
    reference,
    accountLast4,
    availableBalance,
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
 */
export function applySmsToBalance(currentBalance: number, p: ParsedSms): number {
  return p.direction === "CREDIT" ? currentBalance + p.amount : currentBalance - p.amount;
}
