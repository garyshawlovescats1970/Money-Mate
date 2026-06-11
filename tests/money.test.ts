import { describe, expect, it } from "vitest";
import {
  billLines,
  coachContext,
  compound,
  computeTotals,
  formatGBP,
} from "@/lib/money";
import { emptyState, parseState, type BudgetState } from "@/types";

function state(partial: Partial<BudgetState>): BudgetState {
  return { ...emptyState(), ...partial };
}

describe("computeTotals", () => {
  it("computes leftover = income − spending − bills", () => {
    const s = state({
      income: 2000,
      txns: [
        { id: "1", desc: "shop", amount: 55.5, cat: "Food" },
        { id: "2", desc: "bus", amount: 44.5, cat: "Transport" },
      ],
    });
    s.bills[0].amount = 100; // Energy
    const t = computeTotals(s);
    expect(t.spend).toBe(100);
    expect(t.billsTotal).toBe(100);
    expect(t.left).toBe(1800);
    expect(t.keptPct).toBe(90);
  });

  it("handles zero income without dividing by zero", () => {
    const t = computeTotals(
      state({ txns: [{ id: "1", desc: "x", amount: 10, cat: "Fun" }] }),
    );
    expect(t.left).toBe(-10);
    expect(t.keptPct).toBe(0);
  });

  it("clamps kept % to 0 when overspent", () => {
    const t = computeTotals(
      state({
        income: 100,
        txns: [{ id: "1", desc: "x", amount: 250, cat: "Other" }],
      }),
    );
    expect(t.left).toBe(-150);
    expect(t.keptPct).toBe(0);
  });

  it("groups spending by category", () => {
    const t = computeTotals(
      state({
        income: 1000,
        txns: [
          { id: "1", desc: "a", amount: 10, cat: "Food" },
          { id: "2", desc: "b", amount: 15, cat: "Food" },
          { id: "3", desc: "c", amount: 5, cat: "Fun" },
        ],
      }),
    );
    expect(t.byCategory.Food).toBe(25);
    expect(t.byCategory.Fun).toBe(5);
    expect(t.byCategory.Housing).toBe(0);
  });

  it("avoids floating point drift in money sums", () => {
    const t = computeTotals(
      state({
        income: 1,
        txns: [
          { id: "1", desc: "a", amount: 0.1, cat: "Food" },
          { id: "2", desc: "b", amount: 0.2, cat: "Food" },
        ],
      }),
    );
    expect(t.spend).toBe(0.3);
    expect(t.left).toBe(0.7);
  });
});

describe("compound", () => {
  it("matches the closed-form future value with monthly compounding", () => {
    // £1,000 start, £200/mo, 6%/yr, 10 years
    const { futureValue, paidIn, growth } = compound(1000, 200, 6, 10);
    expect(paidIn).toBe(25000);
    // start*1.005^120 + 200*((1.005^120−1)/0.005) ≈ 34,596.9
    expect(futureValue).toBeGreaterThan(34_500);
    expect(futureValue).toBeLessThan(34_700);
    expect(growth).toBeCloseTo(futureValue - paidIn, 2);
  });

  it("handles a 0% rate as straight savings", () => {
    const { futureValue, paidIn, growth } = compound(500, 100, 0, 5);
    expect(futureValue).toBe(500 + 100 * 60);
    expect(paidIn).toBe(futureValue);
    expect(growth).toBe(0);
  });

  it("handles zero duration", () => {
    const { futureValue, paidIn } = compound(750, 100, 7, 0);
    expect(futureValue).toBe(750);
    expect(paidIn).toBe(750);
  });
});

describe("formatGBP", () => {
  it("formats whole pounds without decimals", () => {
    expect(formatGBP(1800)).toBe("£1,800");
  });
  it("formats pence with two decimals", () => {
    expect(formatGBP(12.5)).toBe("£12.50");
  });
  it("marks negatives with a minus sign", () => {
    expect(formatGBP(-42)).toBe("−£42");
  });
});

describe("billLines / coachContext", () => {
  it("renders only non-zero bills with notes", () => {
    const s = emptyState();
    s.bills[0].amount = 120;
    s.bills[0].note = "Octopus, out of contract";
    s.bills[2].amount = 25;
    const lines = billLines(s);
    expect(lines).toBe(
      "Energy: £120/month (Octopus, out of contract)\nMobile: £25/month",
    );
  });

  it("summarises live numbers for the coach prompt", () => {
    const s = state({
      income: 2400,
      txns: [{ id: "1", desc: "shop", amount: 300, cat: "Food" }],
    });
    s.bills[0].amount = 100;
    const ctx = coachContext(s);
    expect(ctx).toContain("Monthly take-home income: £2400.");
    expect(ctx).toContain("Food £300");
    expect(ctx).toContain("Fixed bills: £100/month");
    expect(ctx).toContain("Left this month: £2000.");
    expect(ctx).toContain("Keeping 83% of income.");
  });
});

describe("parseState", () => {
  it("returns a clean empty state for garbage input", () => {
    const s = parseState("not an object");
    expect(s.income).toBe(0);
    expect(s.bills).toHaveLength(7);
  });

  it("drops malformed transactions and keeps valid ones", () => {
    const s = parseState({
      income: 1000,
      txns: [
        { id: "1", desc: "ok", amount: 5, cat: "Food" },
        { id: "2", desc: "bad cat", amount: 5, cat: "Lambos" },
        { desc: "no id", amount: 5, cat: "Food" },
      ],
      bills: [],
    });
    expect(s.txns).toHaveLength(1);
    expect(s.txns[0].desc).toBe("ok");
  });

  it("preserves the canonical seven bill rows", () => {
    const s = parseState({
      income: 0,
      txns: [],
      bills: [{ key: "Energy", amount: 80, note: "octopus" }],
    });
    expect(s.bills).toHaveLength(7);
    expect(s.bills.find((b) => b.key === "Energy")?.amount).toBe(80);
    expect(s.bills.find((b) => b.key === "Mobile")?.amount).toBe(0);
  });
});
