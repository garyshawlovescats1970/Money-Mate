import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }
  const signup = await prisma.newsletterSignup.findUnique({
    where: { token },
  });
  if (!signup) {
    return new NextResponse("That link isn't valid.", { status: 404 });
  }
  const now = new Date();
  if (!signup.confirmedAt) {
    await prisma.newsletterSignup.update({
      where: { id: signup.id },
      data: { confirmedAt: now },
    });
    // Mirror confirmation onto the account if one exists for this email.
    await prisma.user.updateMany({
      where: { email: signup.email, newsletterConfirmedAt: null },
      data: { newsletterConfirmedAt: now, newsletterOptIn: true },
    });
  }
  return new NextResponse(
    "You're confirmed. MoneyMate will only ever email you things worth opening.",
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
