import "server-only";

import { headers } from "next/headers";
import { getDb, type Db } from "./db";

// A cap on how often something can happen, counted in Postgres so every
// server instance sees the same count. Used for sign-up (each one funds a
// Stellar account) and for wrong passwords.

export const SIGN_UP = { max: 5, windowSeconds: 10 * 60 }; // per IP
export const WRONG_PASSWORD = { max: 8, windowSeconds: 15 * 60 }; // per phone or email, and per IP x3

export const TOO_MANY = "Demasiados intentos. Espere unos minutos e intente de nuevo.";

/** How many times `key` happened in the window. */
export async function countRecent(db: Db, key: string, windowSeconds: number): Promise<number> {
  const rows = await db.query<{ n: string | number }>(
    `SELECT count(*) AS n FROM rate_events WHERE key = $1 AND at > now() - make_interval(secs => $2)`,
    [key, windowSeconds],
  );
  return Number(rows[0]?.n ?? 0);
}

/** Record one event for `key` (and now and then drop events older than a day). */
export async function noteEvent(db: Db, key: string): Promise<void> {
  await db.query(`INSERT INTO rate_events (key) VALUES ($1)`, [key]);
  if (Math.random() < 0.02) await db.query(`DELETE FROM rate_events WHERE at < now() - interval '1 day'`);
}

export async function clearEvents(db: Db, key: string): Promise<void> {
  await db.query(`DELETE FROM rate_events WHERE key = $1`, [key]);
}

/** The caller's IP, as Vercel passes it. "unknown" locally. */
export async function callerIp(): Promise<string> {
  const list = (await headers()).get("x-forwarded-for") ?? "";
  return list.split(",")[0]?.trim() || "unknown";
}

/**
 * Before creating an account: true when this IP made too many in the window.
 * Counts the attempt. Without a database there are no accounts to make.
 */
export async function signUpBlocked(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const key = `signup:${await callerIp()}`;
  if ((await countRecent(db, key, SIGN_UP.windowSeconds)) >= SIGN_UP.max) return true;
  await noteEvent(db, key);
  return false;
}
