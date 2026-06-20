// Local-only demo login. No Supabase Auth.
export const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000d1";
export const DEMO_USERNAME = "demo123";
export const DEMO_PASSWORD = "demo123";
export const DEMO_TRANSACTION_PASSWORD = "demo123";
export const DEMO_FULL_NAME = "Rambabu Prajapati";
export const DEMO_EMAIL = "rambabu.prajapati@centralbank.local";
export const AUTH_STORAGE_KEY = "bank_demo_auth";

// Static demo banking profile (single source of truth across the UI).
export const DEMO_PROFILE = {
  fullName: DEMO_FULL_NAME,
  customerId: "CBI8923471",
  cif: "92837461",
  pan: "ABCDE1234F",
  mobile: "+91 98XXXXXX72",
  email: DEMO_EMAIL,
  address: "B-204, Sun Residency, Andheri East",
  city: "Mumbai",
  state: "Maharashtra",
  pinCode: "400069",
  branch: "Andheri East — Mumbai",
  branchCode: "0280001",
  ifsc: "CBIN0280001",
  accountType: "Current Account",
  accountStatus: "Active",
  kycStatus: "Verified",
  kycReference: "KYC-CBI-20240514-998271",
  kycCompletionDate: "2024-05-14",
  openingDate: "2018-03-22",
  micr: "400016024",
} as const;

// Per-mode daily limits (₹).
export const DEMO_LIMITS = {
  overall: 5000000,
  imps: 1000000,
  neft: 2500000,
  rtgs: 2500000,
  upi: 100000,
} as const;

export function isLocallyAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLocallyAuthenticated(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(AUTH_STORAGE_KEY, "1");
    else window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
