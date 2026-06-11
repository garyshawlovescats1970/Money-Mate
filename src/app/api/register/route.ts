import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: { email?: string; password?: string; newsletter?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const newsletter = Boolean(body.newsletter);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password needs to be at least 8 characters." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "There's already an account with that email — log in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, newsletterOptIn: newsletter },
  });

  if (newsletter) {
    // Double opt-in: store the address with a confirm token. The user only
    // gets marketing email after they hit the confirmation link (UK PECR).
    const token = crypto.randomBytes(24).toString("hex");
    await prisma.newsletterSignup.upsert({
      where: { email },
      create: { email, token },
      update: {},
    });
    // No email provider is wired in v1 — log the link so it can be sent
    // manually / verified in dev. See README "Newsletter double opt-in".
    console.log(
      `[newsletter] confirm link for ${email}: /api/newsletter/confirm?token=${token}`,
    );
  }

  return NextResponse.json({ ok: true });
}
