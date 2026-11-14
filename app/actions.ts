"use server";

// Server side of lib/api.ts when NEXT_PUBLIC_USE_MOCKS is "false".
// Talks to route_ledger on testnet. Secret keys never leave the server:
// everything under lib/stellar starts with `import "server-only"`.

import { formatDay, formatMoney } from "@/lib/format";
import { isDemoParty, mayActAs, NOT_YOURS } from "@/lib/server/authz";
import { getDirectory, type Directory } from "@/lib/server/directory";
import { addressOf, config, explorerTx, nameOf, roleOf, SHOP_IDS, type Role } from "@/lib/stellar/config";
import { readClient } from "@/lib/stellar/client";
import { ContractError, FALLBACK_MESSAGE } from "@/lib/stellar/errors";
import { toInvoice, toShop } from "@/lib/stellar/map";
import { read, run } from "@/lib/stellar/send";
import { toDollars, toUnits } from "@/lib/stellar/units";
import { buildHistory } from "@/lib/history";
import { rpc, scValToNative } from "@stellar/stellar-sdk";
import type { Invoice as ChainInvoice } from "@/packages/route_ledger/src/index";
import { toUnixSeconds } from "@/lib/dates";
import { getDb } from "@/lib/server/db";
import { checkInvoice, choices, cleanAmount, dueAt, myApprovedDistributor } from "@/lib/server/invoices";
import { HISTORY_PAGE, type Driver, type Invoice, type InvoiceHistory, type InvoiceRow, type Pool, type Receipt, type Payment, type Shop, type ShopHistory, type Supplier, type Totals } from "@/lib/types";

// ---------- reads ----------

/** Pending cash claims only exist on unpaid invoices, so only those are asked. */
async function withCashClaim(invoice: ChainInvoice, directory: Directory): Promise<Invoice> {
  if (invoice.status.tag === "Paid") return toInvoice(invoice, directory);
  return toInvoice(invoice, directory, await read(readClient().get_cash_claim({ id: invoice.id })));
}

export async function getInvoices(): Promise<Invoice[]> {
  const [list, directory] = await Promise.all([read(readClient().list_invoices()), getDirectory()]);
  return (await Promise.all(list.map((i) => withCashClaim(i, directory)))).sort((a, b) => a.id - b.id);
}

/** The newest `pages` pages of the whole history, newest first. */
export async function getInvoiceHistory(pages: number): Promise<InvoiceHistory> {
  const total = await read(readClient().invoice_count());
  const count = Math.max(1, Math.min(Math.floor(pages) || 1, 100));
  const befores = Array.from({ length: count }, (_, i) => total - i * HISTORY_PAGE).filter((b) => b > 0);
  const lists = await Promise.all(
    befores.map((before) => read(readClient().list_invoices_page({ before, limit: HISTORY_PAGE }))),
  );
  const directory = await getDirectory();
  return { invoices: await Promise.all(lists.flat().map((i) => withCashClaim(i, directory))), total };
}

export async function getTotals(): Promise<Totals> {
  const t = await read(readClient().get_totals());
  return { invoices: t.invoices, digital: toDollars(t.digital), cash: toDollars(t.cash), credit: toDollars(t.credit) };
}

async function chainInvoice(id: number) {
  if (!Number.isSafeInteger(id) || id < 0) return null;
  try {
    const result = await read(readClient().get_invoice({ id: BigInt(id) }));
    return result.isOk() ? result.unwrap() : null;
  } catch (error) {
    if (error instanceof ContractError && error.code === 2) return null; // NotFound
    throw error;
  }
}

export async function getInvoice(id: number): Promise<Invoice | null> {
  const invoice = await chainInvoice(id);
  return invoice ? withCashClaim(invoice, await getDirectory()) : null;
}

export async function getShop(shopId: string): Promise<Shop | null> {
  const party = (await getDirectory()).find(shopId, "shop");
  if (!party) return null;
  return toShop(party, await read(readClient().get_shop({ shop: party.address })));
}

