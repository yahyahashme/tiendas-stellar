import { describe, expect, it } from "vitest";
import { driverInviteLink, dueTomorrowLink, receiptLink, reminderLink, shopInviteLink } from "./whatsapp";

const now = 1_794_506_400;
const input = {
  phone: "7123-4567",
  shopName: "Tienda Rosa",
  amountUnits: 1_500_000_000n,
  dueAt: now + 172_800,
  now,
};

describe("reminderLink", () => {
  it.each(["7123-4567", "71234567", "+503 7123 4567", "503 71234567"])(
    "normalizes mobile number %s",
    (phone) => {
      expect(reminderLink({ ...input, phone })).toMatch(/^https:\/\/wa\.me\/50371234567\?text=/);
    },
  );

  it.each([
    ["2234-5678", "/50322345678"],
    ["6234-5678", "/50362345678"],
  ])("accepts local number %s", (phone, pathname) => {
    const url = new URL(reminderLink({ ...input, phone }));
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe(pathname);
  });

  it.each(["1234567", "+1 519 555 0123", "51234567", "abc", "++503 7123 4567"])(
    "rejects invalid phone number %s",
    (phone) => {
      expect(() => reminderLink({ ...input, phone })).toThrow(
        "Número de teléfono inválido: use 8 dígitos de El Salvador, por ejemplo 7123-4567",
      );
    },
  );

  it("prefills the Spanish reminder for an upcoming payment", () => {
    const url = new URL(reminderLink(input));
    expect(url.searchParams.get("text")).toBe(
      "Hola Tienda Rosa, le recordamos que su pago de $150.00 vence en 2 días. ¡Gracias!",
    );
  });

  it("prefills the Spanish reminder for an overdue payment", () => {
    const url = new URL(reminderLink({ ...input, dueAt: now - 259_200 }));
    expect(url.searchParams.get("text")).toBe(
      "Hola Tienda Rosa, le recordamos que su pago de $150.00 venció hace 3 días. ¡Gracias!",
    );
  });

  it.each([0, -1])("prefills the pending-payment reminder for due timestamp %s", (dueAt) => {
    const url = new URL(reminderLink({ ...input, dueAt }));
    expect(url.searchParams.get("text")).toBe(
      "Hola Tienda Rosa, le recordamos su pago pendiente de $150.00. ¡Gracias!",
    );
  });

  it("includes the supplied payment URL in the encoded reminder", () => {
    const link = "https://relay-sv.vercel.app/tienda/1001?from=whatsapp&lang=es";
    const url = new URL(reminderLink({ ...input, link }));
    expect([...url.searchParams.keys()]).toEqual(["text"]);
    expect(url.searchParams.get("text")).toBe(
      `Hola Tienda Rosa, le recordamos que su pago de $150.00 vence en 2 días. Puede pagar aquí: ${link} ¡Gracias!`,
    );
  });

  it("keeps shop name punctuation and accents inside the message", () => {
    const url = new URL(reminderLink({ ...input, shopName: "Tienda Peña & Hijos #1" }));
    expect([...url.searchParams.keys()]).toEqual(["text"]);
    expect(url.searchParams.get("text")).toContain("Hola Tienda Peña & Hijos #1,");
    expect(url.hash).toBe("");
  });

  it.each([0n, -1n])("rejects a payment amount of %s units", (amountUnits) => {
    expect(() => reminderLink({ ...input, amountUnits })).toThrow("Monto inválido.");
  });

  it("adds the payment link when there is one", () => {
    const url = new URL(reminderLink({ ...input, link: "https://relay-sv.vercel.app/tienda/cuenta/tienda-1" }));
    expect(url.searchParams.get("text")).toContain("Puede pagar aquí: https://relay-sv.vercel.app/tienda/cuenta/tienda-1 ¡Gracias!");
  });
});

describe("additional WhatsApp links", () => {
  const link = "https://relay-sv.vercel.app/invite?code=abc&role=shop";
  const invite = { phone: "+503 7123-4567", distributorName: "Distribuidora El Sol", link };
  const receipt = {
    phone: input.phone,
    shopName: input.shopName,
    invoiceId: 1001,
    amountUnits: input.amountUnits,
    paidAt: Date.parse("2026-11-13T05:59:00Z") / 1000,
  };

  it("prefills the driver invite and preserves the invitation URL", () => {
    const url = new URL(driverInviteLink({ ...invite, driverName: "Ana" }));
    expect(url.origin + url.pathname).toBe("https://wa.me/50371234567");
    expect([...url.searchParams.keys()]).toEqual(["text"]);
    expect(url.searchParams.get("text")).toBe(
      `Hola Ana, Distribuidora El Sol lo invitó a Relay para ver su ruta del día. Cree su cuenta aquí: ${link}`,
    );
  });

  it("prefills the shop invite", () => {
    const url = new URL(shopInviteLink({ ...invite, shopName: input.shopName }));
    expect(url.searchParams.get("text")).toBe(
      `Hola Tienda Rosa, Distribuidora El Sol ya usa Relay para sus facturas. Cree su cuenta gratis y pague sus pedidos desde el teléfono: ${link}`,
    );
  });

  it.each([
    ["digital", "Dólares digitales"],
    ["efectivo", "Efectivo"],
    ["credito", "Crédito 7 días"],
  ] as const)("formats a %s receipt with the El Salvador date", (method, label) => {
    const url = new URL(receiptLink({ ...receipt, method }));
    expect(url.searchParams.get("text")).toBe(`Recibo Relay · Factura 1001 · $150.00 · ${label} · 12/11/2026`);
  });

  it("includes the driver on the receipt when supplied", () => {
    const url = new URL(receiptLink({ ...receipt, method: "efectivo", driverName: "Ana" }));
    expect(url.searchParams.get("text")).toBe("Recibo Relay · Factura 1001 · $150.00 · Efectivo · 12/11/2026 · Entregado a Ana");
  });

  it("uses the existing payment reminder for a debt due in exactly 24 hours", () => {
    const url = new URL(dueTomorrowLink({ ...input, dueAt: now + 86_400, link }));
    expect(url.searchParams.get("text")).toBe(
      `Hola Tienda Rosa, le recordamos que su pago de $150.00 vence mañana. Puede pagar aquí: ${link} ¡Gracias!`,
    );
  });

  it.each([-1, 0, 86_401, NaN, Infinity])("rejects a due time %s seconds from now outside the next 24 hours", (offset) => {
    expect(() => dueTomorrowLink({ ...input, dueAt: now + offset })).toThrow("La deuda no vence mañana.");
  });

  it("uses the same invalid-phone error in every message helper", () => {
    const phone = "51234567";
    const error = "Número de teléfono inválido: use 8 dígitos de El Salvador, por ejemplo 7123-4567";
    expect(() => driverInviteLink({ ...invite, phone, driverName: "Ana" })).toThrow(error);
    expect(() => shopInviteLink({ ...invite, phone, shopName: input.shopName })).toThrow(error);
    expect(() => receiptLink({ ...receipt, phone, method: "digital" })).toThrow(error);
    expect(() => dueTomorrowLink({ ...input, phone, dueAt: now + 86_400 })).toThrow(error);
  });
});
