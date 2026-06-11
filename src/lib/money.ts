import type { BudgetState, Category } from "@/types";
import { CATEGORIES } from "@/types";

export type Totals = {
  income: number;
  spend: number;
  billsTotal: number;
  left: number;
  /** % of income kept, 0–100, 0 when no income */
  keptPct: number;
  byCategory: Record<Category, number>;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeTotals(state: BudgetState): Totals {
  const byCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0]),
  ) as Record<Category, number>;
  let spend = 0;
  for (const t of state.txns) {
    spend += t.amount;
    byCategory[t.cat] += t.amount;
  }
  const billsTotal = state.bills.reduce((sum, b) => sum + b.amount, 0);
  const left = state.income - spend - billsTotal;
  const keptPct =
    state.income > 0
      ? Math.max(0, Math.min(100, (left / state.income) * 100))
      : 0;
  return {
    income: round2(state.income),
    spend: round2(spend),
    billsTotal: round2(billsTotal),
    left: round2(left),
    keptPct,
    byCategory,
  };
}

/**
 * Future value with monthly compounding.
 * start: lump sum today, monthly: paid in at the end of each month,
 * ratePct: annual return %, years: duration. Handles 0% rate.
 */
export function compound(
  start: number,
  monthly: number,
  ratePct: number,
  years: number,
): { futureValue: number; paidIn: number; growth: number } {
  const months = Math.round(years * 12);
  const r = ratePct / 100 / 12;
  let futureValue: number;
  if (r === 0) {
    futureValue = start + monthly * months;
  } else {
    const factor = Math.pow(1 + r, months);
    futureValue = start * factor + monthly * ((factor - 1) / r);
  }
  const paidIn = start + monthly * months;
  return {
    futureValue: round2(futureValue),
    paidIn: round2(paidIn),
    growth: round2(futureValue - paidIn),
  };
}

export function formatGBP(n: number, opts?: { signed?: boolean }): string {
  const sign = n < 0 ? "−" : opts?.signed && n > 0 ? "+" : "";
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-GB", {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sign}£${formatted}`;
}

/** Bill lines for the audit user message, e.g. "Energy: £120/month (octopus, ends Aug)" */
export function billLines(state: BudgetState): string {
  return state.bills
    .filter((b) => b.amount > 0)
    .map(
      (b) =>
        `${b.key}: £${b.amount}/month${b.note ? ` (${b.note})` : ""}`,
    )
    .join("\n");
}

/** Plain-text summary of the user's live numbers for the coach system prompt. */
export function coachContext(state: BudgetState): string {
  const t = computeTotals(state);
  const cats = CATEGORIES.filter((c) => t.byCategory[c] > 0)
    .map((c) => `${c} £${round2(t.byCategory[c])}`)
    .join(", ");
  const bills = billLines(state);
  return [
    `Monthly take-home income: £${t.income}.`,
    `Spending so far this month: £${t.spend}${cats ? ` (${cats})` : ""}.`,
    `Fixed bills: £${t.billsTotal}/month${bills ? ` — ${bills.replace(/\n/g, "; ")}` : ""}.`,
    `Left this month: £${t.left}. Keeping ${Math.round(t.keptPct)}% of income.`,
  ].join(" ");
}