export async function getDrivers(): Promise<Driver[]> {
  const drivers = (await getDirectory()).ofKind("driver").filter((driver) => driver.active !== false);
  return Promise.all(
    drivers.map(async (driver) => ({
      id: driver.id,
      name: driver.name,
      distributorId: driver.distributorId,
      cashHeld: toDollars(await read(readClient().get_driver_cash({ driver: driver.address }))),
    })),
  );
}

/** The shop's test dollars on hand, read from Horizon (its trustline balance). */
export async function getBalance(shopId: string): Promise<number | null> {
  const address = addressOf(shopId);
  if (!address || !SHOP_IDS.includes(shopId as Role)) return null;
  const res = await fetch(`${config.horizonUrl}/accounts/${address}`, { cache: "no-store" });
  if (!res.ok) return 0;
  const account = (await res.json()) as { balances?: { asset_code?: string; asset_issuer?: string; balance: string }[] };
  const line = account.balances?.find((b) => b.asset_code === config.token.code && b.asset_issuer === config.token.issuer);
  return line ? Number(line.balance) : 0;
}

const PAYMENT_EVENTS: Record<string, Payment["method"]> = {
  invoice_paid: "digital",
  cash_confirmed: "cash",
  paid_with_credit: "credit",
  repaid: "repay",
};

/**
 * The shop's payments from the contract's events (InvoicePaid, CashConfirmed, PaidWithCredit,
 * Repaid). The network keeps about a week of events, so anything older shows from the invoice
 * alone, without a date (lib/history.ts adds those rows).
 */
async function shopPayments(address: string): Promise<Payment[]> {
  const server = new rpc.Server(config.rpcUrl);
  const health = await server.getHealth();
  const filters = [{ type: "contract" as const, contractIds: [config.contracts.routeLedger] }];
  const payments: Payment[] = [];
  let page = await server.getEvents({ filters, startLedger: Math.max(health.oldestLedger, health.latestLedger - 120_000), limit: 1000 });
  for (let pages = 0; pages < 20; pages++) {
    for (const e of page.events) {
      const name = String(scValToNative(e.topic[0]));
      const method = PAYMENT_EVENTS[name];
      if (!method) continue;
      const data = scValToNative(e.value) as { shop?: string; driver?: string; amount?: bigint };
      if (data.shop !== address || data.amount === undefined) continue;
      payments.push({
        invoiceId: method === "repay" ? null : Number(scValToNative(e.topic[1])),
        method,
        amount: toDollars(data.amount),
        at: new Date(e.ledgerClosedAt).toISOString(),
        driverId: data.driver ? roleOf(data.driver) : undefined,
        txHash: e.txHash,
      });
    }
    if (page.events.length < 1000) break;
    page = await server.getEvents({ filters, cursor: page.cursor, limit: 1000 });
  }
  return payments;
}

/** Every payment the shop made and what it still owes, newest first (#136). */
export async function getShopHistory(shopId: string): Promise<ShopHistory | null> {
  const address = addressOf(shopId);
  if (!address || !SHOP_IDS.includes(shopId as Role)) return null;
  const total = await read(readClient().invoice_count());
  const [history, shop, payments] = await Promise.all([
    getInvoiceHistory(Math.min(10, Math.ceil(total / HISTORY_PAGE) || 1)),
    getShop(shopId),
    shopPayments(address).catch((error) => {
      console.error("[actions] events", error);
      return [] as Payment[]; // the invoices alone still give a history, just without dates
    }),
  ]);
  if (!shop) return null;
  return buildHistory({
    invoices: history.invoices.filter((i) => i.shopId === shopId),
    payments,
    creditOwed: shop.creditOwed,
    creditDue: shop.creditDue,
    distributor: nameOf("distributor"),
    now: Date.now(),
    explorerTx,
  });
}

