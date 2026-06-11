"use client";

import { useState } from "react";
import { useBudget } from "@/components/BudgetProvider";
import Ring from "@/components/Ring";
import { formatGBP } from "@/lib/money";
import { CATEGORIES, type Category } from "@/types";

export default function MoneyPage() {
  const { state, totals, update, saveStatus } = useBudget();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<Category>("Food");

  const maxCat = Math.max(1, ...CATEGORIES.map((c) => totals.byCategory[c]));

  function addTxn(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!desc.trim() || !isFinite(value) || value <= 0) return;
    update((s) => ({
      ...s,
      txns: [
        {
          id: crypto.randomUUID(),
          desc: desc.trim(),
          amount: Math.round(value * 100) / 100,
          cat,
        },
        ...s.txns,
      ],
    }));
    setDesc("");
    setAmount("");
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="hero-border p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Left this month</p>
            <p
              className={`mono mt-1 text-4xl font-semibold ${
                totals.left < 0 ? "text-coral" : "text-ink"
              }`}
            >
              {formatGBP(totals.left)}
            </p>
            <p className="mono mt-2 text-xs text-muted">
              {formatGBP(totals.income)} in · {formatGBP(totals.spend)} spent ·{" "}
              {formatGBP(totals.billsTotal)} bills
            </p>
          </div>
          <Ring pct={totals.keptPct} />
        </div>
      </section>

      {/* Income */}
      <section className="panel p-4">
        <label className="eyebrow" htmlFor="income">
          Monthly take-home pay
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="mono text-lg text-muted">£</span>
          <input
            id="income"
            className="field mono"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="2200"
            value={state.income || ""}
            onChange={(e) =>
              update((s) => ({
                ...s,
                income: Math.max(0, parseFloat(e.target.value) || 0),
              }))
            }
          />
        </div>
      </section>

      {/* Add spending */}
      <section className="panel p-4">
        <p className="eyebrow mb-3">Add spending</p>
        <form onSubmit={addTxn} className="space-y-3">
          <input
            className="field"
            placeholder="What was it?"
            value={desc}
            maxLength={60}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="field mono"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="£"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0 px-5 py-2.5">
              Add
            </button>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                data-active={cat === c}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Where it's going */}
      {totals.spend > 0 && (
        <section className="panel p-4">
          <p className="eyebrow mb-3">Where it’s going</p>
          <div className="space-y-3">
            {CATEGORIES.filter((c) => totals.byCategory[c] > 0).map((c) => (
              <div key={c}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm">{c}</span>
                  <span className="mono text-sm text-muted">
                    {formatGBP(totals.byCategory[c])}
                  </span>
                </div>
                <div className="bar-track h-2">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(totals.byCategory[c] / maxCat) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Entries */}
      {state.txns.length > 0 && (
        <section className="panel divide-y divide-edge">
          {state.txns.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{t.desc}</p>
                <p className="mono text-[11px] uppercase tracking-wider text-muted">
                  {t.cat}
                </p>
              </div>
              <span className="mono text-sm">{formatGBP(t.amount)}</span>
              <button
                aria-label={`Delete ${t.desc}`}
                className="text-muted transition-transform active:scale-90"
                onClick={() =>
                  update((s) => ({
                    ...s,
                    txns: s.txns.filter((x) => x.id !== t.id),
                  }))
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}
        </section>
      )}

      <p className="mono text-center text-[11px] text-muted">
        {saveStatus === "saving"
          ? "Saving…"
          : saveStatus === "error"
            ? "Couldn't save — check your connection"
            : saveStatus === "saved"
              ? "Synced"
              : " "}
      </p>
    </div>
  );
}
