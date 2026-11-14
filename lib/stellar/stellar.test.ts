import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { addressOf, roleOf, SHOP_IDS, DRIVER_IDS } = await import("./config");
const { contractErrorCode, errorMessage, ContractError, FALLBACK_MESSAGE } = await import("./errors");
const { secretEnvName } = await import("./keys");
const { toInvoice, toShop } = await import("./map");
const { Directory, seedParties } = await import("@/lib/server/directory");
const DIR = new Directory(seedParties());
const ROSA = DIR.byId("tienda-1")!;
const { fromUnits, toDollars, toUnits } = await import("./units");

const SHOP = addressOf("tienda-1") as string;
const DRIVER = addressOf("motorista-1") as string;

describe("units", () => {
  it("turns dollar strings into 7-decimal units without floats", () => {
    expect(toUnits("150")).toBe(1_500_000_000n);
    expect(toUnits("85.50")).toBe(855_000_000n);
    expect(toUnits((0.1 + 0.2).toFixed(2))).toBe(3_000_000n);
    expect(toUnits(" 12.5 ")).toBe(125_000_000n);
    expect(() => toUnits("-5")).toThrow("Monto inválido.");
    expect(() => toUnits("1e3")).toThrow("Monto inválido.");
  });
  it("turns units back into dollars", () => {
    expect(fromUnits(1_476_000_000n)).toBe("147.60");
    expect(fromUnits(5_250_000n)).toBe("0.525");
    expect(fromUnits(0n)).toBe("0.00");
    expect(fromUnits(-5_000_000n)).toBe("-0.50");
    expect(toDollars(855_000_000n)).toBe(85.5);
  });
});

describe("errors", () => {
  it("reads the contract's error number from SDK text", () => {
    expect(contractErrorCode('HostError: Error(Contract, #4)\n...')).toBe(4);
    expect(contractErrorCode("network down")).toBeNull();
  });
  it("says it in Spanish, with a fallback", () => {
    expect(errorMessage(5)).toBe("Esta factura ya está pagada.");
    expect(errorMessage(14)).toBe(FALLBACK_MESSAGE);
    expect(errorMessage(null)).toBe(FALLBACK_MESSAGE);
    expect(new ContractError(4).message).toBe("El monto es mayor que lo pendiente.");
  });
});

describe("config and keys", () => {
  it("maps addresses to the app's ids and back", () => {
    expect(SHOP_IDS).toEqual(["tienda-1", "tienda-2", "tienda-3"]);
    expect(DRIVER_IDS).toEqual(["motorista-1", "motorista-2"]);
    expect(roleOf(SHOP)).toBe("tienda-1");
    expect(roleOf("GUNKNOWN")).toBe("GUNKNOWN");
  });
  it("names the env var for each role", () => {
    expect(secretEnvName("motorista-1")).toBe("STELLAR_SECRET_MOTORISTA_1");
    expect(secretEnvName("admin")).toBe("STELLAR_SECRET_ADMIN");
  });
});

describe("map", () => {
  const chainInvoice = {
    id: 1001n,
    distributor: addressOf("distributor") as string,
    shop: SHOP,
    driver: DRIVER,
    amount: 1_500_000_000n,
    paid: 600_000_000n,
    due: 1_795_154_400n,
    status: { tag: "PartPaid", values: undefined },
    method: { tag: "Digital", values: undefined },
    credit_fee: 0n,
  } as const;

  it("turns a contract invoice into the screens' invoice", () => {
    expect(toInvoice(chainInvoice, DIR)).toEqual({
      id: 1001,
      shopId: "tienda-1",
      driverId: "motorista-1",
      amount: 150,
      paid: 60,
      dueDate: "2026-11-20T06:00:00.000Z",
      status: "part_paid",
      method: "digital",
    });
  });

  it("adds a pending cash claim when there is one", () => {
    expect(toInvoice(chainInvoice, DIR, 500_000_000n).cashClaim).toBe(50);
    expect(toInvoice(chainInvoice, DIR, 0n)).not.toHaveProperty("cashClaim");
  });

  it("leaves method out while nothing is paid", () => {
    const unpaid = { ...chainInvoice, paid: 0n, status: { tag: "Due", values: undefined }, method: { tag: "None", values: undefined } } as const;
    expect(toInvoice(unpaid, DIR)).not.toHaveProperty("method");
    expect(toInvoice(unpaid, DIR).status).toBe("due");
  });

  it("turns a ShopView into the screens' shop", () => {
    const view = { limit: 2_000_000_000n, owed: 500_000_000n, due_at: 1_795_154_400n, overdue: false, on_time: 2, late: 0, total_repaid: 0n, written_off: 0n, late_minor: 0, late_major: 0, max_days_late: 0, first_credit_at: 0n };
    expect(toShop(ROSA, view)).toEqual({
      id: "tienda-1",
      name: "Tienda Rosa",
      owner: "Rosa Martínez",
      creditLimit: 200,
      creditOwed: 50,
      creditDue: "2026-11-20T06:00:00.000Z",
      overdue: false,
      onTime: 2,
      late: 0,
      lateMinor: 0,
      lateMajor: 0,
      maxDaysLate: 0,
    });
    expect(toShop(ROSA, { ...view, owed: 0n, due_at: 0n })).not.toHaveProperty("creditDue");
  });
});
