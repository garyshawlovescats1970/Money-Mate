import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Always read live from the DB so deals can be edited without a redeploy.
export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await prisma.deal.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      cat: true,
      provider: true,
      title: true,
      value: true,
      detail: true,
      hot: true,
      verifiedAt: true,
    },
  });
  const verified = deals.reduce<Date | null>(
    (latest, d) => (!latest || d.verifiedAt > latest ? d.verifiedAt : latest),
    null,
  );
  return NextResponse.json({ verified, deals });
}
