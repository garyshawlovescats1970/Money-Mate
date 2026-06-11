import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/auth";
import { emptyState, parseState } from "@/types";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const row = await prisma.moneyState.findUnique({ where: { userId } });
  if (!row) return NextResponse.json(emptyState());
  try {
    return NextResponse.json(parseState(JSON.parse(row.json)));
  } catch {
    return NextResponse.json(emptyState());
  }
}

export async function PUT(req: Request) {
  const userId = await sessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const state = parseState(raw);
  const json = JSON.stringify(state);
  await prisma.moneyState.upsert({
    where: { userId },
    create: { userId, json },
    update: { json },
  });
  return NextResponse.json({ ok: true });
}
