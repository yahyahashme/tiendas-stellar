import "server-only";

import type { User } from "./accounts";
import { getDb } from "./db";
import { type Party, seedParties } from "./directory";
import { currentUser } from "./session";

// Who may move money as whom. The server signs with a party's key, so every
// money action asks this first. The demo's seed accounts (tienda-1,
// motorista-1, the demo distributor...) stay open to anyone, signed in or not,
// so the demo keeps working; every real account needs its owner signed in.

const DEMO_IDS = new Set(seedParties().map((party) => party.id));

export const NOT_YOURS = "Entre a su cuenta para hacer esto. Solo el dueño de la cuenta puede.";

export const isDemoParty = (id: string) => DEMO_IDS.has(id);

const OWNER_QUERY: Record<Party["kind"], string> = {
  shop: `SELECT 1 FROM shops WHERE id = $1 AND owner_user_id = $2`,
  driver: `SELECT 1 FROM drivers WHERE id = $1 AND user_id = $2`,
  distributor: `SELECT 1 FROM distributors WHERE id = $1 AND owner_user_id = $2`,
};

/** Does this user own this party? (Shop owner, the driver themself, the distributor's owner.) */
export async function owns(user: User, party: Pick<Party, "id" | "kind">): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const rows = await db.query(OWNER_QUERY[party.kind], [party.id, user.id]);
  return rows.length > 0;
}

/** May the person calling act as this party? */
export async function mayActAs(party: Pick<Party, "id" | "kind">): Promise<boolean> {
  if (isDemoParty(party.id)) return true;
  const user = await currentUser();
  return user ? owns(user, party) : false;
}
