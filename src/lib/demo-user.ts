// Local-only demo login. No Supabase Auth.
export const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000d1";
export const DEMO_USERNAME = "DineshFruit7196";
export const DEMO_PASSWORD = "Fruit@2017";
export const DEMO_TRANSACTION_PASSWORD = "Fruit@2017";
export const DEMO_DISPLAY_NAME = "DINESH FRUIT";
export const DEMO_FULL_NAME = "DINESH FRUIT";
export const DEMO_EMAIL = "dineshlalyadav90759@gmail.com";
export const AUTH_STORAGE_KEY = "bank_demo_auth";

// Static demo banking profile (single source of truth across the UI).
export const DEMO_PROFILE = {
  displayName: DEMO_DISPLAY_NAME,
  fullName: DEMO_FULL_NAME,
  accountNumber: "6478143786",
  customerId: "87661437218",
  cif: "87661437218",
  pan: "XXXXX9976K",
  mobile: "+91 80XXXXXX47",
  email: DEMO_EMAIL,
  address: "Paliyat Nagar, Road No. 4",
  city: "Mumbai City",
  state: "Maharashtra",
  pinCode: "400078",
  country: "India",
  branch: "PALIYAT NAGAR",
  branchCode: "029976",
  ifsc: "CBIN029976",
  bankName: "Central Bank of India",
  accountType: "Current Account",
  accountStatus: "Active",
  kycStatus: "Verified",
  kycReference: "KYC-CBI-20240514-299761",
  kycCompletionDate: "2024-05-14",
  nomineeStatus: "Registered",
  micr: "400029976",
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
