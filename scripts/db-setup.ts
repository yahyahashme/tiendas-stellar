// Creates the tables in db/schema.sql and adds the demo accounts as seed rows.
// Safe to run again. Needs DATABASE_URL (in .env.local, or from `vercel env pull`).
//
//   npm run db:setup
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import type { Db } from "../lib/server/db";
import { applySchema, seedDemo } from "../lib/server/setup";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add the Neon database in Vercel (Storage) and pull the env vars first.");
  process.exit(1);
}
const sql = neon(url);
const db: Db = { query: (text, params = []) => sql.query(text, params) as unknown as Promise<never[]> };

async function main() {
  await applySchema(db, readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  await seedDemo(db);
  const [counts] = await db.query<{ shops: number; drivers: number; distributors: number; users: number }>(
    `SELECT (SELECT count(*) FROM shops)::int AS shops, (SELECT count(*) FROM drivers)::int AS drivers,
            (SELECT count(*) FROM distributors)::int AS distributors, (SELECT count(*) FROM users)::int AS users`,
  );
  console.log("Database ready:", counts);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
