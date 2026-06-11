"use client";

import { useState } from "react";
import { useBudget } from "@/components/BudgetProvider";
import { formatGBP } from "@/lib/money";
import type { BillKey } from "@/types";

export default function BillsPage() {
  const { state, totals, update, flush } = useBudget();
  const [auditing, setAuditing] = useState(false);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasBills = state.bills.some((b) => b.amount > 0);

  function setBill(key: BillKey, patch: Partial<{ amount: number; note: string }>) {
    update((s) => ({
      ...s,
      bills: s.bills.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    }));
  }

  async function runAudit() {
    setAuditing(true);
    setError(null);
    setVerdict(null);
    try {
      await flush(); // make sure the server sees the latest bills
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "audit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setVerdict(data.text);
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "Failed to fetch"
          ? e.message
          : "The audit couldn't run. Check your connection and try again.",
      );
    } finally {
      setAuditing(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel-raised p-4">
        <p className="eyebrow">Fixed bills</p>
        <p className="mono mt-1 text-3xl font-semibold">
          {formatGBP(totals.billsTotal)}
          <span className="text-base text-muted">/mo</span>
        </p>
      </section>

      <section className="panel divide-y divide-edge">
        {state.bills.map((b) => (
          <div key={b.key} className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{b.key}</span>
              <div className="flex w-28 items-center gap-1">
                <span className="mono text-sm text-muted">£</span>
                <input
                  aria-label={`${b.key} monthly cost`}
                  className="field mono px-2 py-1.5 text-right text-sm"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={b.amount || ""}
                  onChange={(e) =>
                    setBill(b.key, {
                      amount: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                />
              </div>
            </div>
            <input
              aria-label={`${b.key} note`}
              className="field px-2 py-1.5 text-xs"
              placeholder="Provider, contract end…"
              maxLength={200}
              value={b.note}
              onChange={(e) => setBill(b.key, { note: e.target.value })}
            />
          </div>
        ))}
      </section>

      <button
        className="btn-primary w-full py-3"
        disabled={!hasBills || auditing}
        onClick={runAudit}
      >
        {auditing ? "Auditing your bills…" : "Run AI bill audit"}
      </button>
      {!hasBills && (
        <p className="text-center text-xs text-muted">
          Enter at least one bill and the audit will tell you what you’re
          overpaying.
        </p>
      )}

      {error && (
        <div className="panel border-coral/40 p-4 text-sm text-coral">
          {error}
        </div>
      )}

      {verdict && (
        <section className="panel p-4">
          <p className="eyebrow mb-2">The verdict</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {verdict}
          </p>
          <p className="mt-3 border-t border-edge pt-3 text-xs text-muted">
            These are typical estimates — confirm real prices on a comparison
            site before you switch.
          </p>
        </section>
      )}
    </div>
  );
}
