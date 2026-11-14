import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { Keypair } from "@stellar/stellar-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.WALLET_KEY = randomBytes(32).toString("base64");
process.env.SESSION_SECRET = randomBytes(32).toString("base64");

const { setDbForTests } = await import("./db");
const { applySchema, seedDemo } = await import("./setup");
const { decryptSecret, encryptSecret, hashPassword, newId, signValue, unsignValue, verifyPassword } = await import("./crypto");
const accounts = await import("./accounts");
const { getDirectory, invalidateDirectory, keypairForId } = await import("./directory");

/** No testnet from tests: record what would be funded and trusted. */
const network = { funded: [] as string[], trusted: [] as string[] };
const fakeNetwork = {
  fund: async (address: string) => void network.funded.push(address),
  addUsdcTrustline: async (keypair: Keypair) => void network.trusted.push(keypair.publicKey()),
};

async function freshDb() {
  const pg = new PGlite();
  const db = { query: async (text: string, params: unknown[] = []) => (await pg.query(text, params)).rows as never[] };
  await applySchema(db, readFileSync("db/schema.sql", "utf8"));
  await seedDemo(db);
  setDbForTests(db);
  invalidateDirectory();
  return db;
}

describe("crypto", () => {
  it("hashes passwords with a salt and checks them", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a).not.toBe(b);
    expect(await verifyPassword("correct horse", a)).toBe(true);
    expect(await verifyPassword("wrong horse", a)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });

  it("encrypts secret keys so only WALLET_KEY opens them, and notices tampering", () => {
    const secret = Keypair.random().secret();
    const sealed = encryptSecret(secret);
    expect(sealed).not.toContain(secret);
    expect(decryptSecret(sealed)).toBe(secret);
    const parts = sealed.split(":");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });

  it("signs the session cookie and rejects a changed one", () => {
    const signed = signValue("abc");
    expect(unsignValue(signed)).toBe("abc");
    expect(unsignValue(signed.replace("abc", "abd"))).toBeNull();
    expect(unsignValue("abc")).toBeNull();
    expect(unsignValue(undefined)).toBeNull();
  });

  it("makes short readable ids", () => {
    expect(newId("t")).toMatch(/^t-[a-z2-9]{10}$/);
  });
});

describe("contacts", () => {
  it("accepts Salvadoran phones and emails", () => {
    expect(accounts.normalizePhone("7123-4567")).toBe("+50371234567");
    expect(accounts.normalizePhone("+503 2234 5678")).toBe("+50322345678");
    expect(accounts.normalizePhone("1234-5678")).toBeNull();
    expect(accounts.parseContact(" Rosa@Example.com ")).toEqual({ email: "rosa@example.com" });
    expect(accounts.parseContact("rosa@")).toBeNull();
  });
});

