# MoneyMate

A mobile-first UK money app that does three jobs: makes your monthly money
legible (budget in, spending out, what's left), cuts your fixed bills with an
AI audit plus a curated deals feed, and teaches you to invest from zero. An AI
coach that can see your own numbers ties it together. Revenue comes from
affiliate commission on deal click-throughs via the `/go/[dealId]` pipeline.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma — SQLite in dev, Postgres in production
- Auth.js (NextAuth) credentials provider — email + password, bcrypt, JWT sessions
- Anthropic TypeScript SDK, server routes only (the API key never reaches the client)
- PWA: manifest + icons + service worker (Add to Home Screen on iPhone)
- Vitest (money maths + API routes) and Playwright (smoke test)

## Local development

```bash
cp .env.example .env        # add ANTHROPIC_API_KEY for the coach/audit; rest works as-is
npm install                 # runs prisma generate via postinstall
npm run db:push             # create the SQLite schema
npm run db:seed             # load deals.json into the Deal table
npm run dev
```

`AUTH_SECRET` is optional in dev (a dev-only fallback is used) but required in
production — generate one with `openssl rand -base64 32`. Without
`ANTHROPIC_API_KEY` everything works except the coach and bill audit, which
show a friendly error.

## Tests

```bash
npm test                    # Vitest: money maths, deals/go/admin/state routes, rate limiting
npx playwright install chromium   # once
npm run test:e2e            # Playwright: login → add expense → persists
```

## Deploying (Vercel or Railway, with Postgres)

Set the env vars: `DATABASE_URL` (Postgres), `ANTHROPIC_API_KEY`, `AUTH_SECRET`,
`ADMIN_KEY`. Optional: `ANTHROPIC_MODEL` (defaults to the latest Sonnet).

The default Prisma schema targets SQLite for dev; production uses
`prisma/schema.postgres.prisma` (identical models, postgres provider).
`vercel.json` and `railway.json` already set the build command to
`npm run build:postgres`, which runs `prisma generate` + `prisma db push`
against the Postgres schema, seeds `deals.json` (idempotent upsert — note
this re-asserts the JSON over any manual DB edits on each deploy), then
`next build`. No manual seeding step is needed.

## Operating notes

- **Deals feed** — `deals.json` is the source of truth in the repo; `npm run
  db:seed` upserts it (re-running is safe, removed deals are deactivated).
  Deals can also be edited directly in the DB and appear immediately — the
  feed route is dynamic, nothing needs redeploying. When affiliate links are
  ready, replace `Deal.url`; the `/go/[dealId]` click-tracking pipe is
  unchanged. The example entries in `deals.json` are placeholders — replace
  with current verified deals before launch. Keep the feed to unregulated
  verticals only: energy, broadband, mobile, bank-switch incentives,
  savings-rate signposting. No credit cards, loans, insurance products or
  investment platforms.
- **Admin** — `/admin?key=<ADMIN_KEY>`: user count, signups over time, clicks
  per deal, coach calls per day. Same data as JSON at
  `/api/admin/stats?key=<ADMIN_KEY>`.
- **Rate limiting** — 30 coach/audit calls per user per UTC day (`CoachCall`
  table).
- **Newsletter double opt-in** — addresses are stored unconfirmed with a
  token; users only count as subscribed once `/api/newsletter/confirm?token=`
  is hit (UK PECR). v1 has no email provider wired in: confirm links are
  logged to the server console. Wire a sender (Resend/Postmark) into
  `src/app/api/newsletter/route.ts` and `src/app/api/register/route.ts` where
  the `console.log` calls are. Only ever send marketing email to addresses
  with `confirmedAt` set.
- **Lessons copy** — lives in `src/app/(tabs)/invest/page.tsx` (`LESSONS`).
- **AI prompts** — `src/lib/prompts.ts`, used verbatim from the product spec.

## Compliance guardrails

- Nothing in the app is presented as personalised investment advice; the
  "how to choose" framing and disclaimers on Invest/Deals/Coach must stay.
- The affiliate disclosure stays visible on the Deals tab.
- Marketing email only to confirmed double opt-in addresses.
