"use server";

// "Nueva factura" (#133): a signed-up, approved distributor invoices one of
// their shops, signed on the server with their own key (#129).

import { getDb } from "@/lib/server/db";
import { currentUser } from "@/lib/server/session";
import { getDirectory } from "@/lib/server/directory";
import { checkInvoice, choices, cleanAmount, dueAt, type InvoiceInput, myApprovedDistributor, notesFor, saveNote, todayInSv } from "@/lib/server/invoices";
import { readClient } from "@/lib/stellar/client";
import { explorerTx } from "@/lib/stellar/config";
import { ContractError, FALLBACK_MESSAGE } from "@/lib/stellar/errors";
import { read, run } from "@/lib/stellar/send";
import { toUnits } from "@/lib/stellar/units";
import type { Receipt } from "@/lib/types";

async function taken(id: bigint): Promise<boolean> {
  try {
    return (await read(readClient().get_invoice({ id }))).isOk();
  } catch (error) {
    if (error instanceof ContractError && error.code === 2) return false; // NotFound
    throw error;
  }
}

/** The next number after this distributor's newest invoice that nobody has used yet. */
async function suggestedId(stellarAddress: string): Promise<number> {
  const recent = await read(readClient().list_invoices());
  const mine = recent.filter((i) => i.distributor === stellarAddress).map((i) => i.id);
  const base = mine.length > 0 ? mine : recent.map((i) => i.id);
  let id = base.reduce((max, i) => (i > max ? i : max), 1000n) + 1n;
  for (let tries = 0; tries < 20 && (await taken(id)); tries++) id += 1n;
  return Number(id);
}

export type InvoiceForm = {
  distributorName: string;
  shops: { id: string; name: string; owner: string; driverId: string | null }[];
  drivers: { id: string; name: string }[];
  suggestedId: number;
  today: string;
};

/** What the form needs. null when the viewer isn't an approved distributor. */
export async function getInvoiceForm(): Promise<InvoiceForm | null> {
  if (!getDb()) return null;
  const distributor = await myApprovedDistributor();
  if (!distributor) return null;
  const [{ shops, drivers }, next] = await Promise.all([choices(distributor), suggestedId(distributor.stellarAddress)]);
  return { distributorName: distributor.businessName, shops, drivers, suggestedId: next, today: todayInSv() };
}

/** "Crear": checks, then create_invoice on the contract as this distributor. */
export async function createInvoiceAction(input: InvoiceInput): Promise<Receipt & { invoiceId?: number }> {
  const distributor = getDb() ? await myApprovedDistributor() : null;
  if (!distributor) return { ok: false, message: "Su distribuidora todavía no está aprobada para crear facturas." };
  try {
    const { shops, drivers, directory } = await choices(distributor);
    const problem = checkInvoice(
      input,
      new Set(shops.map((s) => s.id)),
      new Set(drivers.map((d) => d.id)),
    );
    if (problem) return { ok: false, message: problem };
    const { hash } = await run(distributor.id, (client) =>
      client.create_invoice({
        distributor: distributor.stellarAddress,
        id: BigInt(input.invoiceId),
        shop: directory.find(input.shopId, "shop")!.address,
        driver: directory.find(input.driverId, "driver")!.address,
        amount: toUnits(cleanAmount(input.amount)!),
        due: BigInt(dueAt(input.dueDate)!),
      }),
    );
    try {
      await saveNote({ invoiceId: input.invoiceId, distributorId: distributor.id, shopId: input.shopId, driverId: input.driverId }, input.note ?? "");
    } catch (error) {
      console.error("[invoices] note", error instanceof Error ? error.message : error); // the invoice itself is made
    }
    return { ok: true, message: `Factura ${input.invoiceId} creada.`, txHash: hash, explorerUrl: explorerTx(hash), invoiceId: input.invoiceId };
  } catch (error) {
    if (error instanceof ContractError && error.code === 1) {
      return { ok: false, message: `El número ${input.invoiceId} ya está usado. Use otro.` };
    }
    if (error instanceof ContractError) return { ok: false, message: error.message };
    console.error("[invoices] create", error instanceof Error ? error.message : error);
    return { ok: false, message: FALLBACK_MESSAGE };
  }
}

/** Notes / products for these invoices (only invoices made with the form have one). */
export async function getInvoiceNotes(ids: number[]): Promise<Record<number, string>> {
  if (!getDb() || ids.length === 0) return {};
  return notesFor(ids.filter((id) => Number.isSafeInteger(id)).slice(0, 100), await currentUser());
}

/** Who sent an invoice, and its note: for the top of the shop's invoice (#133). */
export async function getInvoiceSource(id: number): Promise<{ distributorName: string; note: string | null } | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  try {
    const result = await read(readClient().get_invoice({ id: BigInt(id) }));
    if (!result.isOk()) return null;
    const party = (await getDirectory()).byAddress(result.unwrap().distributor);
    const notes = getDb() ? await notesFor([id], await currentUser()) : {};
    return { distributorName: party?.name ?? "", note: notes[id] ?? null };
  } catch {
    return null;
  }
}
