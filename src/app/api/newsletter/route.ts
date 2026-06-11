import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

// Footer newsletter capture. Double opt-in: nothing is "subscribed" until the
// confirm link is hit (UK PECR requires consent for consumer marketing email).
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 },
    );
  }

  const token = crypto.randomBytes(24).toString("hex");
  const signup = await prisma.newsletterSignup.upsert({
    where: { email },
    create: { email, token },
    update: {},
  });
  // No email provider in v1 — log the link. See README "Newsletter double opt-in".
  console.log(
    `[newsletter] confirm link for ${email}: /api/newsletter/confirm?token=${signup.token}`,
  );

  return NextResponse.json({
    ok: true,
    message: "Check your inbox for a confirmation link.",
  });
}
