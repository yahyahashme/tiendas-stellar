import "server-only";

import { neon } from "@neondatabase/serverless";

/** The one way the app talks to Postgres: parameterised SQL in, rows out. */
export type Db = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

let shared: Db | null | undefined;
let override: Db | null = null;

/** Neon over HTTP from DATABASE_URL (set by the Vercel Neon integration), or null without one. */
export function getDb(): Db | null {
  if (override) return override;
  if (shared === undefined) {
    const url = process.env.DATABASE_URL;
    if (url) {
      const sql = neon(url);
      shared = { query: (text, params = []) => sql.query(text, params) as unknown as Promise<never[]> };
    } else {
      shared = null;
    }
  }
  return shared;
}

/** Tests run on an in-memory Postgres (PGlite) instead. */
export function setDbForTests(db: Db | null): void {
  override = db;
}

/** The database, or a clear error for the screens when accounts aren't set up on this server. */
export function requireDb(): Db {
  const db = getDb();
  if (!db) throw new NoDatabase();
  return db;
}

export class NoDatabase extends Error {
  constructor() {
    super("DATABASE_URL is not set");
  }
}
