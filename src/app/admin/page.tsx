import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return (
      <main className="mx-auto max-w-[430px] p-8">
        <p className="mono text-sm text-coral">
          403 — append ?key=YOUR_ADMIN_KEY
        </p>
      </main>
    );
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
        active: true,
        _count: { select: { clicks: true } },
      },
    }),
    prisma.coachCall.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const byDay = (rows: { createdAt: Date }[]) => {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const k = dayKey(r.createdAt);
      out[k] = (out[k] ?? 0) + 1;
    }
    return Object.entries(out).sort(([a], [b]) => (a < b ? 1 : -1));
  };

  const signups = byDay(users);
  const coach = byDay(coachCalls);
  const maxSignups = Math.max(1, ...signups.map(([, n]) => n));
  const maxCoach = Math.max(1, ...coach.map(([, n]) => n));

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="brand-text text-2xl font-extrabold">MoneyMate admin</h1>

      <section className="panel p-4">
        <p className="eyebrow">Users</p>
        <p className="mono mt-1 text-4xl font-semibold">{userCount}</p>
      </section>

      <section className="panel p-4">
        <p className="eyebrow mb-3">Signups · last 30 days</p>
        <Rows rows={signups} max={maxSignups} empty="No signups yet." />
      </section>

      <section className="panel p-4">
        <p className="eyebrow mb-3">Clicks per deal · all time</p>
        {deals.length === 0 ? (
          <p className="text-sm text-muted">No deals seeded.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-t border-edge">
                  <td className="py-2 pr-2">
                    {d.provider}
                    {!d.active && (
                      <span className="mono ml-2 text-[10px] uppercase text-muted">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="mono py-2 text-xs text-muted">{d.id}</td>
                  <td className="mono py-2 text-right">{d._count.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel p-4">
        <p className="eyebrow mb-3">Coach calls per day · last 30 days</p>
        <Rows rows={coach} max={maxCoach} empty="No coach calls yet." />
      </section>
    </main>
  );
}

function Rows({
  rows,
  max,
  empty,
}: {
  rows: [string, number][];
  max: number;
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="space-y-2">
      {rows.map(([day, n]) => (
        <div key={day} className="flex items-center gap-3">
          <span className="mono w-24 shrink-0 text-xs text-muted">{day}</span>
          <div className="bar-track h-2 flex-1">
            <div className="bar-fill" style={{ width: `${(n / max) * 100}%` }} />
          </div>
          <span className="mono w-8 text-right text-xs">{n}</span>
        </div>
      ))}
    </div>
  );
}
