// Seeds the Deal table from deals.json. Safe to re-run: upserts by id and
// deactivates deals that have been removed from the file.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const prisma = new PrismaClient();
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const feed = JSON.parse(readFileSync(path.join(root, "deals.json"), "utf8"));

const verifiedAt = new Date(feed.verified);

async function main() {
  const ids = feed.deals.map((d) => d.id);
  for (const d of feed.deals) {
    await prisma.deal.upsert({
      where: { id: d.id },
      create: { ...d, verifiedAt, active: true },
      update: { ...d, verifiedAt, active: true },
    });
  }
  await prisma.deal.updateMany({
    where: { id: { notIn: ids } },
    data: { active: false },
  });
  console.log(`Seeded ${ids.length} deals (verified ${feed.verified})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