describe("accounts", () => {
  beforeEach(async () => {
    network.funded.length = 0;
    network.trusted.length = 0;
    await freshDb();
  });

  it("signs up a shop owner with their own funded Stellar account and a USDC trustline", async () => {
    const result = await accounts.signUp({ role: "tienda", name: "Marta  López", contact: "7123-4567", password: "segura123" }, fakeNetwork);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user).toMatchObject({ role: "tienda", name: "Marta López", phone: "+50371234567", email: null });
    expect(network.funded).toEqual([result.user.stellarAddress]);
    expect(network.trusted).toEqual([result.user.stellarAddress]);
    expect(await accounts.userForSession(result.sessionId)).toEqual(result.user);
  });

  it("keeps the secret key encrypted, and it signs for that address", async () => {
    const result = await accounts.signUp({ role: "distribuidora", name: "Dist. Norte", contact: "norte@example.com", password: "segura123" }, fakeNetwork);
    if (!result.ok) throw new Error(result.message);
    // A party for it arrives with #130; the key itself is already usable by address.
    const db = (await import("./db")).getDb()!;
    const [row] = await db.query<{ secret_enc: string }>(`SELECT secret_enc FROM wallets WHERE address = $1`, [result.user.stellarAddress]);
    expect(row.secret_enc.startsWith("v1:")).toBe(true);
    expect(Keypair.fromSecret(decryptSecret(row.secret_enc)).publicKey()).toBe(result.user.stellarAddress);
  });

  it("refuses a second account with the same phone, drivers without an invite, and weak input", async () => {
    await accounts.signUp({ role: "tienda", name: "Uno", contact: "7123-4567", password: "segura123" }, fakeNetwork);
    const twice = await accounts.signUp({ role: "tienda", name: "Dos", contact: "+503 7123 4567", password: "segura123" }, fakeNetwork);
    expect(twice).toMatchObject({ ok: false, message: "Ya hay una cuenta con ese teléfono o correo. Entre con su contraseña." });
    expect(await accounts.signUp({ role: "motorista", name: "Pedro", contact: "7000-1111", password: "segura123" }, fakeNetwork)).toMatchObject({ ok: false });
    expect(await accounts.signUp({ role: "tienda", name: "Pedro", contact: "7000-1111", password: "corta" }, fakeNetwork)).toMatchObject({
      ok: false,
      message: "La contraseña debe tener al menos 8 caracteres.",
    });
    expect(await accounts.signUp({ role: "tienda", name: "Pedro", contact: "12", password: "segura123" }, fakeNetwork)).toMatchObject({ ok: false });
    expect(network.funded).toHaveLength(1); // nothing was created for the refused ones
  });

  it("signs in with phone or email and the right password only, and signs out", async () => {
    await accounts.signUp({ role: "tienda", name: "Rosa", contact: "rosa@example.com", password: "segura123" }, fakeNetwork);
    expect(await accounts.signIn("ROSA@example.com", "segura123")).toMatchObject({ ok: true, user: { name: "Rosa" } });
    const wrong = await accounts.signIn("rosa@example.com", "segura124");
    const nobody = await accounts.signIn("nadie@example.com", "segura123");
    expect(wrong).toEqual({ ok: false, message: "Teléfono, correo o contraseña incorrectos." });
    expect(nobody).toEqual(wrong); // same answer: doesn't reveal who has an account

    const session = await accounts.signIn("rosa@example.com", "segura123");
    if (!session.ok) throw new Error("sign-in failed");
    await accounts.endSession(session.sessionId);
    expect(await accounts.userForSession(session.sessionId)).toBeNull();
  });
});

describe("directory with the database", () => {
  beforeEach(freshDb);

  it("has the demo accounts as seed rows with the same ids and addresses", async () => {
    const directory = await getDirectory();
    expect(directory.find("tienda-1", "shop")).toMatchObject({ name: "Tienda Rosa", owner: "Rosa Martínez" });
    expect(directory.find("motorista-2", "driver")).toMatchObject({ name: "Ana", distributorId: "distributor" });
    expect(directory.find("distributor", "distributor")).toMatchObject({ name: "Distribuidora El Sol", status: "aprobado" });
    expect(directory.idOf(directory.byId("tienda-2")!.address)).toBe("tienda-2");
  });

  it("signs for an account Relay holds with its decrypted key, and for demo accounts from env", async () => {
    const db = (await import("./db")).getDb()!;
    const keypair = Keypair.random();
    await db.query(`INSERT INTO wallets (address, secret_enc) VALUES ($1, $2)`, [keypair.publicKey(), encryptSecret(keypair.secret())]);
    await db.query(`INSERT INTO shops (id, name, stellar_address) VALUES ('t-nueva', 'Tienda Nueva', $1)`, [keypair.publicKey()]);
    invalidateDirectory();
    expect((await keypairForId("t-nueva")).publicKey()).toBe(keypair.publicKey());

    const demo = Keypair.random();
    process.env.STELLAR_SECRET_TIENDA_3 = demo.secret();
    expect((await keypairForId("tienda-3")).publicKey()).toBe(demo.publicKey());
    delete process.env.STELLAR_SECRET_TIENDA_3;
    await expect(keypairForId("nadie")).rejects.toThrow("No signing key for nadie");
  });
});
