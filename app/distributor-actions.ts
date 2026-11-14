"use server";

// Distributors (#130): sign-up with business details, waiting for approval,
// the /admin decisions, and the dashboard scoped to the signed-in distributor.

import { signUp } from "@/lib/server/accounts";
import { signUpBlocked, TOO_MANY } from "@/lib/server/rate-limit";
import { requireDb, getDb } from "@/lib/server/db";
import { getDirectory } from "@/lib/server/directory";
import {
  approveIfDue,
  autoApproveSeconds,
  checkDetails,
  decide,
  type Distributor,
  type DistributorDetails,
  distributorForUser,
  listForAdmin,
  registerDistributor,
} from "@/lib/server/distributors";
import { currentUser, startSession } from "@/lib/server/session";
import { nicknames } from "@/lib/server/shops";
import { readClient } from "@/lib/stellar/client";
import { config } from "@/lib/stellar/config";
import { FALLBACK_MESSAGE } from "@/lib/stellar/errors";
import { toInvoice, toShop } from "@/lib/stellar/map";
import { read, run } from "@/lib/stellar/send";
import { toDollars } from "@/lib/stellar/units";
import type { Invoice as ChainInvoice } from "@/packages/route_ledger/src/index";
import { HISTORY_PAGE, type Driver, type Invoice, type Shop, type Totals } from "@/lib/types";

type Reply = { ok: true } | { ok: false; message: string };

const DEMO_ID = "distributor";

/** The contract's approve_distributor, signed by the admin key on the server. */
async function approveOnChain(stellarAddress: string): Promise<void> {
  await run("admin", (client) => client.approve_distributor({ distributor: stellarAddress }));
}

export async function signUpDistributorAction(input: {
  name: string;
  contact: string;
  password: string;
  details: DistributorDetails;
}): Promise<Reply> {
  if (!getDb()) return { ok: false, message: "Las cuentas todavía no están activas en este servidor." };
  const problem = checkDetails(input.details); // before anything is created
  if (problem) return { ok: false, message: problem };
  try {
    if (await signUpBlocked()) return { ok: false, message: TOO_MANY };
    const result = await signUp({ role: "distribuidora", name: input.name, contact: input.contact, password: input.password });
    if (!result.ok) return result;
    await registerDistributor(result.user, input.details);
    await startSession(result.sessionId);
    return { ok: true };
  } catch (error) {
    console.error("[distributor] sign-up", error instanceof Error ? error.message : error);
    return { ok: false, message: "No pudimos crear su cuenta en este momento. Intente de nuevo en un minuto." };
  }
}

export type MyDistributor = { id: string; businessName: string; status: Distributor["status"]; autoApprove: boolean };

/** The signed-in distributor's business. Waiting screens poll this; the demo approves when it's time. */
export async function getMyDistributor(): Promise<MyDistributor | null> {
  const user = await currentUser();
  if (!user || user.role !== "distribuidora") return null;
  let distributor = await distributorForUser(user.id);
  if (!distributor) return null;
  try {
    distributor = await approveIfDue(distributor, approveOnChain);
  } catch (error) {
    console.error("[distributor] auto-approve", error instanceof Error ? error.message : error); // try again on the next poll
  }
  return { id: distributor.id, businessName: distributor.businessName, status: distributor.status, autoApprove: autoApproveSeconds() !== null };
}

// ---------- /admin ----------

export type AdminRow = Pick<
  Distributor,
  "id" | "businessName" | "nit" | "address" | "sells" | "shopsApprox" | "driversApprox" | "status" | "ownerName" | "ownerContact" | "createdAt"
> & { explorerUrl: string };

const toAdminRow = (d: Distributor): AdminRow => ({
  id: d.id,
  businessName: d.businessName,
  nit: d.nit,
  address: d.address,
  sells: d.sells,
  shopsApprox: d.shopsApprox,
  driversApprox: d.driversApprox,
  status: d.status,
  ownerName: d.ownerName,
  ownerContact: d.ownerContact,
  createdAt: d.createdAt,
  explorerUrl: `${config.explorer}/account/${d.stellarAddress}`,
});

/** null when the signed-in user isn't a Relay admin. */
export async function getAdminList(): Promise<{ pending: AdminRow[]; decided: AdminRow[] } | null> {
  const user = await currentUser();
  if (user?.role !== "admin") return null;
  const { pending, decided } = await listForAdmin();
  return { pending: pending.map(toAdminRow), decided: decided.map(toAdminRow) };
}

