import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

export default function setup() {
  // Fresh throwaway sqlite file per run — no reset flags needed.
  const dbFile = path.resolve(process.cwd(), "prisma", "test.db");
  rmSync(dbFile, { force: true });
  rmSync(`${dbFile}-journal`, { force: true });
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
    stdio: "inherit",
  });
}
