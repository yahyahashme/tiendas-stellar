"use server";

// The recourse tier (#185): a distributor vouches for shops it knows and keeps
// a deposit in the pool (at least 20% of the vouched credit still out). Its
// credit sales to those shops cost 0.25% instead of up to 1.50%. A signed-in,
// approved distributor acts for its own shops; everyone else for the demo's.

import { formatMoney } from "@/lib/format";
import { isDemoParty } from "@/lib/server/authz";
import { getDb } from "@/lib/server/db";
import { getDirectory } from "@/lib/server/directory";
import { choices, myApprovedDistributor } from "@/lib/server/invoices";
import { explorerTx } from "@/lib/stellar/config";
import { readClient } from "@/lib/stellar/client";
import { ContractError, FALLBACK_MESSAGE } from "@/lib/stellar/errors";
import { read, run } from "@/lib/stellar/send";
import { toDollars, toUnits } from "@/lib/stellar/units";
import type { Receipt, RecourseView } from "@/lib/types";

const fail = (message: string): Receipt => ({ ok: false, message });
const receipt = (hash: string, message: string): Receipt => ({ ok: true, message, txHash: hash, explorerUrl: explorerTx(hash) });

function failure(error: unknown): Receipt {
  if (error instanceof ContractError) return fail(error.message);
  console.error("[recourse]", error);
  return fail(FALLBACK_MESSAGE);
}

/** Who is acting: the signed-in approved distributor, else the demo one; and which shops it may vouch for. */
async function acting() {
  const own = getDb() ? await myApprovedDistributor() : null;
  const directory = await getDirectory();
  if (own) {
    const mine = await choices(own);
    return { id: own.id, address: own.stellarAddress, directory: mine.directory, mayVouch: (shopId: string) => mine.shops.some((s) => s.id === shopId) };
  }
  const demo = directory.find("distributor", "distributor");
  if (!demo) return null;
  return { id: demo.id, address: demo.address, directory, mayVouch: (shopId: string) => isDemoParty(shopId) };
}

const amountUnits = (amount: number) => (Number.isFinite(amount) && amount > 0 ? toUnits(amount.toFixed(2)) : 0n);

export async function getRecourse(): Promise<RecourseView> {
  const who = await acting();
  if (!who) return { distributorId: "", deposit: 0, vouchedOut: 0, required: 0 };
  const view = await read(readClient().get_recourse({ distributor: who.address }));
  return { distributorId: who.id, deposit: toDollars(view.deposit), vouchedOut: toDollars(view.vouched_out), required: toDollars(view.required) };
}

export async function vouchShop(shopId: string, on: boolean): Promise<Receipt> {
  try {
    const who = await acting();
    if (!who) return fail(FALLBACK_MESSAGE);
    const shop = who.directory.find(shopId, "shop");
    if (!shop || !who.mayVouch(shopId)) return fail("No encontramos esa tienda.");
    const { hash } = await run(who.id, (client) => client.vouch({ distributor: who.address, shop: shop.address, on }));
    return receipt(hash, on ? `Listo. Ahora respalda a ${shop.name}.` : `Listo. Ya no respalda a ${shop.name}.`);
  } catch (error) {
    return failure(error);
  }
}

export async function depositRecourse(amount: number): Promise<Receipt> {
  try {
    const who = await acting();
    if (!who) return fail(FALLBACK_MESSAGE);
    const units = amountUnits(amount);
    if (units <= 0n) return fail("Monto inválido.");
    const { hash } = await run(who.id, (client) => client.deposit_recourse({ distributor: who.address, amount: units }));
    const view = await read(readClient().get_recourse({ distributor: who.address }));
    return receipt(hash, `Listo. Su depósito de respaldo es ${formatMoney(toDollars(view.deposit))}.`);
  } catch (error) {
    return failure(error);
  }
}

export async function withdrawRecourse(amount: number): Promise<Receipt> {
  try {
    const who = await acting();
    if (!who) return fail(FALLBACK_MESSAGE);
    const before = await read(readClient().get_recourse({ distributor: who.address }));
    // "Take out everything" must send the exact units held.
    const asked = amountUnits(amount);
    const units = toDollars(before.deposit) === amount ? before.deposit : asked;
    if (units <= 0n) return fail("Monto inválido.");
    const { hash } = await run(who.id, (client) => client.withdraw_recourse({ distributor: who.address, amount: units }));
    return receipt(hash, `Listo. Retiró ${formatMoney(toDollars(units))}. Su depósito de respaldo es ${formatMoney(toDollars(before.deposit - units))}.`);
  } catch (error) {
    return failure(error);
  }
}
