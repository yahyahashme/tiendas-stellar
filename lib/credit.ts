// The Relay score (#137): a 0-100 picture of how a shop pays, worked out off-chain from the
// contract's counters and the shop's payment history (lib/history.ts). It is ours, not a
// bureau's: the shop sees why it has it, and nothing is shared without its consent.
//
// Weights, as in the issue:
// - 50% payment record: each payment on time or late, weighted by amount and recency. Repaid
//   credit counts fully; pay-at-delivery (digital or confirmed cash) counts half, as trade history.
//   Late marks older than 6 months count half. Any day late counts as late (the history says so too).
//
// Bad outcomes cap the score, whatever the record: a written-off debt caps it at 30 ("En riesgo"),
// debt 8+ days past due at 40, any debt past due at 60, and a shop that never used credit at 79,
// since paying on delivery shows less than repaying credit.
// - 20% use of the limit: under 30% scores full, all of it scores 0.
// - 20% length: credit cycles (12 for full) and months of history (6 for full).
// - 10% suppliers on Relay that sell to the shop (3 for full).

import type { HistoryRow, Shop } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const HALF_LIFE_MS = 182 * DAY_MS;

export type ScoreLabel = "excelente" | "bueno" | "regular" | "riesgo";
/** A reason in both languages, and whether it helps (+) or hurts (-). */
export type Reason = { es: string; en: string; good: boolean; weight: number };
export type CreditScore = { score: number; label: ScoreLabel; reasons: Reason[]; tips: { es: string; en: string }[]; isNew: boolean };

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** 1 for on time, 0.5 for 1-7 days late, 0 for 8+. */
const onTimeScore = (daysLate: number) => (daysLate <= 0 ? 1 : daysLate <= 7 ? 0.5 : 0);