/** The distributors this shop buys from: today the one in config/testnet.json. */
export async function getSuppliers(shopId: string): Promise<Supplier[]> {
  const mine = (await getInvoices()).filter((i) => i.shopId === shopId);
  if (mine.length === 0) return [];
  return [{ id: "distributor", name: nameOf("distributor"), invoices: mine.length, unpaid: mine.filter((i) => i.status !== "paid").length }];
}

export async function getPool(): Promise<Pool> {
  const pool = await read(readClient().get_pool());
  return { available: toDollars(pool.available), buffer: toDollars(pool.buffer) };
}

// ---------- writes ----------

const fail = (message: string): Receipt => ({ ok: false, message });

function failure(error: unknown): Receipt {
  if (error instanceof ContractError) return fail(error.message);
  console.error("[actions]", error);
  return fail(FALLBACK_MESSAGE);
}

/** The shop pays (part of) an invoice in dollars digitales. No amount = what's left. */
export async function payNow(invoiceId: number, amount?: number): Promise<Receipt> {
  try {
    const invoice = await chainInvoice(invoiceId);
    if (!invoice) return fail("No encontramos esa factura.");
    const left = invoice.amount - invoice.paid;
    if (left <= 0n) return fail("Esta factura ya está pagada.");

    let units = left;
    if (amount !== undefined) {
      if (!Number.isFinite(amount) || amount <= 0) return fail("Monto inválido.");
      units = toUnits(amount.toFixed(2));
    }
    if (units > left) return fail(`El monto es mayor que lo que falta pagar (${formatMoney(toDollars(left))}).`);
    if (amount !== undefined) {
      // Leave room for cash the driver recorded, so the shop can still confirm it.
      const claim = await read(readClient().get_cash_claim({ id: invoice.id }));
      if (claim > 0n && units > left - claim) {
        return fail(
          `Hay ${formatMoney(toDollars(claim))} en efectivo por confirmar. Puede pagar hasta ${formatMoney(toDollars(left - claim))}.`,
        );
      }
    }

    const shop = (await getDirectory()).byAddress(invoice.shop);
    if (shop?.kind !== "shop") return fail("Esta factura no es de su tienda.");
    if (!(await mayActAs(shop))) return fail(NOT_YOURS);

    const { hash } = await run(shop.id, (client) =>
      client.pay({ shop: invoice.shop, id: invoice.id, amount: units }),
    );
    const paid = formatMoney(toDollars(units));
    const message =
      units === left
        ? `Pago recibido: ${paid} en dólares digitales.`
        : `Pago recibido: ${paid}. Falta ${formatMoney(toDollars(left - units))}.`;
    return { ok: true, message, txHash: hash, explorerUrl: explorerTx(hash) };
  } catch (error) {
    return failure(error);
  }
}

const receipt = (hash: string, message: string): Receipt => ({ ok: true, message, txHash: hash, explorerUrl: explorerTx(hash) });

const shopView = (address: string) => read(readClient().get_shop({ shop: address }));

/** The pool pays what's left now; the shop owes it within the credit period. */
export async function payLater(invoiceId: number): Promise<Receipt> {
  try {
    const invoice = await chainInvoice(invoiceId);
    if (!invoice) return fail("No encontramos esa factura.");
    const left = invoice.amount - invoice.paid;
    if (left <= 0n) return fail("Esta factura ya está pagada.");
    const shop = (await getDirectory()).byAddress(invoice.shop);
    if (shop?.kind !== "shop") return fail("Esta factura no es de su tienda.");
    if (!(await mayActAs(shop))) return fail(NOT_YOURS);

    const { hash } = await run(shop.id, (client) => client.pay_with_credit({ shop: invoice.shop, id: invoice.id }));
    const after = await shopView(invoice.shop);
    const due = new Date(Number(after.due_at) * 1000).toISOString();
    return receipt(hash, `Listo. Tiene hasta el ${formatDay(due)} para pagar ${formatMoney(toDollars(left))}, sin intereses.`);
  } catch (error) {
    return failure(error);
  }
}

