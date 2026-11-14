// A shop's payment history (#136), built the same way from mock data and from the contract:
// one row per payment (a part-paid invoice has several), one row for what's still open on an
// invoice, and one per repayment of credit. Newest first.

import type { HistoryRow, Invoice, Payment, ShopHistory } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const cents = (dollars: number) => Math.round(dollars * 100);

/** Whole days from `due` to `at`, rounded up; 0 if `at` isn't past `due`. */
export function daysPast(due: string, at: number): number {
  const late = at - Date.parse(due);
  return late > 0 ? Math.ceil(late / DAY_MS) : 0;
}

export function buildHistory({
  invoices,
  payments,
  creditOwed,
  creditDue,
  distributor,
  now,
  explorerTx,
}: {
  invoices: Invoice[];
  payments: Payment[];
  creditOwed: number;
  creditDue?: string;
  distributor: string;
  now: number;
  explorerTx?: (hash: string) => string;
}): ShopHistory {
  const rows: HistoryRow[] = [];
  const byInvoice = new Map<number, Payment[]>();
  for (const p of payments) {
    if (p.invoiceId === null) continue;
    byInvoice.set(p.invoiceId, [...(byInvoice.get(p.invoiceId) ?? []), p]);
  }

  for (const invoice of invoices) {
    const found = byInvoice.get(invoice.id) ?? [];
    const several = found.length > 1;
    for (const [i, p] of found.entries()) {
      rows.push({
        key: `${invoice.id}-${i}`,
        kind: "payment",
        invoiceId: invoice.id,
        distributor,
        driverId: p.driverId ?? invoice.driverId,
        method: p.method,
        amount: p.amount,
        partial: several || cents(p.amount) < cents(invoice.amount),
        at: p.at,
        dueDate: invoice.dueDate,
        daysLate: p.at ? daysPast(invoice.dueDate, Date.parse(p.at)) : 0,
        explorerUrl: p.txHash && explorerTx ? explorerTx(p.txHash) : undefined,
      });
    }
    // Paid before the payments we can look up (the network keeps about a week of them).
    const earlier = cents(invoice.paid) - found.reduce((sum, p) => sum + cents(p.amount), 0);
    if (earlier > 0) {
      rows.push({
        key: `${invoice.id}-earlier`,
        kind: "payment",
        invoiceId: invoice.id,
        distributor,
        driverId: invoice.driverId,
        method: invoice.method === "mixed" || !invoice.method ? undefined : invoice.method,
        amount: earlier / 100,
        partial: earlier < cents(invoice.amount),
        dueDate: invoice.dueDate,
        daysLate: 0,
      });
    }
    const left = cents(invoice.amount) - cents(invoice.paid);
    if (left > 0) {
      rows.push({
        key: `${invoice.id}-open`,
        kind: "open",
        invoiceId: invoice.id,
        distributor,
        driverId: invoice.driverId,
        amount: left / 100,
        partial: cents(invoice.paid) > 0,
        dueDate: invoice.dueDate,
        daysLate: daysPast(invoice.dueDate, now),
      });
    }
  }

  for (const [i, p] of payments.entries()) {
    if (p.invoiceId !== null) continue;
    rows.push({
      key: `repay-${i}`,
      kind: "payment",
      invoiceId: null,
      distributor,
      method: "repay",
      amount: p.amount,
      partial: false,
      at: p.at,
      daysLate: 0,
      explorerUrl: p.txHash && explorerTx ? explorerTx(p.txHash) : undefined,
    });
  }

  // Open rows first (most urgent), then payments newest first; undated ones last.
  const paidAt = (r: HistoryRow) => (r.at ? Date.parse(r.at) : 0);
  rows.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "open" ? -1 : 1;
    if (a.kind === "open") return Date.parse(a.dueDate ?? "") - Date.parse(b.dueDate ?? "") || (a.invoiceId ?? 0) - (b.invoiceId ?? 0);
    return paidAt(b) - paidAt(a) || (b.invoiceId ?? 0) - (a.invoiceId ?? 0);
  });

  const open = rows.filter((r) => r.kind === "open");
  const owedNow = (open.reduce((sum, r) => sum + cents(r.amount), 0) + cents(creditOwed)) / 100;
  const dues = [...open.map((r) => r.dueDate as string), ...(creditOwed > 0 && creditDue ? [creditDue] : [])].sort();
  const month = new Date(now);
  const paidThisMonth =
    rows
      .filter((r) => {
        if (r.kind !== "payment" || !r.at || r.method === "credit") return false; // credit is paid by the pool; the shop pays it back as "repay"
        const at = new Date(r.at);
        return at.getUTCFullYear() === month.getUTCFullYear() && at.getUTCMonth() === month.getUTCMonth();
      })
      .reduce((sum, r) => sum + cents(r.amount), 0) / 100;

  return { rows, owedNow, nextDue: dues[0], paidThisMonth };
}
