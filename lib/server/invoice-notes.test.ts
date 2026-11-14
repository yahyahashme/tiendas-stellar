import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./session", () => ({ currentUser: async () => null }));
process.env.WALLET_KEY = randomBytes(32).toString("base64");
process.env.SESSION_SECRET = randomBytes(32).toString("base64");

const { setDbForTests } = await import("./db");
const { applySchema, seedDemo } = await import("./setup");
const { signUp } = await import("./accounts");
const { notesFor, saveNote } = await import("./invoices");

const noNetwork = { fund: async () => {}, addUsdcTrustline: async () => {} };

describe("invoice notes (#149)", () => {
  it("are read only by the distributor, the shop's owner and the driver", async () => {
    const pg = new PGlite();
    const db = { query: async (text: string, params: unknown[] = []) => (await pg.query(text, params)).rows as never[] };
    await applySchema(db, readFileSync("db/schema.sql", "utf8"));
    await seedDemo(db);
    setDbForTests(db);
    const people: Record<string, Awaited<ReturnType<typeof signUp>> & { ok: true }> = {};
    for (const [who, phone, role] of [
      ["dist", "7000-2001", "distribuidora"],
      ["owner", "7000-2002", "tienda"],
      ["stranger", "7000-2003", "tienda"],
    ] as const) {
      const r = await signUp({ role, name: who, contact: phone, password: "segura123" }, noNetwork);
      if (!r.ok) throw new Error(r.message);
      people[who] = r;
    }
    await db.query(`INSERT INTO distributors (id, business_name, nit, address, status, owner_user_id, stellar_address) VALUES ('d-1', 'Norte', '06141203941013', 'x', 'aprobado', $1, $2)`, [
      people.dist.user.id,
      people.dist.user.stellarAddress,
    ]);
    await db.query(`INSERT INTO shops (id, name, owner_user_id, stellar_address) VALUES ('t-1', 'Tienda', $1, $2)`, [people.owner.user.id, people.owner.user.stellarAddress]);
    await saveNote({ invoiceId: 5001, distributorId: "d-1", shopId: "t-1", driverId: "motorista-1" }, "3 cajas de agua");

    expect(await notesFor([5001], people.dist.user)).toEqual({ 5001: "3 cajas de agua" });
    expect(await notesFor([5001], people.owner.user)).toEqual({ 5001: "3 cajas de agua" });
    expect(await notesFor([5001], people.stranger.user)).toEqual({});
    expect(await notesFor([5001], null)).toEqual({});
  });
});
