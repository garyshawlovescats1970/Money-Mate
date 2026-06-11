import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const [userCount, users, deals, coachCalls] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.deal.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        provider: true,
        title: true,
        active: true,
        _count: { select: { clicks: true } },
      },
    }),
    prisma.coachCall.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const signupsByDay: Record<string, number> = {};
  for (const u of users) {
    const k = dayKey(u.createdAt);
    signupsByDay[k] = (signupsByDay[k] ?? 0) + 1;
  }
  const coachByDay: Record<string, number> = {};
  for (const c of coachCalls) {
    const k = dayKey(c.createdAt);
    coachByDay[k] = (coachByDay[k] ?? 0) + 1;
  }

  return NextResponse.json({
    userCount,
    signupsByDay,
    coachByDay,
    clicksPerDeal: deals.map((d) => ({
      id: d.id,
      provider: d.provider,
      title: d.title,
      active: d.active,
      clicks: d._count.clicks,
    })),
  });
}
