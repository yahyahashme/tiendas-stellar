import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "./accounts";

vi.mock("server-only", () => ({}));
let signedIn: User | null = null;
vi.mock("./session", () => ({ currentUser: async () => signedIn }));
process.env.WALLET_KEY = randomBytes(32).toString("base64");
process.env.SESSION_SECRET = randomBytes(32).toString("base64");

const { setDbForTests } = await import("./db");
const { applySchema, seedDemo } = await import("./setup");
const { passwordProblem, signUp } = await import("./accounts");
const { getDirectory, invalidateDirectory } = await import("./directory");
const { mayActAs } = await import("./authz");
const { clearEvents, countRecent, noteEvent } = await import("./rate-limit");

const noNetwork = { fund: async () => {}, addUsdcTrustline: async () => {} };

async function freshDb() {
  const pg = new PGlite();
  const db = { query: async (text: string, params: unknown[] = []) => (await pg.query(text, params)).rows as never[] };
  await applySchema(db, readFileSync("db/schema.sql", "utf8"));
  await seedDemo(db);
  setDbForTests(db);
  invalidateDirectory();
  return db;
}

async function user(contact: string): Promise<User> {
  const result = await signUp({ role: "tienda", name: "Rosa", contact, password: "segura123" }, noNetwork);
  if (!result.ok) throw new Error(result.message);
  return result.user;
}

describe("who may move money as whom", () => {
  let db: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => {
    db = await freshDb();
    signedIn = null;
  });

  it("lets anyone act as the demo accounts, signed in or not", async () => {
    for (const party of [
      { id: "tienda-1", kind: "shop" as const },
      { id: "motorista-1", kind: "driver" as const },
      { id: "distributor", kind: "distributor" as const },
    ]) {
      expect(await mayActAs(party)).toBe(true);
    }
  });

  it("lets a real account act only for its owner", async () => {
    const rosa = await user("7000-1001");
    const ana = await user("7000-1002");
    await db.query(`INSERT INTO shops (id, name, owner_user_id, stellar_address) VALUES ('t-rosa', 'Tienda Rosa', $1, $2)`, [
      rosa.id,
      rosa.stellarAddress,
    ]);
    const shop = { id: "t-rosa", kind: "shop" as const };
    expect(await mayActAs(shop)).toBe(false); // signed out
    signedIn = ana;
    expect(await mayActAs(shop)).toBe(false); // someone else
    signedIn = rosa;
    expect(await mayActAs(shop)).toBe(true);
    expect(await mayActAs({ id: "t-rosa", kind: "driver" })).toBe(false); // not a driver of hers
  });
});

describe("rate limits", () => {
  it("counts events per key inside the window, and clears them", async () => {
    const db = await freshDb();
    for (let i = 0; i < 3; i++) await noteEvent(db, "signin:+50370001001");
    await noteEvent(db, "signin:+50370009999");
    expect(await countRecent(db, "signin:+50370001001", 900)).toBe(3);
    await db.query(`UPDATE rate_events SET at = now() - interval '1 hour' WHERE key = 'signin:+50370009999'`);
    expect(await countRecent(db, "signin:+50370009999", 900)).toBe(0);
    await clearEvents(db, "signin:+50370001001");
    expect(await countRecent(db, "signin:+50370001001", 900)).toBe(0);
  });
});

describe("passwords", () => {
  it("refuses short, blank and easy ones", () => {
    expect(passwordProblem("segura123")).toBeNull();
    expect(passwordProblem("        ")).toBe("La contraseña debe tener al menos 8 caracteres.");
    expect(passwordProblem("12345678")).toBe("Esa contraseña es muy fácil de adivinar. Use otra.");
    expect(passwordProblem("aaaaaaaaaa")).toBe("Esa contraseña es muy fácil de adivinar. Use otra.");
    expect(passwordProblem("x".repeat(201))).toBe("La contraseña debe tener al menos 8 caracteres.");
  });

  it("refuses a password that isn't text before funding anything", async () => {
    await freshDb();
    let funded = 0;
    const counting = { fund: async () => void funded++, addUsdcTrustline: async () => {} };
    const result = await signUp({ role: "tienda", name: "Rosa", contact: "7000-1003", password: 12345678 as unknown as string }, counting);
    expect(result.ok).toBe(false);
    expect(funded).toBe(0);
  });
});

describe("the directory without the database", () => {
  it("falls back to the demo accounts when Postgres errors", async () => {
    setDbForTests({
      query: async () => {
        throw new Error("connection refused");
      },
    });
    invalidateDirectory();
    const directory = await getDirectory();
    expect(directory.find("tienda-1", "shop")).toBeTruthy();
    expect(directory.find("distributor", "distributor")).toBeTruthy();
  });
});
