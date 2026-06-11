import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/auth";
import { askClaude } from "@/lib/anthropic";
import {
  AUDIT_SYSTEM_PROMPT,
  auditUserMessage,
  coachSystemPrompt,
} from "@/lib/prompts";
import { billLines, coachContext } from "@/lib/money";
import { emptyState, parseState, type BudgetState } from "@/types";
import { takeCoachCall, DAILY_COACH_LIMIT } from "@/lib/ratelimit";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Body =
  | { mode: "audit" }
  | { mode?: "chat"; messages: ChatMessage[] };

async function loadState(userId: string): Promise<BudgetState> {
  const row = await prisma.moneyState.findUnique({ where: { userId } });
  if (!row) return emptyState();
  try {
    return parseState(JSON.parse(row.json));
  } catch {
    return emptyState();
  }
}

export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const allowed = await takeCoachCall(userId);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `That's ${DAILY_COACH_LIMIT} coach questions today — the daily cap. It resets at midnight. Your numbers aren't going anywhere.`,
      },
      { status: 429 },
    );
  }

  const state = await loadState(userId);

  try {
    if (body.mode === "audit") {
      const lines = billLines(state);
      if (!lines) {
        return NextResponse.json(
          { error: "Add at least one bill before running the audit." },
          { status: 400 },
        );
      }
      const text = await askClaude(AUDIT_SYSTEM_PROMPT, [
        { role: "user", content: auditUserMessage(lines) },
      ]);
      return NextResponse.json({ text });
    }

    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const messages = incoming
      .filter(
        (m): m is ChatMessage =>
          !!m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0,
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Nothing to answer" }, { status: 400 });
    }

    const text = await askClaude(coachSystemPrompt(coachContext(state)), messages);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[coach] Anthropic call failed:", err);
    return NextResponse.json(
      { error: "The coach is having a moment. Try again in a minute." },
      { status: 502 },
    );
  }
}
