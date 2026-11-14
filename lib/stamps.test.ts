import { describe, expect, it } from "vitest";
import { dueWindow, invoiceMark, MARK } from "./stamps";
import type { Invoice } from "./types";

const NOW = Date.parse("2026-11-14T18:00:00Z"); // noon in El Salvador
const DAY = 24 * 60 * 60 * 1000;
const invoice = (over: Partial<Invoice> = {}): Invoice => ({
  id: 1001,
  shopId: "tienda-1",
  driverId: "motorista-1",
  amount: 150,
  paid: 0,
  dueDate: new Date(NOW + 7 * DAY).toISOString(),
  status: "due",
  ...over,
});

describe("invoiceMark", () => {
  it("is Pendiente for an unpaid invoice due in a week", () => {
    expect(invoiceMark(invoice(), NOW)).toBe("due");
  });

  it("is Parcial once part of it is paid", () => {
    expect(invoiceMark(invoice({ status: "part_paid", paid: 50 }), NOW)).toBe("part");
  });

  it("is Pagada, or En crédito when credit paid it", () => {
    expect(invoiceMark(invoice({ status: "paid", paid: 150, method: "digital" }), NOW)).toBe("paid");
    expect(invoiceMark(invoice({ status: "paid", paid: 150, method: "cash" }), NOW)).toBe("paid");
    expect(invoiceMark(invoice({ status: "paid", paid: 150, method: "credit" }), NOW)).toBe("credit");
  });

  it("is Vence pronto from two days before the due date, and Vencida once that day is over", () => {
    expect(invoiceMark(invoice({ dueDate: new Date(NOW + 3 * DAY).toISOString() }), NOW)).toBe("due");
    expect(invoiceMark(invoice({ dueDate: new Date(NOW + 2 * DAY).toISOString() }), NOW)).toBe("soon");
    expect(invoiceMark(invoice({ dueDate: new Date(NOW + 60 * 60 * 1000).toISOString() }), NOW)).toBe("soon"); // later today
    expect(invoiceMark(invoice({ dueDate: new Date(NOW - DAY).toISOString() }), NOW)).toBe("overdue");
    expect(invoiceMark(invoice({ status: "part_paid", paid: 50, dueDate: new Date(NOW - DAY).toISOString() }), NOW)).toBe("overdue");
  });

  it("puts cash waiting for the shop first, and a paid invoice is never overdue", () => {
    expect(invoiceMark(invoice({ cashClaim: 150, dueDate: new Date(NOW - DAY).toISOString() }), NOW)).toBe("claim");
    expect(invoiceMark(invoice({ status: "paid", paid: 150, method: "digital", dueDate: new Date(NOW - DAY).toISOString() }), NOW)).toBe("paid");
  });

  it("has words in both languages for every mark", () => {
    for (const mark of Object.values(MARK)) {
      expect(mark.es).not.toBe("");
      expect(mark.en).not.toBe("");
    }
  });
});

describe("dueWindow", () => {
  it("sorts invoices by when they are due", () => {
    expect(dueWindow(invoice({ status: "paid", paid: 150 }), NOW)).toBe("settled");
    expect(dueWindow(invoice({ dueDate: new Date(NOW - DAY).toISOString() }), NOW)).toBe("overdue");
    expect(dueWindow(invoice({ dueDate: new Date(NOW + 7 * DAY).toISOString() }), NOW)).toBe("week");
    expect(dueWindow(invoice({ dueDate: new Date(NOW + 8 * DAY).toISOString() }), NOW)).toBe("later");
  });
});