/** Cash, step 1: the driver says how much cash the shop handed over. Nothing moves yet. */
export async function claimCash(invoiceId: number, amount: number): Promise<Receipt> {
  try {
    const invoice = await chainInvoice(invoiceId);
    if (!invoice) return fail("No encontramos esa factura.");
    if (invoice.amount - invoice.paid <= 0n) return fail("Esta factura ya está pagada.");
    if (!Number.isFinite(amount) || amount <= 0) return fail("Monto inválido.");
    const driver = (await getDirectory()).byAddress(invoice.driver);
    if (driver?.kind !== "driver") return fail("Este motorista no está en la ruta.");
    if (!(await mayActAs(driver))) return fail(NOT_YOURS);

    const units = toUnits(amount.toFixed(2));
    const { hash } = await run(driver.id, (client) =>
      client.cash_claim({ driver: invoice.driver, id: invoice.id, amount: units }),
    );
    return receipt(hash, "Listo. Ahora la tienda debe tocar «Confirmo».");
  } catch (error) {
    return failure(error);
  }
}

/** Cash, step 2: the shop confirms the driver's claim. */
/** `amount` is the cash claim the shop was shown; the contract refuses if the driver changed it since. */
export async function confirmCash(invoiceId: number, amount: number): Promise<Receipt> {
  try {
    const invoice = await chainInvoice(invoiceId);
    if (!invoice) return fail("No encontramos esa factura.");
    const shop = (await getDirectory()).byAddress(invoice.shop);
    if (shop?.kind !== "shop") return fail("Esta factura no es de su tienda.");
    if (!(await mayActAs(shop))) return fail(NOT_YOURS);
    if (!Number.isFinite(amount) || amount <= 0) return fail("Monto inválido.");
    const units = toUnits(amount.toFixed(2));

    const { hash } = await run(shop.id, (client) =>
      client.cash_confirm({ shop: invoice.shop, id: invoice.id, amount: units }),
    );
    return receipt(hash, `Listo. Confirmó ${formatMoney(toDollars(units))} en efectivo.`);
  } catch (error) {
    return failure(error);
  }
}

/** The shop pays back credit. Paying the whole debt on time can raise the limit. */
export async function repay(shopId: string, amount: number): Promise<Receipt> {
  try {
    const shop = (await getDirectory()).find(shopId, "shop");
    if (!shop) return fail("No encontramos esa tienda.");
    if (!(await mayActAs(shop))) return fail(NOT_YOURS);
    const address = shop.address;
    if (!Number.isFinite(amount) || amount <= 0) return fail("Monto inválido.");
    const before = await shopView(address);
    if (before.owed <= 0n) return fail("No tiene deudas pendientes.");
    // The screen sends dollars; "pay everything" must send the exact units owed.
    const asked = toUnits(amount.toFixed(2));
    const units = asked >= before.owed || toDollars(before.owed) === amount ? before.owed : asked;

    const { hash } = await run(shop.id, (client) => client.repay({ shop: address, amount: units }));
    const after = await shopView(address);
    if (after.owed > 0n) {
      return receipt(hash, `Pago recibido: ${formatMoney(toDollars(units))}. Falta ${formatMoney(toDollars(after.owed))}.`);
    }
    const limit = formatMoney(toDollars(after.limit));
    if (after.late > before.late) {
      return receipt(hash, after.limit < before.limit ? `Deuda pagada con atraso. Su límite bajó a ${limit}.` : "Deuda pagada con atraso.");
    }
    return receipt(hash, after.limit > before.limit ? `Deuda pagada a tiempo. Su límite subió a ${limit}.` : "Deuda pagada a tiempo. Gracias.");
  } catch (error) {
    return failure(error);
  }
}

