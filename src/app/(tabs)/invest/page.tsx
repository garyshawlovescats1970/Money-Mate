"use client";

import { useState } from "react";
import { compound, formatGBP } from "@/lib/money";

const LESSONS: { title: string; body: string }[] = [
  {
    title: "Before you invest a penny",
    body: "Three boxes to tick first. One: clear any expensive debt — a credit card charging 24% beats any realistic investment return, so paying it off IS your best investment. Two: build an emergency fund of three months' essential spending in an easy-access savings account. Investments fall at the worst possible moments, and you never want to sell in a dip because the boiler died. Three: only invest money you won't need for at least five years. If you'll need it sooner, savings accounts are the right tool, not the boring one.",
  },
  {
    title: "What investing actually is",
    body: "Buying a share means owning a slice of a real company — a sliver of its profits and its future. Prices wobble daily because moods wobble daily, but over decades the broad stock market has grown far ahead of cash and inflation. That's the whole trade: you accept short-term lurches in exchange for long-term growth. Anyone promising growth without the lurches is selling something — usually to you. Time in the market beats timing the market, mostly because nobody can time the market.",
  },
  {
    title: "Index funds: the boring superpower",
    body: "An index fund buys a tiny piece of every company in a market — hundreds or thousands of them — in one purchase, for a fee of roughly 0.1–0.2% a year. You're not betting on a winner; you're buying the whole race. Most professional fund managers fail to beat the index over the long run, and they charge ten times more for trying. That's why boring, cheap and global is the strategy most ordinary investors should start with. Look for terms like 'global all-cap' or 'world index tracker' when you research.",
  },
  {
    title: "ISAs, pensions and the LISA",
    body: "Wrappers are just tax shelters around your investments. A stocks & shares ISA lets you put in up to £20,000 a year and pay zero tax on the growth — for most people it's the first stop. A workplace pension comes with free employer money and tax relief; opting out is usually turning down a pay rise. A Lifetime ISA adds a 25% government bonus on up to £4,000 a year if you're 18–39 and saving for a first home or retirement — with strings attached on withdrawals. Same investments, different wrappers, very different tax bills.",
  },
  {
    title: "Compounding: why starting early wins",
    body: "Compounding is growth on top of growth. £200 a month at 6% a year is about £33,000 after ten years, £92,000 after twenty, and £201,000 after thirty — and most of that final number is growth, not your deposits. Notice the pattern: the last decade does more work than the first two combined. That's why starting small today beats starting big someday. Run your own numbers in the calculator above and watch where the curve bends.",
  },
  {
    title: "The classic mistakes",
    body: "Panic-selling when markets drop — you lock in the loss and miss the recovery. Buying whatever's hot — by the time it's in the news, the easy gains are gone. Stock-picking with money you can't lose — that's a hobby, not a plan. Ignoring fees — 1.5% a year quietly eats a quarter of your returns over 30 years. And trusting anyone who DMs you about crypto, forex signals or 'guaranteed' returns — that's not investing, that's a scam with a brochure. Boring, cheap, regular, long-term. That's the whole game.",
  },
];

export default function InvestPage() {
  const [start, setStart] = useState("1000");
  const [monthly, setMonthly] = useState("200");
  const [rate, setRate] = useState("6");
  const [years, setYears] = useState("20");

  const result = compound(
    Math.max(0, parseFloat(start) || 0),
    Math.max(0, parseFloat(monthly) || 0),
    Math.max(0, parseFloat(rate) || 0),
    Math.min(80, Math.max(0, parseFloat(years) || 0)),
  );

  return (
    <div className="space-y-4">
      <section className="hero-border p-5">
        <p className="eyebrow">Compound calculator</p>
        <p className="mono mt-1 text-3xl font-semibold text-mint">
          {formatGBP(result.futureValue)}
        </p>
        <p className="mono mt-1 text-xs text-muted">
          you pay in {formatGBP(result.paidIn)} · growth does{" "}
          {formatGBP(result.growth)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Starting £" value={start} onChange={setStart} />
          <Field label="Monthly £" value={monthly} onChange={setMonthly} />
          <Field label="Return %/yr" value={rate} onChange={setRate} step="0.5" />
          <Field label="Years" value={years} onChange={setYears} />
        </div>
      </section>

      <section className="space-y-3">
        <p className="eyebrow">Learn it once, use it forever</p>
        {LESSONS.map((l, i) => (
          <details key={l.title} className="panel group">
            <summary className="flex cursor-pointer items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="mono text-xs text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-semibold">{l.title}</span>
              <span className="text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted">
              {l.body}
            </p>
          </details>
        ))}
      </section>

      <footer className="pb-2 text-center text-[11px] leading-relaxed text-muted">
        Education, not regulated financial advice. Investments can fall as well
        as rise.
      </footer>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        className="field mono mt-1"
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
