"use server";

// Distributors add shops (#132), and the shop's side: claiming the record with
// a code, and seeing / removing the distributors that added it.

import { getDb } from "@/lib/server/db";
import { countRecent, noteEvent, TOO_MANY } from "@/lib/server/rate-limit";
import { getDirectory } from "@/lib/server/directory";
import { distributorForUser } from "@/lib/server/distributors";
import { driverIdForUser } from "@/lib/server/drivers";
import {
  addShopWithoutAccount,
  type DistributorShopRow,
  inviteByCode,
  linkShop,
  listShops,
  pendingCodes,
  removeSupplier,
  searchShops,
  type ShopMatch,
  shopIdForUser,
  suppliersOf,
} from "@/lib/server/shops";
import { currentUser } from "@/lib/server/session";
import { readClient } from "@/lib/stellar/client";
import { read } from "@/lib/stellar/send";
import { toDollars } from "@/lib/stellar/units";

type Reply = { ok: true } | { ok: false; message: string };
const NOT_YOURS = "Solo la distribuidora aprobada puede hacer esto.";

async function myApprovedDistributor() {
  const user = await currentUser();
  if (user?.role !== "distribuidora") return null;
  const distributor = await distributorForUser(user.id);
  return distributor?.status === "aprobado" ? distributor : null;
}

export type MyShop = DistributorShopRow & { creditLimit: number; creditOwed: number; driverName: string | null };
export type MyShops = { distributorName: string; shops: MyShop[]; drivers: { id: string; name: string }[] };

/** The distributor's shops with their credit, and their drivers for "assigned driver". null if not an approved distributor. */
export async function getMyShops(): Promise<MyShops | null> {
  const distributor = await myApprovedDistributor();
  if (!distributor) return null;
  const [rows, directory] = await Promise.all([listShops(distributor.id), getDirectory()]);
  const drivers = directory
    .ofKind("driver")
    .filter((d) => d.distributorId === distributor.id && d.active !== false)
    .map((d) => ({ id: d.id, name: d.name }));
  const shops = await Promise.all(
    rows.map(async (row) => {
      const party = directory.find(row.id, "shop");
      const view = party ? await read(readClient().get_shop({ shop: party.address })) : null;
      return {
        ...row,
        creditLimit: view ? toDollars(view.limit) : 0,
        creditOwed: view ? toDollars(view.owed) : 0,
        driverName: drivers.find((d) => d.id === row.driverId)?.name ?? null,
      };
    }),
  );
  return { distributorName: distributor.businessName, shops, drivers };
}

export async function searchShopsAction(query: string): Promise<ShopMatch[]> {
  const distributor = await myApprovedDistributor();
  return distributor ? searchShops(distributor.id, query) : [];
}

/** A driver id the distributor really has, or null. */
async function ownDriver(distributorId: string, driverId: string | null): Promise<string | null> {
  if (!driverId) return null;
  const driver = (await getDirectory()).find(driverId, "driver");
  return driver?.distributorId === distributorId ? driver.id : null;
}

export async function linkShopAction(shopId: string, driverId: string | null): Promise<Reply> {
  const distributor = await myApprovedDistributor();
  if (!distributor) return { ok: false, message: NOT_YOURS };
  const linked = await linkShop(distributor.id, shopId, await ownDriver(distributor.id, driverId));
  return linked ? { ok: true } : { ok: false, message: "No encontramos esa tienda." };
}

export async function addShopAction(input: {
  nickname: string;
  address: string;
  phone: string;
  driverId: string | null;
}): Promise<{ ok: true; shopId: string; code: string } | { ok: false; message: string }> {
  const distributor = await myApprovedDistributor();
  if (!distributor) return { ok: false, message: NOT_YOURS };
  try {
    // Each new shop funds a Stellar account: a cap per distributor per hour.
    const db = getDb()!;
    const key = `addshop:${distributor.id}`;
    if ((await countRecent(db, key, 3600)) >= 30) return { ok: false, message: TOO_MANY };
    await noteEvent(db, key);
    const result = await addShopWithoutAccount(distributor.id, { ...input, driverId: await ownDriver(distributor.id, input.driverId) });
    if ("error" in result) return { ok: false, message: result.error };
    return { ok: true, ...result };
  } catch (error) {
    console.error("[shops] add", error instanceof Error ? error.message : error);
    return { ok: false, message: "No se pudo completar. Intente de nuevo." };
  }
}

/**
 * Claim codes for the stops on a route ("Invitar a Relay"). Only for that
 * driver or their distributor: anyone holding a code could claim the shop.
 */
export async function getRouteInvites(driverId: string, shopIds: string[]): Promise<{ distributorName: string; codes: Record<string, string> }> {
  const none = { distributorName: "", codes: {} };
  if (!getDb()) return none;
  const user = await currentUser();
  if (!user) return none;
  const directory = await getDirectory();
  const driver = directory.find(driverId, "driver");
  if (!driver) return none;
  const isDriver = (await driverIdForUser(user)) === driverId;
  const isTheirDistributor = user.role === "distribuidora" && (await distributorForUser(user.id))?.id === driver.distributorId;
  if (!isDriver && !isTheirDistributor) return none;
  const distributorName = directory.find(driver.distributorId ?? "", "distributor")?.name ?? "";
  if (!driver.distributorId) return none;
  return { distributorName, codes: await pendingCodes(driver.distributorId, shopIds) };
}

// ---------- the shop's side ----------

export async function getShopInvite(code: string): Promise<{ distributorName: string } | null> {
  if (!getDb()) return null;
  const invite = await inviteByCode(code);
  return invite ? { distributorName: invite.distributorName } : null;
}

export type ShopSuppliers = { suppliers: { distributorId: string; name: string; addedAt: string }[]; isOwner: boolean };

/** Who sells to this shop on Relay, and whether the viewer owns the shop (and can remove one). Only for the owner or those distributors. */
export async function getShopSuppliers(shopId: string): Promise<ShopSuppliers | null> {
  if (!getDb()) return null;
  const user = await currentUser();
  if (!user) return null;
  const isOwner = (await shopIdForUser(user)) === shopId;
  const suppliers = await suppliersOf(shopId);
  if (!isOwner) {
    const mine = user.role === "distribuidora" ? await distributorForUser(user.id) : null;
    if (!mine || !suppliers.some((s) => s.distributorId === mine.id)) return null;
  }
  return { suppliers, isOwner };
}

export async function removeSupplierAction(shopId: string, distributorId: string): Promise<Reply> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "Entre a su cuenta primero." };
  return (await removeSupplier(user, shopId, distributorId)) ? { ok: true } : { ok: false, message: "No se pudo completar. Intente de nuevo." };
}

/** The signed-in shop owner's shop id, for "Ir a mi tienda". */
export async function getMyShopId(): Promise<string | null> {
  const user = await currentUser();
  return user ? shopIdForUser(user) : null;
}
