// Local OTP pool. Each OTP can be used once; when all are used the pool
// resets automatically. Used OTPs persist in localStorage across sessions.

export const OTP_POOL: string[] = [
  "834195","102847","695312","427109","551384","209476","743921","318560",
  "962043","184657","630718","854923","471206","295631","703842","516492",
  "389015","642738","105374","892461","724159","938506","162943","580317",
  "436720","810264","354971","697138","248506","571394","925841","163079",
  "407352","839216","684503","351920","746138","592841","130674","827459",
  "468103","905372","274619","613985","349207","781524","529406","816349",
  "395271","604138","243795","870154","158632","942073","536189","609427",
  "325814","791043","483652","167490","852039","416975","934128","275806",
  "608341","193582","740263","582419","361794","825047","407926","938150",
  "264837","519362","783014","625149","804973","351268","973410","146825",
  "539082","261749","840391","715634","492803","384516","927064","153982",
  "608147","734529","271640","583491","894206","416037","952381","639415",
  "120758","748392","365104","580472","802931","473165","916428","259083",
  "634719","145802","839426","372159","608541","791360","526147","984032",
  "213974","467508","830295","395814","712460","649327","180753","954216",
  "273604","841539","506198","392741","615083","758410","193625","427091",
  "860354","341972","982546","536108","614973","275410","803629","419035",
  "762481","350814","927163","184350","640275","893154","231769","574092",
  "716823","504381","169247","785403","392615","948036",
];

const USED_KEY = "bank_demo_used_otps";
export const OTP_VERIFIED_KEY = "bank_demo_otp_verified";

function readUsed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeUsed(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USED_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function resetUsedOtps() {
  writeUsed([]);
}

export type OtpResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "used" };

export function verifyAndConsumeOtp(input: string): OtpResult {
  const code = input.trim();
  if (!OTP_POOL.includes(code)) return { ok: false, reason: "invalid" };

  let used = readUsed();
  if (used.includes(code)) return { ok: false, reason: "used" };

  used = [...used, code];
  // Auto-reset when the pool is exhausted, then re-mark this one as used so
  // the same code can't be reused twice in a row.
  if (used.length >= OTP_POOL.length) {
    writeUsed([code]);
  } else {
    writeUsed(used);
  }
  return { ok: true };
}

export function isOtpVerified(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(OTP_VERIFIED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOtpVerified(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(OTP_VERIFIED_KEY, "1");
    else window.sessionStorage.removeItem(OTP_VERIFIED_KEY);
  } catch {
    /* ignore */
  }
}
