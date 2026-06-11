"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Where is my money going?",
  "How do I start investing with £100?",
  "Am I overpaying on bills?",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "chat", messages: next.slice(-20) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(
        e instanceof Error && e.message !== "Failed to fetch"
          ? e.message
          : "The coach couldn't reply. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="flex-1 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3 pt-6 text-center">
            <p className="text-sm text-muted">
              The coach can see your numbers. Ask it anything about your money.
            </p>
            <div className="flex flex-col items-center gap-2">
              {STARTERS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="brand-gradient max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="flex">
              <p className="panel max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed">
                {m.content}
              </p>
            </div>
          ),
        )}

        {busy && (
          <div className="flex">
            <p className="panel mono rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted">
              thinking…
            </p>
          </div>
        )}
        {error && <p className="text-center text-xs text-coral">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-20 mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="field"
          placeholder="Ask about your money…"
          value={input}
          maxLength={2000}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary shrink-0 px-4 py-2.5"
          disabled={busy || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
