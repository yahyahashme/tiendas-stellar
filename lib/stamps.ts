// Which stamp an invoice carries in a list (the distributor's ledger, the driver's route sheet),
// and which due-date group it falls in. Words and tone only: the Stamp component draws it.

import { isPastDue } from "./format";
import type { Invoice } from "./types";

export type InvoiceMark = "paid" | "credit" | "claim" | "overdue" | "soon" | "part" | "due";

export const MARK: Record<InvoiceMark, { es: string; en: string; tone: "ok" | "credit" | "confirm" | "bad" | "warn" | "ink" }> = {
  paid: { es: "Pagada", en: "Paid", tone: "ok" },
  credit: { es: "En crédito", en: "On credit", tone: "credit" },
  claim: { es: "Por confirmar", en: "To confirm", tone: "confirm" },
  overdue: { es: "Vencida", en: "Overdue", tone: "bad" },
  soon: { es: "Vence pronto", en: "Due soon", tone: "warn" },
  part: { es: "Parcial", en: "Part paid", tone: "ink" },
  due: { es: "Pendiente", en: "Unpaid", tone: "ink" },
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** "Vence pronto" starts two days before the due date. */
const SOON_MS = 2 * DAY_MS;

/**
 * One stamp per invoice, the most pressing fact first: paid (with credit or not), then cash the shop
 * still has to confirm, then overdue, due soon, part paid, unpaid. `now` is in milliseconds.
 */
export function invoiceMark(invoice: Invoice, now: number): InvoiceMark {
  if (invoice.status === "paid") return invoice.method === "credit" ? "credit" : "paid";
  if (invoice.cashClaim !== undefined) return "claim";
  if (isPastDue(invoice.dueDate, now)) return "overdue";
  const due = Date.parse(invoice.dueDate);
  if (!Number.isNaN(due) && due - now <= SOON_MS) return "soon";
  return invoice.status === "part_paid" ? "part" : "due";
}

export type DueWindow = "settled" | "overdue" | "week" | "later";

/** Where an invoice's due date falls: paid already, past due, within the next seven days, or after that. */
export function dueWindow(invoice: Invoice, now: number): DueWindow {
  if (invoice.status === "paid") return "settled";
  if (isPastDue(invoice.dueDate, now)) return "overdue";
  const due = Date.parse(invoice.dueDate);
  return !Number.isNaN(due) && due - now <= 7 * DAY_MS ? "week" : "later";
}
