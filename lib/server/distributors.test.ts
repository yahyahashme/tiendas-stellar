import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.WALLET_KEY = randomBytes(32).toString("base64");
process.env.SESSION_SECRET = randomBytes(32).toString("base64");

const { setDbForTests } = await import("./db");
const { applySchema, seedDemo } = await import("./setup");
const { signUp } = await import("./accounts");
const { getDirectory, invalidateDirectory } = await import("./directory");
const d = await import("./distributors");

const noNetwork = { fund: async () => {}, addUsdcTrustline: async () => {} };
const details = {
  businessName: "Distribuidora  Norte",
  nit: "06141203941013",
  address: "Calle 5, San Miguel",
  sells: ["Snacks", "Bebidas"],
  shopsApprox: "120",
  driversApprox: "4",
};

async function freshDb() {
  const pg = new PGlite();
  const db = { query: async (text: string, params: unknown[] = []) => (await pg.query(text, params)).rows as never[] };
  await applySchema(db, readFileSync("db/schema.sql", "utf8"));
  await seedDemo(db);
  setDbForTests(db);
  invalidateDirectory();
}

async function newDistributor() {
  const result = await signUp({ role: "distribuidora", name: "Ana Pérez", contact: "ana@norte.example", password: "segura123" }, noNetwork);
  if (!result.ok) throw new Error(result.message);
  return { user: result.user, distributor: await d.registerDistributor(result.user, details) };
}

describe("distributor details", () => {
  it("accepts a 14-digit NIT with or without dashes", () => {
    expect(d.normalizeNit("0614-120394-101-3")).toBe("0614-120394-101-3");
    expect(d.normalizeNit("06141203941013")).toBe("0614-120394-101-3");
    expect(d.normalizeNit("0614-1203")).toBeNull();
  });

  it("explains what's missing, in order", () => {
    expect(d.checkDetails(details)).toBeNull();
    expect(d.checkDetails({ ...details, businessName: " " })).toBe("Escriba el nombre de la empresa.");
    expect(d.checkDetails({ ...details, nit: "123" })).toBe("El NIT debe tener 14 dígitos.");
    expect(d.checkDetails({ ...details, address: "x" })).toBe("Escriba la dirección de la empresa.");
    expect(d.checkDetails({ ...details, sells: [] })).toBe("Elija qué vende.");
    expect(d.checkDetails({ ...details, sells: ["Armas"] })).toBe("Elija qué vende.");
    expect(d.checkDetails({ ...details, shopsApprox: "muchas" })).toBe("Escriba un número aproximado.");
    expect(d.checkDetails({ ...details, shopsApprox: "" })).toBeNull(); // optional
  });
});

describe("distributor sign-up and approval", () => {
  beforeEach(freshDb);

  it("registers the business as pending, on the owner's own Stellar address", async () => {
    const { user, distributor } = await newDistributor();
    expect(distributor).toMatchObject({
      businessName: "Distribuidora Norte",
      nit: "0614-120394-101-3",
      sells: ["Snacks", "Bebidas"],
      shopsApprox: 120,
      driversApprox: 4,
      status: "pendiente",
      stellarAddress: user.stellarAddress,
      ownerName: "Ana Pérez",
      ownerContact: "ana@norte.example",
    });
    expect(await d.distributorForUser(user.id)).toEqual(distributor);
    expect((await getDirectory()).find(distributor.id, "distributor")).toMatchObject({ status: "pendiente" });
  });

  it("approves on the contract first, then records it; rejecting touches no contract", async () => {
    const { distributor } = await newDistributor();
    const onChain = vi.fn(async () => {});
    const approved = await d.decide(distributor.id, "aprobado", onChain);
    expect(onChain).toHaveBeenCalledWith(distributor.stellarAddress);
    expect(approved?.status).toBe("aprobado");
    expect(await d.decide(distributor.id, "aprobado", onChain)).toMatchObject({ status: "aprobado" });
    expect(onChain).toHaveBeenCalledTimes(1); // already approved: nothing sent again

    const other = await signUp({ role: "distribuidora", name: "Luis", contact: "luis@sur.example", password: "segura123" }, noNetwork);
    if (!other.ok) throw new Error(other.message);
    const sur = await d.registerDistributor(other.user, { ...details, businessName: "Sur" });
    const reject = vi.fn(async () => {});
    expect(await d.decide(sur.id, "rechazado", reject)).toMatchObject({ status: "rechazado" });
    expect(reject).not.toHaveBeenCalled();
  });

  it("stays pending if the contract call fails", async () => {
    const { distributor } = await newDistributor();
    await expect(d.decide(distributor.id, "aprobado", async () => Promise.reject(new Error("rpc down")))).rejects.toThrow("rpc down");
    expect((await d.distributorById(distributor.id))?.status).toBe("pendiente");
  });

  it("auto-approves in the demo only after the set seconds, or never when off", async () => {
    const { distributor } = await newDistributor();
    const onChain = vi.fn(async () => {});
    const created = Date.parse(distributor.createdAt);
    process.env.RELAY_AUTO_APPROVE_SECONDS = "8";
    expect((await d.approveIfDue(distributor, onChain, created + 3000)).status).toBe("pendiente");
    process.env.RELAY_AUTO_APPROVE_SECONDS = "off";
    expect((await d.approveIfDue(distributor, onChain, created + 60_000)).status).toBe("pendiente");
    process.env.RELAY_AUTO_APPROVE_SECONDS = "8";
    expect((await d.approveIfDue(distributor, onChain, created + 9000)).status).toBe("aprobado");
    expect(onChain).toHaveBeenCalledTimes(1);
    delete process.env.RELAY_AUTO_APPROVE_SECONDS;
  });

  it("reads RELAY_AUTO_APPROVE_SECONDS strictly and fails closed", () => {
    const cases: [string | undefined, number | null][] = [
      [undefined, null], ["", null], ["off", null], ["OFF", null], [" Off ", null], ["abc", null],
      ["-5", null], ["1.5", null], ["999999", null], ["8", 8], [" 8 ", 8], ["0", 0],
    ];
    for (const [value, expected] of cases) {
      if (value === undefined) delete process.env.RELAY_AUTO_APPROVE_SECONDS;
      else process.env.RELAY_AUTO_APPROVE_SECONDS = value;
      expect(d.autoApproveSeconds(), String(value)).toBe(expected);
    }
    delete process.env.RELAY_AUTO_APPROVE_SECONDS;
  });

  it("won't reject a distributor already approved on chain", async () => {
    const { distributor } = await newDistributor();
    await d.decide(distributor.id, "aprobado", async () => {});
    expect((await d.decide(distributor.id, "rechazado", async () => {}))?.status).toBe("aprobado");
  });

  it("lists pending sign-ups for the admin, not the demo seed", async () => {
    const { distributor } = await newDistributor();
    const list = await d.listForAdmin();
    expect(list.pending.map((x) => x.id)).toEqual([distributor.id]);
    expect(list.decided).toEqual([]);
    await d.decide(distributor.id, "aprobado", async () => {});
    expect((await d.listForAdmin()).decided.map((x) => x.status)).toEqual(["aprobado"]);
  });
});
