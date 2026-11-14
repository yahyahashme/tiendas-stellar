import { describe, expect, it } from "vitest";
import { creditScore } from "./credit";
import type { HistoryRow, Shop } from "./types";

const NOW = Date.parse("2026-11-13T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const shop = (over: Partial<Shop> = {}): Shop => ({
  id: "tienda-1", name: "Tienda Rosa", owner: "Rosa", creditLimit: 200, creditOwed: 0, overdue: false, onTime: 0, late: 0, lateMinor: 0, lateMajor: 0, maxDaysLate: 0, ...over,
});
const paid = (daysAgo: number, daysLate = 0, amount = 100): HistoryRow => ({
  key: `${daysAgo}-${daysLate}`, kind: "payment", invoiceId: 1, distributor: "El Sol", method: "digital",
  amount, partial: false, at: new Date(NOW - daysAgo * DAY).toISOString(), daysLate,
});

describe("Relay score (#137)", () => {
  it("is middling and says so for a shop with no history", () => {
    const s = creditScore(shop(), [], 1, NOW);
    expect(s.isNew).toBe(true);
    expect(s.score).toBeGreaterThanOrEqual(45);
    expect(s.score).toBeLessThan(65);
    expect(s.reasons.map((r) => r.es)).toContain("Todavía no tiene pagos en Relay");
  });

  it("is excellent for a long, on-time record with room on the limit and several suppliers", () => {
    const rows = Array.from({ length: 20 }, (_, i) => paid(i * 10));
    const s = creditScore(shop({ onTime: 14, creditOwed: 40 }), rows, 3, NOW);
    expect(s.label).toBe("excelente");
    expect(s.reasons[0]).toMatchObject({ es: "Pagó 34 de 34 a tiempo", good: true });
  });

  it("drops with late payments and a full limit, and names both", () => {
    const rows = [paid(5, 10), paid(12, 4), paid(20)];
    const s = creditScore(shop({ onTime: 1, late: 2, creditOwed: 195 }), rows, 1, NOW);
    expect(["regular", "riesgo"]).toContain(s.label);
    const texts = s.reasons.map((r) => r.es);
    expect(texts).toContain("Pagó 2 de 6 a tiempo");
    expect(texts).toContain("Usa casi todo su límite");
    expect(s.tips[0].es).toMatch(/a tiempo/);
  });

  it("counts one day late as late, and old late marks as half", () => {
    const oneDay = creditScore(shop({ onTime: 4 }), [paid(3, 1)], 1, NOW).score;
    const onTime = creditScore(shop({ onTime: 4 }), [paid(3, 0)], 1, NOW).score;
    expect(oneDay).toBeLessThan(onTime);
    const recentLate = creditScore(shop({ onTime: 4 }), [paid(10, 10), paid(3)], 1, NOW).score;
    const oldLate = creditScore(shop({ onTime: 4 }), [paid(250, 10), paid(3)], 1, NOW).score;
    expect(oldLate).toBeGreaterThan(recentLate);
  });

  const open = (daysLate: number, amount = 50): HistoryRow => ({
    key: `open-${daysLate}`, kind: "open", invoiceId: 2, distributor: "El Sol", amount, partial: false,
    dueDate: new Date(NOW - daysLate * DAY).toISOString(), daysLate,
  });
  const good = () => ({ rows: Array.from({ length: 20 }, (_, i) => paid(i * 10)), shop: { onTime: 10, creditOwed: 0 } });

  it("caps a written-off shop at 30 and says why first", () => {
    const g = good();
    const s = creditScore(shop({ ...g.shop, writtenOff: 120 }), g.rows, 3, NOW);
    expect(s.score).toBeLessThanOrEqual(30);
    expect(s.label).toBe("riesgo");
    expect(s.reasons[0]).toMatchObject({ es: "Tiene una deuda de crédito que no pagó", good: false });
  });

  it("caps an invoice 30 days past due at 40", () => {
    const g = good();
    const s = creditScore(shop(g.shop), [open(30), ...g.rows], 3, NOW);
    expect(s.score).toBeLessThanOrEqual(40);
    expect(s.label).toBe("riesgo");
    expect(s.reasons[0].es).toBe("Tiene un pago vencido hace 30 días");
    expect(s.tips[0].es).toMatch(/vencido/);
  });

  it("caps credit past due at 60", () => {
    const g = good();
    const due = new Date(NOW - 3 * DAY).toISOString();
    const s = creditScore(shop({ ...g.shop, creditOwed: 80, overdue: true, creditDue: due }), g.rows, 3, NOW);
    expect(s.score).toBeLessThanOrEqual(60);
    expect(s.label).not.toBe("excelente");
    expect(s.reasons[0].es).toBe("Tiene un pago vencido hace 3 días");
  });

  it("keeps a shop that never used credit below excellent", () => {
    const rows = Array.from({ length: 26 }, (_, i) => paid(i * 7));
    const s = creditScore(shop(), rows, 3, NOW);
    expect(s.score).toBeLessThanOrEqual(79);
    expect(s.reasons.map((r) => r.es)).toContain("Todavía no ha usado crédito");
  });

  it("stays between 0 and 100", () => {
    const s = creditScore(shop({ late: 30, creditOwed: 200 }), [paid(1, 30)], 0, NOW);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.label).toBe("riesgo");
  });
});
