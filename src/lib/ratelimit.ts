import { prisma } from "@/lib/prisma";

export const DAILY_COACH_LIMIT = 30;

/** Start of the current UTC day. */
export function startOfToday(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Records one coach/audit call and reports whether the user is within the
 * daily limit. Returns false (and does not record) when the limit is hit.
 */
export async function takeCoachCall(userId: string): Promise<boolean> {
  const used = await prisma.coachCall.count({
    where: { userId, createdAt: { gte: startOfToday() } },
  });
  if (used >= DAILY_COACH_LIMIT) return false;
  await prisma.coachCall.create({ data: { userId } });
  return true;
}