/** The distributor got a driver's cash at the warehouse. No money moves on chain. */
export async function handInCash(driverId: string, amount: number): Promise<Receipt> {
  try {
    const directory = await getDirectory();
    const party = directory.find(driverId, "driver");
    if (!party) return fail("No encontramos a ese motorista.");
    const distributorId = party.distributorId ?? "distributor";
    const distributor = directory.find(distributorId, "distributor");
    if (!distributor) return fail("No encontramos a ese motorista.");
    if (!(await mayActAs(distributor))) return fail(NOT_YOURS);
    const driver = party.address;
    if (!Number.isFinite(amount) || amount <= 0) return fail("Monto inválido.");
    const held = await read(readClient().get_driver_cash({ driver }));
    // "Hand in everything" must send the exact units held.
    const asked = toUnits(amount.toFixed(2));
    const units = toDollars(held) === amount ? held : asked;
    const { hash } = await run(distributor.id, (client) =>
      client.cash_handed_in({ distributor: distributor.address, driver, amount: units }),
    );
    return receipt(hash, `Listo. ${party.name} entregó ${formatMoney(toDollars(units))} en efectivo.`);
  } catch (error) {
    return failure(error);
  }
}

// ---------- demo invoices (the distributor's "Nueva factura de demo") ----------

const DEMO_SHOPS = ["tienda-1", "tienda-2", "tienda-3"] as const;
const DEMO_DRIVER: Record<string, string> = { "tienda-1": "motorista-1", "tienda-2": "motorista-1", "tienda-3": "motorista-2" };
const DEMO_AMOUNTS = ["45.00", "60.00", "85.50"]; // several fit under a $200 limit
const WEEK_SECS = 7n * 24n * 60n * 60n;
const DEMO_TRIES = 3;

// Each invoice is its own transaction (about 5 s), and the server action has 60 s
// (app/distribuidor/layout.tsx), so 10 per file stays well inside it.
const MAX_IMPORT = 10;
const AMOUNT = /^\d+(\.\d{1,7})?$/;

/**
 * CSV import (#32): checks every row first (shop and driver known, id not on
 * the contract yet), then creates them one at a time, signed by the
 * distributor. If one fails midway, says how many were created.
 * A signed-in, approved distributor (#133) imports for their own shops and
 * drivers; everyone else imports for the demo distributor.
 */
