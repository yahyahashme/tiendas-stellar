import "server-only";

import { requireDb } from "./db";
import { getDirectory } from "./directory";
import { distributorForUser } from "./distributors";
import { currentUser } from "./session";
import type { User } from "./accounts";

// New invoices from a real distributor (#133): the checks before anything goes
// to the contract, and the optional note / products, which live in Postgres.

export type InvoiceInput = { invoiceId: number; shopId: string; driverId: string; amount: string; dueDate: string; note?: string };

const AMOUNT = /^\d+(\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_AMOUNT = 10_000;
export const MAX_NOTE = 300;

/** "12.5" → "12.50"; null if it isn't a positive amount with at most cents, up to MAX_AMOUNT. */
export function cleanAmount(text: string): string | null {
  const value = text.trim().replace(/^\$\s*/, "").replace(",", ".");
  if (!AMOUNT.test(value)) return null;
  const number = Number(value);
  if (!(number > 0) || number > MAX_AMOUNT) return null;
  return number.toFixed(2);
}

/** The end of that day in El Salvador (UTC-6), in unix seconds; null if not a real date. */
export function dueAt(date: string): number | null {
  if (!DATE.test(date) || new Date(`${date}T00:00:00Z`).toJSON()?.slice(0, 10) !== date) return null;
  return Math.floor(Date.parse(`${date}T23:59:59-06:00`) / 1000);
}

/** Today in El Salvador as YYYY-MM-DD. */
export function todayInSv(now = Date.now()): string {
  return new Date(now - 6 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * Everything wrong with a new invoice before it goes to the contract, or null.
 * `shops` and `drivers` are the ids this distributor may use.
 */
export function checkInvoice(input: InvoiceInput, shops: Set<string>, drivers: Set<string>, today = todayInSv()): string | null {
  if (!Number.isSafeInteger(input.invoiceId) || input.invoiceId <= 0) return "Escriba un número de factura (solo números).";
  if (!shops.has(input.shopId)) return "Elija una de sus tiendas.";
  if (!drivers.has(input.driverId)) return "Elija uno de sus motoristas.";
  if (!cleanAmount(input.amount)) return `Escriba un monto mayor que $0 y hasta $${MAX_AMOUNT.toLocaleString("en-US")}.`;
  if (dueAt(input.dueDate) === null) return "Elija la fecha en que vence.";
  if (input.dueDate < today) return "La fecha de vencimiento ya pasó.";
  if ((input.note ?? "").trim().length > MAX_NOTE) return `La nota puede tener hasta ${MAX_NOTE} letras.`;
  return null;
}

/** Text without accents or case, for matching "tienda marta" to "Tienda Marta". */
export const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export async function saveNote(
  invoice: { invoiceId: number; distributorId: string; shopId: string; driverId: string },
  note: string,
): Promise<void> {
  const text = note.trim();
  if (!text) return;
  await requireDb().query(
    `INSERT INTO invoice_notes (invoice_id, distributor_id, shop_id, driver_id, note) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (invoice_id) DO NOTHING`,
    [invoice.invoiceId, invoice.distributorId, invoice.shopId, invoice.driverId, text.slice(0, MAX_NOTE)],
  );
}

/**
 * The notes on these invoices that this person may read: the distributor who
 * wrote it, the shop's owner, or the driver. What a shop bought isn't public.
 */
export async function notesFor(ids: number[], user: User | null): Promise<Record<number, string>> {
  if (ids.length === 0 || !user) return {};
  const rows = await requireDb().query<{ invoice_id: string | number; note: string }>(
    `SELECT n.invoice_id, n.note FROM invoice_notes n
      WHERE n.invoice_id = ANY($1) AND (
        EXISTS (SELECT 1 FROM distributors d WHERE d.id = n.distributor_id AND d.owner_user_id = $2)
        OR EXISTS (SELECT 1 FROM shops s WHERE s.id = n.shop_id AND s.owner_user_id = $2)
        OR EXISTS (SELECT 1 FROM drivers r WHERE r.id = n.driver_id AND r.user_id = $2))`,
    [ids, user.id],
  );
  return Object.fromEntries(rows.map((r) => [Number(r.invoice_id), r.note]));
}

/** The shops a distributor may invoice: the ones on their list (#132). */
export async function invoiceableShops(distributorId: string): Promise<{ id: string; driverId: string | null; nickname: string | null }[]> {
  const rows = await requireDb().query<{ shop_id: string; driver_id: string | null; nickname: string | null }>(
    `SELECT shop_id, driver_id, nickname FROM distributor_shops WHERE distributor_id = $1 ORDER BY created_at DESC`,
    [distributorId],
  );
  return rows.map((r) => ({ id: r.shop_id, driverId: r.driver_id, nickname: r.nickname }));
}

/** The signed-in user's distributor, if it's approved. */
export async function myApprovedDistributor() {
  const user = await currentUser();
  if (user?.role !== "distribuidora") return null;
  const distributor = await distributorForUser(user.id);
  return distributor?.status === "aprobado" ? distributor : null;
}

export type ApprovedDistributor = NonNullable<Awaited<ReturnType<typeof myApprovedDistributor>>>;

/** The shops (with the distributor's own name for each) and active drivers this distributor can invoice. */
export async function choices(distributor: ApprovedDistributor) {
  const [rows, directory] = await Promise.all([invoiceableShops(distributor.id), getDirectory()]);
  const drivers = directory
    .ofKind("driver")
    .filter((d) => d.distributorId === distributor.id && d.active !== false)
    .map((d) => ({ id: d.id, name: d.name }));
  const shops = rows.flatMap((row) => {
    const party = directory.find(row.id, "shop");
    if (!party) return [];
    const driverId = drivers.some((d) => d.id === row.driverId) ? row.driverId : null;
    return [{ id: row.id, name: row.nickname ?? party.name, owner: party.owner, driverId }];
  });
  return { shops, drivers, directory };
}
