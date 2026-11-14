import { describe, expect, it } from "vitest";
import { creditFee, creditFeeBps, parseAmount, partPayError } from "./labels";

describe("credit fee", () => {
  it("is 1.5% when the whole invoice goes on credit", () => {
    expect(creditFee(100, 100)).toBe(1.5);
    expect(creditFee(150, 150)).toBe(2.25);
    expect(creditFee(85.5, 85.5)).toBe(1.2825);
  });
  it("slides down to 1% the more the shop paid up front, like the contract's tests", () => {
    expect(creditFeeBps(50, 100)).toBe(122);
    expect(creditFee(50, 100)).toBe(0.61);
    expect(creditFeeBps(100, 150)).toBe(131);
    expect(creditFeeBps(10, 100)).toBe(100);
    expect(creditFeeBps(1, 100)).toBe(100);
    // The same rate whether amounts are in cents or 7-decimal units.
    expect(creditFeeBps(50_00, 100_00)).toBe(creditFeeBps(500_000_000, 1_000_000_000));
  });
});

describe("parseAmount", () => {
  it("reads what a shop types", () => {
    expect(parseAmount("12.5")).toBe(12.5);
    expect(parseAmount(" 12,50 ")).toBe(12.5);
    expect(parseAmount("40")).toBe(40);
  });
  it("refuses anything that isn't a positive amount in cents", () => {
    for (const bad of ["", "0", "-5", "abc", "1.234", "1e3", "$5"]) expect(parseAmount(bad)).toBeNull();
  });
});

describe("partPayError", () => {
  it("checks the amount against what's left", () => {
    expect(partPayError("abc", 100)).toBe("Monto inválido.");
    expect(partPayError("100.01", 100)).toBe("El monto es mayor que lo pendiente.");
    expect(partPayError("50", 100)).toBeNull();
    expect(partPayError("100", 100)).toBeNull();
  });
  it("leaves room for cash the driver already recorded", () => {
    expect(partPayError("40", 100, 60)).toBeNull();
    expect(partPayError("40,01", 100, 60)).toBe("Hay $60.00 en efectivo por confirmar. Puede pagar hasta $40.00.");
  });
});
