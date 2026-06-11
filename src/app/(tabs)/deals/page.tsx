"use client";

import { useEffect, useMemo, useState } from "react";

type Deal = {
  id: string;
  cat: string;
  provider: string;
  title: string;
  value: string;
  detail: string;
  hot: boolean;
};

const FILTERS = ["All", "Energy", "Banking", "Savings", "Broadband", "Mobile"];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [verified, setVerified] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((data) => {
        setDeals(data.deals);
        setVerified(data.verified);
      })
      .catch(() => setError(true));
  }, []);

  const shown = useMemo(
    () =>
      (deals ?? []).filter((d) => filter === "All" || d.cat === filter),
    [deals, filter],
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Deals that actually save money</h1>
        <p className="mono mt-1 text-[11px] uppercase tracking-wider text-mint">
          {verified
            ? `verified ${new Date(verified).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : " "}
        </p>
        <p className="mt-2 text-xs text-muted">
          Some links may earn us a commission; it never changes your price.
        </p>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            className="chip"
            data-active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p className="panel p-4 text-sm text-muted">
          Couldn’t load the deals feed. Pull to refresh or try again shortly.
        </p>
      )}

      {deals === null && !error && (
        <p className="mono p-4 text-center text-xs text-muted">Loading…</p>
      )}

      <div className="space-y-3">
        {shown.map((d) => (
          <article key={d.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{d.provider}</p>
                <h2 className="mt-1 text-[15px] font-semibold leading-snug">
                  {d.title}
                </h2>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="mono rounded-full bg-mint/10 px-2.5 py-1 text-xs font-semibold text-mint">
                  {d.value}
                </span>
                {d.hot && (
                  <span className="mono rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-coral">
                    ends soon
                  </span>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {d.detail}
            </p>
            <a
              href={`/go/${d.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 inline-block px-4 py-2 text-sm"
            >
              Get deal ↗
            </a>
          </article>
        ))}
        {deals !== null && shown.length === 0 && (
          <p className="panel p-4 text-sm text-muted">
            Nothing in {filter} right now — check back, the feed updates often.
          </p>
        )}
      </div>

      <footer className="pb-2 pt-2 text-center text-[11px] leading-relaxed text-muted">
        Eligibility rules apply. Savings figures are for typical use. This page
        is information, not financial advice.
      </footer>
    </div>
  );
}
