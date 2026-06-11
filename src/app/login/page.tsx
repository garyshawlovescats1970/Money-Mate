"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Footer newsletter form (independent of the account form)
  const [nlEmail, setNlEmail] = useState("");
  const [nlMessage, setNlMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, newsletter }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Couldn't create the account.");
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error("Wrong email or password.");
      }
      router.push("/money");
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setNlMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: nlEmail }),
      });
      const data = await res.json();
      setNlMessage(
        res.ok ? data.message : data.error || "That didn't work — try again.",
      );
      if (res.ok) setNlEmail("");
    } catch {
      setNlMessage("That didn't work — try again.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col px-6 py-10">
      <div className="flex-1">
        <h1 className="brand-text text-3xl font-extrabold tracking-tight">
          MoneyMate
        </h1>
        <p className="mt-2 text-sm text-muted">
          The money app that talks like a mate who works in finance.
        </p>

        <div className="panel mt-8 p-5">
          <div className="mb-5 flex gap-2">
            <button
              className="chip"
              data-active={mode === "login"}
              onClick={() => setMode("login")}
            >
              Log in
            </button>
            <button
              className="chip"
              data-active={mode === "register"}
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              className="field"
              type="email"
              autoComplete="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder={
                mode === "login" ? "Password" : "Password (8+ characters)"
              }
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "register" && (
              <label className="flex items-start gap-2.5 text-xs text-muted">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#8B7CFF]"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                Email me genuinely useful money tips now and then. Confirmed by
                email, unsubscribe any time.
              </label>
            )}
            {error && <p className="text-xs text-coral">{error}</p>}
            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={busy}
            >
              {busy
                ? "One sec…"
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>
        </div>
      </div>

      <footer className="mt-10 space-y-3">
        <p className="eyebrow">The newsletter, if you want it</p>
        <form onSubmit={subscribe} className="flex gap-2">
          <input
            className="field text-sm"
            type="email"
            placeholder="you@example.com"
            value={nlEmail}
            onChange={(e) => setNlEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary shrink-0 px-4 py-2 text-sm">
            Sign up
          </button>
        </form>
        {nlMessage && <p className="text-xs text-muted">{nlMessage}</p>}
      </footer>
    </main>
  );
}
