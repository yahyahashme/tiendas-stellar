import "server-only";

import type { Db } from "./db";
import { seedParties } from "./directory";

/** The statements in db/schema.sql, one at a time (Neon's HTTP driver takes one per call). */
export function schemaStatements(schemaSql: string): string[] {
  return schemaSql
    .split("\n")
    .map((line) => line.replace(/--.*$/, "")) // comments (the schema has no "--" inside strings)
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export async function applySchema(db: Db, schemaSql: string): Promise<void> {
  for (const statement of schemaStatements(schemaSql)) await db.query(statement);
}

/**
 * The demo accounts from config/testnet.json as seed rows, so /demo,
 * /ruta/motorista-1 and the rest keep working. Their keys stay in env vars.
 * Safe to run again.
 */
export async function seedDemo(db: Db): Promise<void> {
  const parties = seedParties();
  for (const d of parties.filter((p) => p.kind === "distributor")) {
    await db.query(
      `INSERT INTO distributors (id, business_name, status, stellar_address) VALUES ($1, $2, 'aprobado', $3)
       ON CONFLICT (id) DO NOTHING`,
      [d.id, d.name, d.address],
    );
  }
  for (const s of parties.filter((p) => p.kind === "shop")) {
    await db.query(
      `INSERT INTO shops (id, name, owner_name, created_by, stellar_address) VALUES ($1, $2, $3, 'distributor', $4)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.name, s.owner || null, s.address],
    );
    await db.query(
      `INSERT INTO distributor_shops (distributor_id, shop_id) VALUES ('distributor', $1) ON CONFLICT DO NOTHING`,
      [s.id],
    );
  }
  for (const m of parties.filter((p) => p.kind === "driver")) {
    await db.query(
      `INSERT INTO drivers (id, distributor_id, name, stellar_address) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.distributorId ?? "distributor", m.name, m.address],
    );
  }
}
