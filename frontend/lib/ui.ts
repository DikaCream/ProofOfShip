import type { Status, Verdict } from "./pos";

export const STATUS_LABEL: Record<Status, string> = {
  OPEN: "Loading dock", PROOF_SUBMITTED: "At inspection", JUDGED: "Inspected", CHALLENGED: "Under dispute",
  FINAL: "Departed", VOID: "Voided", REJECTED: "Refused at gate",
};
export const verdictClass = (v: Verdict | string) =>
  v === "SHIPPED" ? "stamp-shipped" : v === "PARTIAL" ? "stamp-partial" : v === "NOT_SHIPPED" ? "stamp-not" : "stamp-inc";
export const verdictText = (v: string) => (v ? v.replace("_", " ") : "pending");
