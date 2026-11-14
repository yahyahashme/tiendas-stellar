import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./session", () => ({ currentUser: async () => null }));

const { checkInvoice, cleanAmount, dueAt, todayInSv } = await import("./invoices");

const shops = new Set(["t-1"]);
const drivers = new Set(["m-1"]);
const good = { invoiceId: 1042, shopId: "t-1", driverId: "m-1", amount: "12.5", dueDate: "2026-11-20", note: "" };

describe("new invoice checks (#133)", () => {
  it("cleans amounts to cents, up to $10,000", () => {
    expect(cleanAmount("12.5")).toBe("12.50");
    expect(cleanAmount("$ 40")).toBe("40.00");
    expect(cleanAmount("7,25")).toBe("7.25");
    for (const bad of ["0", "-3", "1.234", "abc", "", "10000.01"]) expect(cleanAmount(bad)).toBeNull();
    expect(cleanAmount("10000")).toBe("10000.00");
  });

  it("makes the due date the end of that day in El Salvador", () => {
    expect(dueAt("2026-11-20")).toBe(Date.parse("2026-11-21T05:59:59Z") / 1000);
    expect(dueAt("2026-02-30")).toBeNull();
    expect(dueAt("20/11/2026")).toBeNull();
  });

  it("knows today in El Salvador, not UTC", () => {
    expect(todayInSv(Date.parse("2026-11-14T03:00:00Z"))).toBe("2026-11-13");
    expect(todayInSv(Date.parse("2026-11-14T07:00:00Z"))).toBe("2026-11-14");
  });

  it("accepts a good invoice and says what's wrong with a bad one", () => {
    const today = "2026-11-13";
    expect(checkInvoice(good, shops, drivers, today)).toBeNull();
    expect(checkInvoice({ ...good, invoiceId: 0 }, shops, drivers, today)).toBe("Escriba un número de factura (solo números).");
    expect(checkInvoice({ ...good, shopId: "t-other" }, shops, drivers, today)).toBe("Elija una de sus tiendas.");
    expect(checkInvoice({ ...good, driverId: "m-other" }, shops, drivers, today)).toBe("Elija uno de sus motoristas.");
    expect(checkInvoice({ ...good, amount: "0" }, shops, drivers, today)).toBe("Escriba un monto mayor que $0 y hasta $10,000.");
    expect(checkInvoice({ ...good, dueDate: "" }, shops, drivers, today)).toBe("Elija la fecha en que vence.");
    expect(checkInvoice({ ...good, dueDate: "2026-11-12" }, shops, drivers, today)).toBe("La fecha de vencimiento ya pasó.");
    expect(checkInvoice({ ...good, dueDate: today }, shops, drivers, today)).toBeNull();
    expect(checkInvoice({ ...good, note: "x".repeat(301) }, shops, drivers, today)).toBe("La nota puede tener hasta 300 letras.");
  });
});
