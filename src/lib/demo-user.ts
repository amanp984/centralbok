// Local-only demo login. No Supabase Auth.
export const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000d1";
export const DEMO_USERNAME = "A6435887648";
export const DEMO_PASSWORD = "Siyakumari1999";
export const DEMO_TRANSACTION_PASSWORD = "Siyakumari1999";
export const DEMO_DISPLAY_NAME = "SIYA ICECREAM";
export const DEMO_FULL_NAME = "Siya Icecream";
export const DEMO_EMAIL = "siya9715529@gmail.com";
export const AUTH_STORAGE_KEY = "bank_demo_auth";

// Static demo banking profile (single source of truth across the UI).
export const DEMO_PROFILE = {
  displayName: DEMO_DISPLAY_NAME,
  fullName: DEMO_FULL_NAME,
  accountNumber: "45781134076",
  customerId: "CBI6664288734",
  cif: "CBI6664288734",
  pan: "XXXXX5978D",
  mobile: "+916345887107",
  email: DEMO_EMAIL,
  address: "Jaipur Naka",
  city: "Jaipur",
  state: "Rajasthan",
  pinCode: "302012",
  branch: "JAIPUR NAKA",
  branchCode: "0280648",
  ifsc: "CBIN0280648",
  accountType: "Current Account",
  accountStatus: "Active",
  kycStatus: "Verified",
  kycReference: "KYC-CBI-20240514-998271",
  kycCompletionDate: "2024-05-14",
  micr: "302016648",
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
    return window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLocallyAuthenticated(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
    else window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    // Clear any legacy localStorage entry so previously-remembered sessions
    // do not bypass the login screen in new tabs / incognito windows.
    try { window.localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
  } catch {
    /* ignore */
  }
}
