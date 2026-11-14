import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.WALLET_KEY = randomBytes(32).toString("base64");
process.env.SESSION_SECRET = randomBytes(32).toString("base64");

const { setDbForTests } = await import("./db");
const { applySchema, seedDemo } = await import("./setup");
const { signUp, userForSession } = await import("./accounts");
const { getDirectory, invalidateDirectory } = await import("./directory");
const { registerDistributor, decide } = await import("./distributors");
const drivers = await import("./drivers");

const noNetwork = { fund: async () => {}, addUsdcTrustline: async () => {} };

async function setup() {
  const pg = new PGlite();
  const db = { query: async (text: string, params: unknown[] = []) => (await pg.query(text, params)).rows as never[] };
  await applySchema(db, readFileSync("db/schema.sql", "utf8"));
  await seedDemo(db);
  setDbForTests(db);
  invalidateDirectory();
  const owner = await signUp({ role: "distribuidora", name: "Ana", contact: "ana@norte.example", password: "segura123" }, noNetwork);
  if (!owner.ok) throw new Error(owner.message);
  const distributor = await registerDistributor(owner.user, {
    businessName: "Norte",
    nit: "06141203941013",
    address: "Calle 5, San Miguel",
    sells: ["Snacks"],
    shopsApprox: "",
    driversApprox: "",
  });
  await decide(distributor.id, "aprobado", async () => {});
  return distributor;
}

describe("driver invites", () => {
  let distributorId = "";
  beforeEach(async () => {
    distributorId = (await setup()).id;
  });

  it("creates an invite with a checked Salvadoran phone, once per phone", async () => {
    const invite = await drivers.createInvite(distributorId, " Pedro  López ", "7123-4567");
    expect(invite).toMatchObject({ name: "Pedro López", phone: "+50371234567", distributorName: "Norte", driverId: null });
    expect(await drivers.createInvite(distributorId, "Pedro", "+503 7123 4567")).toEqual({
      error: "Ya invitó a ese teléfono. Comparta el mismo enlace.",
    });
    expect(await drivers.createInvite(distributorId, "P", "7123-4568")).toEqual({ error: "Escriba el nombre del motorista." });
    expect(await drivers.createInvite(distributorId, "Pedro", "1234")).toEqual({ error: "Escriba un teléfono de El Salvador (8 dígitos)." });
    expect((await drivers.listDrivers(distributorId)).map((d) => d.status)).toEqual(["invitado"]);
  });

  it("lets the driver sign up from the link: own account, linked to the distributor, active", async () => {
    const invite = await drivers.createInvite(distributorId, "Pedro", "7123-4567");
    if ("error" in invite) throw new Error(invite.error);
    const joined = await drivers.acceptInvite(invite.token, "Pedro López", "segura123", noNetwork);
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.user).toMatchObject({ role: "motorista", name: "Pedro López", phone: "+50371234567" });
    expect(await userForSession(joined.sessionId)).toMatchObject({ role: "motorista" });
    const party = (await getDirectory()).find(joined.driverId!, "driver");
    expect(party).toMatchObject({ name: "Pedro López", distributorId, address: joined.user.stellarAddress, active: true });
    expect(await drivers.driverIdForUser(joined.user)).toBe(joined.driverId);
    expect(await drivers.listDrivers(distributorId)).toEqual([
      { id: joined.driverId, name: "Pedro López", phone: "+50371234567", status: "activo", inviteToken: null },
    ]);
    // The same link can't make a second account.
    expect(await drivers.acceptInvite(invite.token, "Otro", "segura123", noNetwork)).toMatchObject({ ok: false });
    expect(await drivers.inviteByToken("no-such-token")).toBeNull();
  });

  it("only signs up drivers through an invite", async () => {
    expect(await signUp({ role: "motorista", name: "Pedro", contact: "7000-2222", password: "segura123" }, noNetwork)).toMatchObject({ ok: false });
  });

  it("removes a pending invite (the link stops working) and a joined driver (history stays)", async () => {
    const pending = await drivers.createInvite(distributorId, "Luis", "7000-3333");
    const joining = await drivers.createInvite(distributorId, "Pedro", "7123-4567");
    if ("error" in pending || "error" in joining) throw new Error("invite");
    const joined = await drivers.acceptInvite(joining.token, "Pedro", "segura123", noNetwork);
    if (!joined.ok) throw new Error(joined.message);

    expect(await drivers.removeDriver("another-distributor", pending.token)).toBe(false); // not theirs
    expect(await drivers.removeDriver(distributorId, pending.token)).toBe(true);
    expect(await drivers.inviteByToken(pending.token)).toBeNull();
    expect(await drivers.removeDriver(distributorId, joined.driverId!)).toBe(true);
    expect(await drivers.listDrivers(distributorId)).toEqual([]);
    expect((await getDirectory()).find(joined.driverId!, "driver")).toMatchObject({ name: "Pedro", active: false });
  });
});
