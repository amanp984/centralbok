// Local-only demo login. No Supabase Auth.
export const DEMO_USER_ID = "00000000-0000-0000-0000-0000000000d1";
export const DEMO_USERNAME = "AP345578698";
export const DEMO_PASSWORD = "ANIKET8080";
export const DEMO_TRANSACTION_PASSWORD = "ANIKET8080";
export const DEMO_DISPLAY_NAME = "AJP";
export const DEMO_FULL_NAME = "Rambabu Prajapati";
export const DEMO_EMAIL = "ajp81876529@gmail.com";
export const AUTH_STORAGE_KEY = "bank_demo_auth";

// Static demo banking profile (single source of truth across the UI).
export const DEMO_PROFILE = {
  displayName: DEMO_DISPLAY_NAME,
  fullName: DEMO_FULL_NAME,
  accountNumber: "89725543786",
  customerId: "CBI66724378",
  cif: "CBI66724378",
  pan: "XXXXX",
  mobile: "+9198XXXXXX68",
  email: DEMO_EMAIL,
  address: "B-204 Sector 4, Sun Residency, Andheri East",
  city: "Mumbai City",
  state: "Maharashtra",
  pinCode: "400078",
  branch: "Andheri East Mumbai",
  branchCode: "0282734",
  ifsc: "CBIN0282734",
  accountType: "Current Account",
  accountStatus: "Active",
  kycStatus: "Verified",
  kycReference: "KYC-CBI-20240514-998271",
  kycCompletionDate: "2024-05-14",
  micr: "400016027",
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
