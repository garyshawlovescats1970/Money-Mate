"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BudgetState } from "@/types";
import { computeTotals, type Totals } from "@/lib/money";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type BudgetCtx = {
  state: BudgetState;
  totals: Totals;
  update: (fn: (s: BudgetState) => BudgetState) => void;
  /** Force any pending debounced save to complete now (used before AI audit). */
  flush: () => Promise<void>;
  saveStatus: SaveStatus;
};

const Ctx = createContext<BudgetCtx | null>(null);

const DEBOUNCE_MS = 800;

export function BudgetProvider({
  initial,
  children,
}: {
  initial: BudgetState;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<BudgetState>(initial);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(state);
  const dirty = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  latest.current = state;

  const save = useCallback(async () => {
    dirty.current = false;
    setSaveStatus("saving");
    const run = fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(latest.current),
    })
      .then((res) => {
        setSaveStatus(res.ok ? "saved" : "error");
      })
      .catch(() => setSaveStatus("error"))
      .finally(() => {
        inFlight.current = null;
      });
    inFlight.current = run;
    return run;
  }, []);

  const update = useCallback(
    (fn: (s: BudgetState) => BudgetState) => {
      setState((s) => fn(s));
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, DEBOUNCE_MS);
    },
    [save],
  );

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (dirty.current) await save();
    else if (inFlight.current) await inFlight.current;
  }, [save]);

  // Best-effort save when the tab is hidden/closed mid-debounce.
  useEffect(() => {
    const onHide = () => {
      if (dirty.current) {
        navigator.sendBeacon?.(
          "/api/state",
          new Blob([JSON.stringify(latest.current)], {
            type: "application/json",
          }),
        );
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const totals = useMemo(() => computeTotals(state), [state]);
  const value = useMemo(
    () => ({ state, totals, update, flush, saveStatus }),
    [state, totals, update, flush, saveStatus],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBudget(): BudgetCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
  return ctx;
}
