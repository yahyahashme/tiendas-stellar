import "server-only";

import { Keypair } from "@stellar/stellar-sdk";
import testnet from "../../config/testnet.json";
import { OWNERS } from "@/lib/stellar/config";
import { decryptSecret } from "./crypto";
import { getDb } from "./db";

// Who is who: every shop, driver and distributor, by id and by Stellar address.
// From the database when there is one (#129), otherwise from config/testnet.json
// (the demo accounts setup.sh made). The demo accounts are also seed rows in the
// database, so their ids ("tienda-1", "motorista-1", "distributor") never change.

export type PartyKind = "shop" | "driver" | "distributor";

export type Party = {
  id: string;
  kind: PartyKind;
  name: string;
  /** The shop owner's or driver's own name; "" if unknown. */
  owner: string;
  address: string;
  /** Drivers: who they drive for. */
  distributorId?: string;
  /** Drivers: false once the distributor removed them (their old invoices still name them). */
  active?: boolean;
  /** Distributors: pendiente / aprobado / rechazado. */
  status?: string;
};

export class Directory {
  private readonly ids = new Map<string, Party>();
  private readonly addresses = new Map<string, Party>();

  constructor(readonly parties: Party[]) {
    for (const party of parties) {
      this.ids.set(party.id, party);
      this.addresses.set(party.address, party);
    }
  }

  byId(id: string): Party | undefined {
    return this.ids.get(id);
  }

  byAddress(address: string): Party | undefined {
    return this.addresses.get(address);
  }

  /** The id for a contract address; an unknown address comes back as it is. */
  idOf(address: string): string {
    return this.addresses.get(address)?.id ?? address;
  }

  /** A party of this kind, or undefined. */
  find(id: string, kind: PartyKind): Party | undefined {
    const party = this.ids.get(id);
    return party?.kind === kind ? party : undefined;
  }

  ofKind(kind: PartyKind): Party[] {
    return this.parties.filter((party) => party.kind === kind);
  }
}

/** The demo accounts from config/testnet.json. */
export function seedParties(): Party[] {
  const { accounts, names } = testnet as typeof testnet & { names: Record<string, string> };
  const shops = Object.entries(accounts.shops).map(([id, address]) => ({
    id,
    kind: "shop" as const,
    name: names[id] ?? id,
    owner: OWNERS[id] ?? "",
    address,
  }));
  const drivers = Object.entries(accounts.drivers).map(([id, address]) => ({
    id,
    kind: "driver" as const,
    name: names[id] ?? id,
    owner: names[id] ?? id,
    address,
    distributorId: "distributor",
    active: true,
  }));
  const distributor = {
    id: "distributor",
    kind: "distributor" as const,
    name: names.distributor ?? "Distribuidora",
    owner: "",
    address: accounts.distributor,
    status: "aprobado",
  };
  return [...shops, ...drivers, distributor];
}

type Row = Record<string, string | null>;

async function partiesFromDb(): Promise<Party[] | null> {
  const db = getDb();
  if (!db) return null;
  const [shops, drivers, distributors] = await Promise.all([
    db.query<Row>(
      `SELECT s.id, s.name, s.stellar_address, COALESCE(u.name, s.owner_name, '') AS owner
         FROM shops s LEFT JOIN users u ON u.id = s.owner_user_id`,
    ),
    db.query<Row & { active: boolean }>(`SELECT id, name, stellar_address, distributor_id, active FROM drivers`),
    db.query<Row>(`SELECT id, business_name, stellar_address, status FROM distributors`),
  ]);
  return [
    ...shops.map((r) => ({ id: r.id!, kind: "shop" as const, name: r.name!, owner: r.owner ?? "", address: r.stellar_address! })),
    ...drivers.map((r) => ({
      id: r.id!,
      kind: "driver" as const,
      name: r.name!,
      owner: r.name!,
      address: r.stellar_address!,
      distributorId: r.distributor_id!,
      active: (r as { active?: boolean }).active !== false,
    })),
    ...distributors.map((r) => ({
      id: r.id!,
      kind: "distributor" as const,
      name: r.business_name!,
      owner: "",
      address: r.stellar_address!,
      status: r.status!,
    })),
  ];
}

const TTL_MS = 3000;
let cached: { at: number; directory: Promise<Directory> } | null = null;

/** Everyone, cached for a few seconds. The demo accounts are always there, even before the seed ran. */
export function getDirectory(): Promise<Directory> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.directory;
  const directory = (async () => {
    const seed = seedParties();
    let fromDb: Party[] | null;
    try {
      fromDb = await partiesFromDb();
    } catch (error) {
      // Postgres down or slow: the demo accounts still work, and the next read tries again.
      console.error("[directory] database", error instanceof Error ? error.message : error);
      cached = null;
      return new Directory(seed);
    }
    if (!fromDb) return new Directory(seed);
    const known = new Set(fromDb.map((party) => party.id));
    return new Directory([...fromDb, ...seed.filter((party) => !known.has(party.id))]);
  })();
  cached = { at: Date.now(), directory };
  directory.catch(() => {
    cached = null; // don't keep a failed read
  });
  return directory;
}

/** After a sign-up or a new shop or driver: the next read sees it. */
export function invalidateDirectory(): void {
  cached = null;
}

// ---------- signing keys ----------

/** "motorista-1" -> "STELLAR_SECRET_MOTORISTA_1" (the demo accounts' keys live in env vars). */
export const secretEnvName = (id: string) => `STELLAR_SECRET_${id.toUpperCase().replace(/-/g, "_")}`;

/**
 * The keypair that signs for an id: the env var for the demo and system
 * accounts (admin, lender, sponsor, the seed shops/drivers/distributor), or the
 * encrypted key Relay holds for an account created by sign-up.
 */
export async function keypairForId(id: string): Promise<Keypair> {
  const fromEnv = process.env[secretEnvName(id)];
  if (fromEnv) return Keypair.fromSecret(fromEnv);
  const party = (await getDirectory()).byId(id);
  const db = getDb();
  if (party && db) {
    const rows = await db.query<{ secret_enc: string }>(`SELECT secret_enc FROM wallets WHERE address = $1`, [party.address]);
    if (rows[0]) return Keypair.fromSecret(decryptSecret(rows[0].secret_enc));
  }
  throw new Error(`No signing key for ${id}`);
}
