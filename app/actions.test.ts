import { describe, expect, it, vi } from "vitest";

// The CSV import with nobody signed in (Jack's review of #149): only the demo's
// shops and drivers, and the form's limits. No chain, no database.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/session", () => ({ currentUser: async () => null }));
const sent: unknown[] = [];
vi.mock("@/lib/stellar/send", () => ({
  read: async () => ({ isOk: () => false }), // no invoice with that id yet
  run: async (role: string, call: (client: unknown) => unknown) => {
    sent.push(role);
    await call({ create_invoice: async (args: unknown) => args });
    return { hash: "abc" };
  },
}));
vi.mock("@/lib/stellar/client", () => ({ readClient: () => ({ get_invoice: async () => ({}) }) }));
vi.mock("@/lib/server/directory", async (original) => {
  const real = await original<typeof import("@/lib/server/directory")>();
  const realShop = { id: "t-real", kind: "shop" as const, name: "Tienda Real", owner: "Rosa", address: "GREALSHOP" };
  const realDriver = { id: "m-real", kind: "driver" as const, name: "Pedro", owner: "Pedro", address: "GREALDRIVER", distributorId: "d-1", active: true };
  return { ...real, getDirectory: async () => new real.Directory([...real.seedParties(), realShop, realDriver]) };
});

const { createInvoices } = await import("./actions");

const row = { invoiceId: 7001, shopId: "tienda-1", driverId: "motorista-1", amount: "12.50", dueDate: "2099-01-01" };

describe("createInvoices signed out", () => {
  it("refuses a real shop or driver, and the form's limits", async () => {
    expect((await createInvoices([{ ...row, shopId: "t-real" }])).message).toBe("Fila 1: tienda desconocida.");
    expect((await createInvoices([{ ...row, driverId: "m-real" }])).message).toBe("Fila 1: motorista desconocido.");
    expect((await createInvoices([{ ...row, amount: "9999999" }])).message).toBe("Fila 1: Escriba un monto mayor que $0 y hasta $10,000.");
    expect((await createInvoices([{ ...row, dueDate: "2020-01-01" }])).message).toBe("Fila 1: La fecha de vencimiento ya pasó.");
    expect(sent).toEqual([]);
  });

  it("still creates a demo invoice", async () => {
    const receipt = await createInvoices([row]);
    expect(receipt).toMatchObject({ ok: true, message: "Listo. Se creó 1 factura." });
    expect(sent).toEqual(["distributor"]);
  });
});