export async function adminDecide(id: string, status: "aprobado" | "rechazado"): Promise<Reply> {
  const user = await currentUser();
  if (user?.role !== "admin") return { ok: false, message: "Solo para administradores de Relay." };
  try {
    await decide(id, status, approveOnChain);
    return { ok: true };
  } catch (error) {
    console.error("[admin] decide", error instanceof Error ? error.message : error);
    return { ok: false, message: FALLBACK_MESSAGE };
  }
}

// ---------- the dashboard, for whoever is looking ----------

export type DistributorView = {
  scope: { id: string; name: string; isDemo: boolean };
  invoices: Invoice[];
  total: number;
  totals: Totals;
  drivers: Driver[];
  shops: Shop[];
};

const MAX_SCAN_PAGES = 20; // 600 invoices; plenty for the demo

/**
 * The signed-in, approved distributor's own invoices, drivers and shops; anyone
 * else sees the demo distributor (Distribuidora El Sol). Newest first, `pages` pages.
 */
export async function getDistributorView(pages: number): Promise<DistributorView> {
  const user = await currentUser();
  const mine = user?.role === "distribuidora" ? await distributorForUser(user.id) : null;
  const own = mine?.status === "aprobado" ? mine : null;
  const directory = await getDirectory();
  const scopeId = own?.id ?? DEMO_ID;
  const scope = { id: scopeId, name: own?.businessName ?? directory.byId(DEMO_ID)?.name ?? "Distribuidora", isDemo: !own };
  const address = own?.stellarAddress ?? directory.byId(DEMO_ID)?.address;

  // Every invoice of this distributor (the contract keeps one list for everyone).
  const count = await read(readClient().invoice_count());
  const befores = Array.from({ length: MAX_SCAN_PAGES }, (_, i) => count - i * HISTORY_PAGE).filter((b) => b > 0);
  const lists = await Promise.all(befores.map((before) => read(readClient().list_invoices_page({ before, limit: HISTORY_PAGE }))));
  const theirs = lists.flat().filter((i) => i.distributor === address);
  const shown = theirs.slice(0, Math.max(1, Math.floor(pages) || 1) * HISTORY_PAGE);
  const withClaim = async (i: ChainInvoice) =>
    i.status.tag === "Paid" ? toInvoice(i, directory) : toInvoice(i, directory, await read(readClient().get_cash_claim({ id: i.id })));
  const invoices = await Promise.all(shown.map(withClaim));

  // Totals: the demo uses the contract's running totals (#80); a new distributor's are summed from its invoices.
  let totals: Totals;
  if (!own) {
    const t = await read(readClient().get_totals());
    totals = { invoices: t.invoices, digital: toDollars(t.digital), cash: toDollars(t.cash), credit: toDollars(t.credit) };
  } else {
    const sum = (method: string) => theirs.filter((i) => i.method.tag === method).reduce((total, i) => total + toDollars(i.paid), 0);
    totals = { invoices: theirs.length, digital: sum("Digital"), cash: sum("Cash"), credit: sum("Credit") };
  }

  const driverParties = directory.ofKind("driver").filter((d) => (d.distributorId ?? DEMO_ID) === scopeId && d.active !== false);
  const drivers = await Promise.all(
    driverParties.map(async (d) => ({ id: d.id, name: d.name, cashHeld: toDollars(await read(readClient().get_driver_cash({ driver: d.address }))) })),
  );

  const shopIds = new Set<string>(invoices.map((i) => i.shopId));
  if (getDb()) {
    const rows = await requireDb().query<{ shop_id: string }>(`SELECT shop_id FROM distributor_shops WHERE distributor_id = $1`, [scopeId]);
    for (const row of rows) shopIds.add(row.shop_id);
  } else if (!own) {
    for (const shop of directory.ofKind("shop")) shopIds.add(shop.id);
  }
  const shops = (
    await Promise.all(
      [...shopIds].map(async (id) => {
        const party = directory.find(id, "shop");
        return party ? toShop(party, await read(readClient().get_shop({ shop: party.address }))) : null;
      }),
    )
  ).filter((s): s is Shop => s !== null);

  // The distributor's own name for each shop (#132) is what they see; nobody else does.
  if (own && getDb()) {
    const names = await nicknames(own.id);
    for (const shop of shops) if (names[shop.id]) shop.name = names[shop.id];
  }

  return { scope, invoices, total: theirs.length, totals, drivers, shops };
}