export async function createInvoices(rows: InvoiceRow[]): Promise<Receipt> {
  if (rows.length === 0) return fail("No hay facturas para crear.");
  if (rows.length > MAX_IMPORT) return fail(`Máximo ${MAX_IMPORT} facturas por archivo.`);
  let created = 0;
  let lastHash = "";
  try {
    const own = getDb() ? await myApprovedDistributor() : null;
    const mine = own ? await choices(own) : null;
    const directory = mine?.directory ?? (await getDirectory());
    const distributor = own ? { id: own.id, address: own.stellarAddress } : directory.find("distributor", "distributor");
    if (!distributor) return fail(FALLBACK_MESSAGE);
    // Who the rows may name: a signed-in distributor's own shops and drivers, or,
    // for everyone else, only the demo's (never a real shop billed by the demo distributor).
    const demo = (kind: "shop" | "driver") => new Set(directory.ofKind(kind).filter((p) => isDemoParty(p.id)).map((p) => p.id));
    const allowedShops = mine ? new Set(mine.shops.map((s) => s.id)) : demo("shop");
    const allowedDrivers = mine ? new Set(mine.drivers.map((d) => d.id)) : demo("driver");
    // Check everything before sending anything: the rows come from the browser.
    const ids = new Set<number>();
    for (const [index, row] of rows.entries()) {
      const line = `Fila ${index + 1}`;
      if (!directory.find(row.shopId, "shop") || !allowedShops.has(row.shopId)) return fail(`${line}: tienda desconocida.`);
      if (!directory.find(row.driverId, "driver") || !allowedDrivers.has(row.driverId)) return fail(`${line}: motorista desconocido.`);
      if (!Number.isSafeInteger(row.invoiceId) || row.invoiceId <= 0) return fail(`${line}: número de factura inválido.`);
      if (ids.has(row.invoiceId)) return fail(`${line}: la factura ${row.invoiceId} está repetida.`);
      ids.add(row.invoiceId);
      const amount = String(row.amount).trim();
      if (!AMOUNT.test(amount) || toUnits(amount) <= 0n) return fail(`${line}: monto inválido.`);
      try {
        toUnixSeconds(row.dueDate);
        if (own && dueAt(row.dueDate) === null) throw new Error("fecha");
      } catch {
        return fail(`${line}: fecha inválida.`);
      }
      // Every row follows the form's rules: cents only, up to $10,000, not due in the past.
      const problem = checkInvoice({ ...row, amount }, allowedShops, allowedDrivers);
      if (problem) return fail(`${line}: ${problem}`);
    }
    for (const [index, row] of rows.entries()) {
      if (await chainInvoice(row.invoiceId)) return fail(`Fila ${index + 1}: la factura ${row.invoiceId} ya existe.`);
    }
    for (const row of rows) {
      const { hash } = await run(distributor.id, (client) =>
        client.create_invoice({
          distributor: distributor.address,
          id: BigInt(row.invoiceId),
          shop: directory.find(row.shopId, "shop")!.address,
          driver: directory.find(row.driverId, "driver")!.address,
          amount: toUnits(cleanAmount(String(row.amount))!),
          due: BigInt(own ? dueAt(row.dueDate)! : toUnixSeconds(row.dueDate)),
        }),
      );
      created += 1;
      lastHash = hash;
    }
    const message = created === 1 ? "Listo. Se creó 1 factura." : `Listo. Se crearon ${created} facturas.`;
    return receipt(lastHash, message);
  } catch (error) {
    const result = failure(error);
    if (created === 0) return result;
    return { ...result, message: `Se crearon ${created} de ${rows.length} facturas. ${result.message}` };
  }
}

/** A new invoice from the approved distributor. Throws a Spanish message if it can't. */
/** A demo invoice for one of the demo shops (the trifold's /demo and the demo dashboard). */
export async function createDemoInvoice(): Promise<Invoice> {
  const directory = await getDirectory();
  const distributor = directory.find("distributor", "distributor");
  if (!distributor) throw new Error("Tienda desconocida.");
  let skip = 0n; // ids found taken by someone else (code 1, AlreadyExists)
  for (let attempt = 0; attempt < DEMO_TRIES; attempt++) {
    let id = 0n;
    try {
      await run(distributor.id, async (client) => {
        // Picked inside the distributor's queue so two taps never pick the same id.
        const list = await read(readClient().list_invoices());
        id = list.reduce((max, i) => (i.id > max ? i.id : max), 1000n) + 1n + skip;
        const shop = DEMO_SHOPS[Number(id % 3n)];
        // A few random seconds so two server instances never build the very same
        // transaction: identical ones share a hash, and both judges would get one invoice.
        const jitter = BigInt(Math.floor(Math.random() * 600));
        const due = BigInt(Math.floor(Date.now() / 1000)) + WEEK_SECS + jitter;
        return client.create_invoice({
          distributor: distributor.address,
          id,
          shop: directory.find(shop, "shop")!.address,
          driver: directory.find(DEMO_DRIVER[shop], "driver")!.address,
          amount: toUnits(DEMO_AMOUNTS[Number(id % 3n)]),
          due,
        });
      });
    } catch (error) {
      if (error instanceof ContractError && error.code === 1) {
        skip += 1n;
        continue;
      }
      // Another server instance took the same id between our simulation and the
      // ledger (the transaction fails with no code). Pick again from a fresh list.
      if (error instanceof ContractError && error.code === null) continue;
      console.error("[actions]", error);
      throw new Error(error instanceof ContractError ? error.message : FALLBACK_MESSAGE);
    }
    const created = await getInvoice(Number(id));
    if (created) return created;
  }
  throw new Error(FALLBACK_MESSAGE);
}
