import { formatDate } from "@/lib/banking";

export const ACTIVATION_HOURS = 24;
export const PARTIAL_HOURS = 4;
export const PARTIAL_LIMIT = 25000;

export type BeneficiaryStatus = {
  state: "pending" | "partial" | "active";
  label: string;
  /** Human readable remaining time until full activation, e.g. "3h 42m". */
  remaining: string;
  /** Explanatory helper copy shown under the status chip. */
  message: string;
};

function remainingLabel(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function beneficiaryStatus(createdAt: string, now = Date.now()): BeneficiaryStatus {
  const created = new Date(createdAt).getTime();
  const elapsedH = (now - created) / 3_600_000;
  const fullRemaining = remainingLabel(created + ACTIVATION_HOURS * 3_600_000 - now);

  if (elapsedH >= ACTIVATION_HOURS) {
    return {
      state: "active",
      label: "Active",
      remaining: "",
      message: "Fully activated. No transfer restrictions apply.",
    };
  }
  if (elapsedH >= PARTIAL_HOURS) {
    return {
      state: "partial",
      label: "Partially Active",
      remaining: fullRemaining,
      message: `Transfers up to ₹25,000 are allowed. Full limit available in ${fullRemaining}.`,
    };
  }
  return {
    state: "pending",
    label: "Pending Activation",
    remaining: remainingLabel(created + PARTIAL_HOURS * 3_600_000 - now),
    message: `As per bank security policy, transfers up to ₹25,000 will be allowed ${PARTIAL_HOURS} hours after registration. Full transfer limit is available after ${ACTIVATION_HOURS} hours.`,
  };
}

export const addedOnLabel = (createdAt: string) => `Added on ${formatDate(createdAt)}`;