export function creditScore(shop: Shop, rows: HistoryRow[], suppliers: number, now: number): CreditScore {
  // 1. Payment record.
  let weighted = 0;
  let total = 0;
  let paidOnTime = 0;
  let paidCount = 0;
  for (const r of rows) {
    if (r.kind !== "payment" || r.method === "repay" || r.method === "credit") continue; // credit: see the counters below
    const age = r.at ? now - Date.parse(r.at) : HALF_LIFE_MS;
    const recency = age > HALF_LIFE_MS ? 0.5 : 1;
    const w = 0.5 * Math.sqrt(Math.max(r.amount, 1)) * recency; // bigger payments count more, but not linearly
    const s = onTimeScore(r.daysLate);
    // An old late mark counts half: move it halfway toward on time.
    weighted += w * (s < 1 && recency < 1 ? (s + 1) / 2 : s);
    total += w;
    paidCount += 1;
    if (s === 1) paidOnTime += 1;
  }
  // Credit cycles from the contract: on time counts fully, each late one as a miss.
  const cycleWeight = Math.sqrt(Math.max(shop.creditLimit, 50)); // about one cycle's size
  weighted += shop.onTime * cycleWeight;
  total += (shop.onTime + shop.late) * cycleWeight;
  const isNew = total === 0;
  const record = isNew ? 0.6 : weighted / total;

  // 2. Use of the limit.
  const use = shop.creditLimit > 0 ? shop.creditOwed / shop.creditLimit : 0;
  const usage = 1 - clamp((use - 0.3) / 0.7);

  // 3. Length of history.
  const cycles = shop.onTime + shop.late;
  const dates = rows.filter((r) => r.at).map((r) => Date.parse(r.at as string));
  const first = Math.min(...dates, Infinity);
  const months = Number.isFinite(first) ? (now - first) / (30 * DAY_MS) : 0;
  const length = 0.6 * clamp(cycles / 12) + 0.4 * clamp(months / 6);

  // 4. Suppliers on Relay.
  const breadth = clamp(suppliers / 3);

  // 5. Bad outcomes cap the score.
  const openPast = Math.max(0, ...rows.filter((r) => r.kind === "open").map((r) => r.daysLate));
  const creditPast = shop.overdue
    ? Math.max(1, shop.creditDue ? Math.ceil((now - Date.parse(shop.creditDue)) / DAY_MS) : 1)
    : 0;
  const daysPast = Math.max(openPast, creditPast);
  const writtenOff = (shop.writtenOff ?? 0) > 0;
  const cap = writtenOff ? 30 : daysPast >= 8 ? 40 : daysPast > 0 ? 60 : !isNew && cycles === 0 ? 79 : 100;

  const score = Math.min(cap, Math.round(100 * (0.5 * record + 0.2 * usage + 0.2 * length + 0.1 * breadth)));
  const label: ScoreLabel = score >= 80 ? "excelente" : score >= 65 ? "bueno" : score >= 45 ? "regular" : "riesgo";

  // Reasons, strongest first: how far each part is from "fine", times its weight.
  const onTimeAll = paidOnTime + shop.onTime;
  const countAll = paidCount + shop.onTime + shop.late;
  const reasons: Reason[] = [];
  if (countAll > 0) {
    reasons.push({
      es: `Pagó ${onTimeAll} de ${countAll} a tiempo`,
      en: `Paid ${onTimeAll} of ${countAll} on time`,
      good: record >= 0.8,
      weight: 0.5 * Math.abs(record - 0.7) + 0.05,
    });
  } else {
    reasons.push({ es: "Todavía no tiene pagos en Relay", en: "No payments on Relay yet", good: false, weight: 0.1 });
  }
  if (shop.creditLimit > 0) {
    const pct = Math.round(use * 100);
    reasons.push(
      use > 0.7
        ? { es: "Usa casi todo su límite", en: "Uses almost all of the limit", good: false, weight: 0.2 * (1 - usage) + 0.02 }
        : { es: `Usa ${pct}% de su límite`, en: `Uses ${pct}% of the limit`, good: true, weight: 0.2 * usage * 0.5 },
    );
  }
  reasons.push(
    cycles >= 6
      ? { es: `${cycles} ciclos de crédito pagados`, en: `${cycles} credit cycles paid`, good: true, weight: 0.2 * length * 0.5 }
      : { es: "Historial corto", en: "Short history", good: false, weight: 0.2 * (1 - length) * 0.5 },
  );
  reasons.push(
    suppliers >= 2
      ? { es: `Le venden ${suppliers} proveedores en Relay`, en: `${suppliers} suppliers sell to it on Relay`, good: true, weight: 0.05 }
      : { es: "Compra a un solo proveedor en Relay", en: "Buys from one supplier on Relay", good: false, weight: 0.03 },
  );
  // A cap is the main reason, so it goes first.
  if (writtenOff) {
    reasons.push({ es: "Tiene una deuda de crédito que no pagó", en: "Has credit debt it did not repay", good: false, weight: 2 });
  } else if (daysPast > 0) {
    reasons.push({
      es: daysPast === 1 ? "Tiene un pago vencido hace 1 día" : `Tiene un pago vencido hace ${daysPast} días`,
      en: daysPast === 1 ? "Has a payment 1 day past due" : `Has a payment ${daysPast} days past due`,
      good: false,
      weight: 1.5,
    });
  } else if (cap === 79) {
    reasons.push({ es: "Todavía no ha usado crédito", en: "Has not used credit yet", good: false, weight: 0.6 });
  }
  reasons.sort((a, b) => b.weight - a.weight);

  const tips: { es: string; en: string }[] = [];
  if (writtenOff || daysPast > 0) tips.push({ es: "Pague lo vencido: es lo primero que se mira.", en: "Pay what is past due: it is the first thing anyone checks." });
  if (record < 0.95) tips.push({ es: "Pague cada deuda a tiempo: es lo que más cuenta.", en: "Pay every debt on time: it counts the most." });
  if (use > 0.5) tips.push({ es: "Deje libre parte de su límite.", en: "Keep part of your limit unused." });
  if (cycles < 12) tips.push({ es: "Cada semana que paga a tiempo alarga su historial.", en: "Every week you pay on time makes your history longer." });
  if (suppliers < 3) tips.push({ es: "Pida a sus otros proveedores que usen Relay.", en: "Ask your other suppliers to use Relay." });

  return { score, label, reasons: reasons.slice(0, 3), tips: tips.slice(0, 2), isNew };
}

export const SCORE_LABEL: Record<ScoreLabel, { es: string; en: string; tone: "paid" | "credit" | "due" | "overdue" }> = {
  excelente: { es: "Excelente", en: "Excellent", tone: "paid" },
  bueno: { es: "Bueno", en: "Good", tone: "credit" },
  regular: { es: "Regular", en: "Fair", tone: "due" },
  riesgo: { es: "En riesgo", en: "At risk", tone: "overdue" },
};
