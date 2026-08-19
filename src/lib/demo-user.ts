// Demo banking profile. The UI login gate is backed by a real auth account;
// this UUID is that account's user id.
export const DEMO_USER_ID = "80634f33-ac71-4533-b729-12f0938046e8";
export const DEMO_USERNAME = "331458768";
export const DEMO_PASSWORD = "Rajnish@1887";
export const DEMO_TRANSACTION_PASSWORD = "Rajnish@1887";
export const DEMO_DISPLAY_NAME = "Rambabu";
export const DEMO_FULL_NAME = "Rambabu";
export const DEMO_EMAIL = "dineshlalyadav90759@gmail.com";
export const AUTH_STORAGE_KEY = "bank_demo_auth";

// Static demo banking profile (single source of truth across the UI).
export const DEMO_PROFILE = {
  displayName: DEMO_DISPLAY_NAME,
  fullName: DEMO_FULL_NAME,
  accountNumber: "6647221438",
  customerId: "331458768",
  cif: "331458768",
  pan: "XXXXX9976K",
  mobile: "+91 80XXXXXX47",
  email: DEMO_EMAIL,
  address: "Paliyat Nagar, Road No. 4",
  city: "Mumbai City",
  state: "Maharashtra",
  pinCode: "400078",
  country: "India",
  branch: "CENTRAL BANK OF INDIA",
  branchCode: "281157",
  ifsc: "CBIN0281157",
  bankName: "Central Bank of India",
  accountType: "Current Account",
  accountStatus: "Active",
  kycStatus: "Verified",
  kycReference: "KYC-CBI-20240514-281157",
  kycCompletionDate: "2024-05-14",
  nomineeStatus: "Registered",
  micr: "400281157",
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
