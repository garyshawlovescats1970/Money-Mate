export const CATEGORIES = [
  "Housing",
  "Food",
  "Transport",
  "Bills",
  "Fun",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const BILL_KEYS = [
  "Energy",
  "Broadband",
  "Mobile",
  "Car insurance",
  "Home insurance",
  "TV & streaming",
  "Subscriptions",
] as const;
export type BillKey = (typeof BILL_KEYS)[number];

export type Txn = {
  id: string;
  desc: string;
  amount: number;
  cat: Category;
};

export type Bill = {
  key: BillKey;
  amount: number;
  note: string;
};

export type BudgetState = {
  income: number;
  txns: Txn[];
  bills: Bill[];
};

export function emptyState(): BudgetState {
  return {
    income: 0,
    txns: [],
    bills: BILL_KEYS.map((key) => ({ key, amount: 0, note: "" })),
  };
}

// Normalises whatever came out of the DB into a valid BudgetState.
export function parseState(raw: unknown): BudgetState {
  const base = emptyState();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Partial<BudgetState>;
  const income =
    typeof o.income === "number" && isFinite(o.income) && o.income >= 0
      ? o.income
      : 0;
  const txns = Array.isArray(o.txns)
    ? o.txns
        .filter(
          (t): t is Txn =>
            !!t &&
            typeof t.id === "string" &&
            typeof t.desc === "string" &&
            typeof t.amount === "number" &&
            isFinite(t.amount) &&
            (CATEGORIES as readonly string[]).includes(t.cat as string),
        )
        .slice(0, 1000)
    : [];
  const bills = base.bills.map((b) => {
    const found = Array.isArray(o.bills)
      ? o.bills.find((x) => x && x.key === b.key)
      : undefined;
    if (!found) return b;
    return {
      key: b.key,
      amount:
        typeof found.amount === "number" &&
        isFinite(found.amount) &&
        found.amount >= 0
          ? found.amount
          : 0,
      note: typeof found.note === "string" ? found.note.slice(0, 200) : "",
    };
  });
  return { income, txns, bills };
}
