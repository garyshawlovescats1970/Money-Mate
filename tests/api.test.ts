import { beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Routes that touch the session import @/lib/auth, which drags in the whole
// next-auth runtime. Stub it — these tests target the route logic, not auth.
vi.mock("@/lib/auth", () => ({
  sessionUserId: vi.fn(async () => null),
}));

beforeAll(async () => {
  await prisma.click.deleteMany();
  await prisma.coachCall.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.deal.createMany({
    data: [
      {
        id: "test-active",
        cat: "Energy",
        provider: "TestCo",
        title: "Active deal",
        value: "£50",
        detail: "Detail.",
        url: "https://example.com/deal",
        hot: true,
        sortOrder: 2,
        active: true,
        verifiedAt: new Date("2026-06-01"),
      },
      {
        id: "test-first",
        cat: "Mobile",
        provider: "SimCo",
        title: "First by sort order",
        value: "£10/mo",
        detail: "Detail.",
        url: "https://example.com/sim",
        hot: false,
        sortOrder: 1,
        active: true,
        verifiedAt: new Date("2026-06-01"),
      },
      {
        id: "test-inactive",
        cat: "Energy",
        provider: "DeadCo",
        title: "Inactive deal",
        value: "£0",
        detail: "Detail.",
        url: "https://example.com/dead",
        hot: false,
        sortOrder: 0,
        active: false,
        verifiedAt: new Date("2026-06-01"),
      },
    ],
  });
});

describe("GET /api/deals", () => {
  it("returns only active deals, ordered by sortOrder", async () => {
    const { GET } = await import("@/app/api/deals/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deals.map((d: { id: string }) => d.id)).toEqual([
      "test-first",
      "test-active",
    ]);
    expect(data.verified).toBeTruthy();
    // Raw URLs are never exposed — clicks must go through /go/[dealId].
    expect(data.deals[0].url).toBeUndefined();
  });
});

describe("GET /go/[dealId]", () => {
  it("logs a click then 302-redirects to the deal URL", async () => {
    const { GET } = await import("@/app/go/[dealId]/route");
    const res = await GET(new Request("http://localhost/go/test-active"), {
      params: Promise.resolve({ dealId: "test-active" }),
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/deal");
    const clicks = await prisma.click.count({
      where: { dealId: "test-active" },
    });
    expect(clicks).toBe(1);
  });

  it("redirects unknown/inactive deals back to /deals without logging", async () => {
    const { GET } = await import("@/app/go/[dealId]/route");
    const res = await GET(new Request("http://localhost/go/test-inactive"), {
      params: Promise.resolve({ dealId: "test-inactive" }),
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/deals");
    expect(
      await prisma.click.count({ where: { dealId: "test-inactive" } }),
    ).toBe(0);
  });
});

describe("GET /api/admin/stats", () => {
  it("rejects a missing or wrong key", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET(new Request("http://localhost/api/admin/stats"));
    expect(res.status).toBe(403);
    const res2 = await GET(
      new Request("http://localhost/api/admin/stats?key=wrong"),
    );
    expect(res2.status).toBe(403);
  });

  it("returns stats with the right key, including clicks per deal", async () => {
    const { GET } = await import("@/app/api/admin/stats/route");
    const res = await GET(
      new Request("http://localhost/api/admin/stats?key=test-admin-key"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userCount).toBe(0);
    const active = data.clicksPerDeal.find(
      (d: { id: string }) => d.id === "test-active",
    );
    expect(active.clicks).toBe(1);
  });
});

describe("rate limiting", () => {
  it("allows up to 30 coach calls per day then refuses", async () => {
    const user = await prisma.user.create({
      data: { email: "limit@test.dev", passwordHash: "x" },
    });
    const { takeCoachCall, DAILY_COACH_LIMIT } = await import(
      "@/lib/ratelimit"
    );
    for (let i = 0; i < DAILY_COACH_LIMIT; i++) {
      expect(await takeCoachCall(user.id)).toBe(true);
    }
    expect(await takeCoachCall(user.id)).toBe(false);
    expect(await prisma.coachCall.count({ where: { userId: user.id } })).toBe(
      DAILY_COACH_LIMIT,
    );
  });
});

describe("POST /api/state", () => {
  it("requires a session", async () => {
    const { GET } = await import("@/app/api/state/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("persists and round-trips a sanitised state for a logged-in user", async () => {
    const user = await prisma.user.create({
      data: { email: "state@test.dev", passwordHash: "x" },
    });
    const { sessionUserId } = await import("@/lib/auth");
    vi.mocked(sessionUserId).mockResolvedValue(user.id);

    const { GET, PUT } = await import("@/app/api/state/route");
    const put = await PUT(
      new Request("http://localhost/api/state", {
        method: "PUT",
        body: JSON.stringify({
          income: 2200,
          txns: [{ id: "1", desc: "coffee", amount: 3.5, cat: "Food" }],
          bills: [{ key: "Energy", amount: 95, note: "octopus" }],
        }),
      }),
    );
    expect(put.status).toBe(200);

    const res = await GET();
    const state = await res.json();
    expect(state.income).toBe(2200);
    expect(state.txns).toHaveLength(1);
    expect(state.bills.find((b: { key: string }) => b.key === "Energy").amount).toBe(95);

    vi.mocked(sessionUserId).mockResolvedValue(null);
  });
});
