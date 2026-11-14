import type { Invoice, PayMethod } from "./types";

export type StatusTone = "due" | "part" | "paid" | "credit";

/** The chip label for each tone, in both languages. */
export const STATUS_LABEL: Record<StatusTone, { es: string; en: string }> = {
  due: { es: "Pendiente", en: "Unpaid" },
  part: { es: "Parcial", en: "Part paid" },
  paid: { es: "Pagada", en: "Paid" },
  credit: { es: "Crédito", en: "Credit" },
};

/** The chip on an invoice: Pendiente, Parcial, Pagada, or Crédito (paid with credit). */
export function invoiceStatus(invoice: Invoice, lang: "es" | "en" = "es"): { label: string; tone: StatusTone } {
  const tone: StatusTone =
    invoice.status === "paid" ? (invoice.method === "credit" ? "credit" : "paid") : invoice.status === "part_paid" ? "part" : "due";
  return { label: STATUS_LABEL[tone][lang], tone };
}

const METHODS: Record<PayMethod, { es: string; en: string }> = {
  digital: { es: "Digital", en: "Digital" },
  cash: { es: "Efectivo", en: "Cash" },
  credit: { es: "Crédito", en: "Credit" },
  mixed: { es: "Mixto", en: "Mixed" },
};

/** How an invoice was paid: Digital, Efectivo, Crédito or Mixto. */
export function methodLabel(method: PayMethod, lang: "es" | "en" = "es"): string {
  return METHODS[method][lang];
}

export const METHOD_LABEL: Record<PayMethod, string> = {
  digital: METHODS.digital.es,
  cash: METHODS.cash.es,
  credit: METHODS.credit.es,
  mixed: METHODS.mixed.es,
};

/** What's still to pay, in dollars, without float leftovers like 0.30000000000000004. */
export function leftToPay(invoice: Invoice): number {
  return Math.round((invoice.amount - invoice.paid) * 100) / 100;
}

// The credit fee the distributor pays, the same math as the contract's credit_fee_bps (#135):
// 1.50% when the whole invoice goes on credit, sliding to 1.00% when 10% or less does.
export const CREDIT_FEE_BPS = 150;
export const MIN_CREDIT_FEE_BPS = 100;

/** The rate in bps when `credited` of an invoice of `total` goes on credit (any unit, integers). */
export function creditFeeBps(credited: number, total: number): number {
  if (total <= 0 || credited >= total) return CREDIT_FEE_BPS;
  const tenfold = Math.min(Math.max(credited * 10, total), total * 10);
  return MIN_CREDIT_FEE_BPS + Math.floor(((tenfold - total) * (CREDIT_FEE_BPS - MIN_CREDIT_FEE_BPS)) / (total * 9));
}

// Trusted shops and the recourse tier (#185), the same rules as the contract.
export const LENDER_BPS = 50;
export const TRUSTED_CYCLES = 4;
export const HIGHLY_TRUSTED_CYCLES = 8;
export const RECOURSE_FEE_BPS = 25;
export const RECOURSE_LENDER_BPS = 15;
/** The deposit must stay at least 20% of the vouched credit shops still owe. */
export const RECOURSE_COVER_BPS = 2_000;

/** The buffer's share after `goodCycles` good cycles: all, two thirds from 4, one third from 8 (rounded down). */
export function trustedBufferBps(bufferBps: number, goodCycles: number): number {
  if (goodCycles >= HIGHLY_TRUSTED_CYCLES) return Math.floor(bufferBps / 3);
  if (goodCycles >= TRUSTED_CYCLES) return Math.floor((bufferBps * 2) / 3);
  return bufferBps;
}

/** (buffer, ours) in bps for a pool-tier sale: lenders 0.50%, the rest 3:1 buffer : us, then the trusted cut. */
export function poolFeeSplit(credited: number, total: number, goodCycles = 0): { buffer: number; ours: number } {
  const rest = creditFeeBps(credited, total) - LENDER_BPS;
  const ours = Math.floor(rest / 4);
  return { buffer: trustedBufferBps(rest - ours, goodCycles), ours };
}

/** The whole rate in bps: 0.25% if vouched (and covered), else the pool fee with the trusted cut. */
export function shopCreditFeeBps(credited: number, total: number, goodCycles = 0, vouched = false): number {
  if (vouched) return RECOURSE_FEE_BPS;
  const { buffer, ours } = poolFeeSplit(credited, total, goodCycles);
  return LENDER_BPS + buffer + ours;
}

/** 0 = normal fee, 1 = trusted (4+ good cycles), 2 = 8+. */
export function trustLevel(goodCycles: number): 0 | 1 | 2 {
  return goodCycles >= HIGHLY_TRUSTED_CYCLES ? 2 : goodCycles >= TRUSTED_CYCLES ? 1 : 0;
}

/** The least a deposit can be for `vouchedOut` dollars: 20%, rounded up to the cent. */
export function recourseRequired(vouchedOut: number): number {
  const cents = Math.round(vouchedOut * 100);
  return cents <= 0 ? 0 : Math.ceil((cents * RECOURSE_COVER_BPS) / 10_000) / 100;
}

/**
 * The credit fee in dollars when `credited` dollars of an invoice of `total` go on credit,
 * rounded down in 7-decimal units like the contract ($100 of $100 -> $1.50, $50 of $100 -> $0.61).
 * A trusted shop (`goodCycles`) or a vouched one pays less.
 */
export function creditFee(credited: number, total: number, goodCycles = 0, vouched = false): number {
  const units = Math.round(credited * 100) * 100_000;
  const rate = shopCreditFeeBps(Math.round(credited * 100), Math.round(total * 100), goodCycles, vouched);
  return Math.floor((units * rate) / 10_000) / 10_000_000;
}

/** "12,50" or "12.5" -> 12.5; null if it isn't a positive amount with at most 2 decimals. */
export function parseAmount(text: string): number | null {
  const clean = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const value = Number(clean);
  return value > 0 ? value : null;
}

/**
 * Why a part payment can't go ahead, or null. A pending cash claim keeps its
 * share of what's left, so the shop can still confirm the cash afterwards.
 */
export function partPayError(text: string, left: number, cashClaim = 0): string | null {
  const amount = parseAmount(text);
  if (amount === null) return "Monto inválido.";
  const cents = (n: number) => Math.round(n * 100);
  if (cents(amount) > cents(left)) return "El monto es mayor que lo pendiente.";
  const room = cents(left) - cents(cashClaim);
  if (cashClaim > 0 && cents(amount) > room) {
    return `Hay $${cashClaim.toFixed(2)} en efectivo por confirmar. Puede pagar hasta $${(room / 100).toFixed(2)}.`;
  }
  return null;
}
