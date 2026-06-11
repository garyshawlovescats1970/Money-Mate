import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/auth";

// The commission pipe: every outbound deal link passes through here so the
// click is recorded before the 302. Swap Deal.url for affiliate links later
// and this route keeps working unchanged.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> },
) {
  const { dealId } = await params;
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || !deal.active) {
    return NextResponse.redirect(new URL("/deals", _req.url), 302);
  }

  const userId = await sessionUserId();
  try {
    await prisma.click.create({ data: { dealId: deal.id, userId } });
  } catch (err) {
    // Never block the redirect on logging.
    console.error("[go] failed to log click:", err);
  }

  return NextResponse.redirect(deal.url, 302);
}
