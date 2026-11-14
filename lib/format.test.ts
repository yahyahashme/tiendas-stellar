import { describe, expect, it } from "vitest";
import { dueOn, formatDay, formatMoney, plural } from "./format";

describe("formatMoney", () => {
  it("shows dollars with commas and cents", () => {
    expect(formatMoney(1234.5)).toBe("$1,234.50");
    expect(formatMoney(85.5)).toBe("$85.50");
    expect(formatMoney(0)).toBe("$0.00");
  });
});

describe("formatDay", () => {
  it("uses El Salvador time (UTC-6)", () => {
    expect(formatDay("2026-11-20T06:00:00Z")).toBe("20 nov");
    expect(formatDay("2026-11-20T05:59:00Z")).toBe("19 nov");
    expect(formatDay("2027-01-03T18:00:00Z")).toBe("3 ene");
  });

  it("returns an empty string for a bad date", () => {
    expect(formatDay("nope")).toBe("");
  });
});

describe("dueOn", () => {
  const due = "2026-11-20T18:00:00Z"; // noon on 20 nov in El Salvador

  it("says Vence until the due day is over in El Salvador", () => {
    expect(dueOn(due, Date.parse("2026-11-13T12:00:00Z"))).toBe("Vence el 20 nov");
    expect(dueOn(due, Date.parse("2026-11-21T05:59:00Z"))).toBe("Vence el 20 nov"); // 11:59 PM on the 20th
  });

  it("says Venció from the next day", () => {
    expect(dueOn(due, Date.parse("2026-11-21T06:00:00Z"))).toBe("Venció el 20 nov");
  });

  it("returns an empty string for a bad date", () => {
    expect(dueOn("nope", 0)).toBe("");
  });
});

describe("plural", () => {
  it("uses the singular for 1", () => {
    expect(plural(1, "pago", "pagos")).toBe("1 pago");
    expect(plural(0, "pago", "pagos")).toBe("0 pagos");
    expect(plural(3, "pago", "pagos")).toBe("3 pagos");
  });
});

describe("formatPhone", () => {
  it("writes Salvadoran numbers the local way and leaves anything else alone", async () => {
    const { formatPhone } = await import("./format");
    expect(formatPhone("+50370000132")).toBe("7000-0132");
    expect(formatPhone("ana@example.com")).toBe("ana@example.com");
  });
});
