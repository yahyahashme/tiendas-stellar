import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { translateMessage } from "./translate";

const root = join(__dirname, "..");
const source = (path: string) => readFileSync(join(root, path), "utf8");

// Words that only show up in Spanish. If one is left after translating, a rule is missing.
const SPANISH = /\b(factura|facturas|tienda|motorista|monto|pago|pagar|pagada|deuda|efectivo|crédito|límite|listo|fila|falta|tiene|está|intente|inválid[oa]|encontramos|dólares|vencido|recibido)\b/i;

// Accounts and the screens built on them (#129 on): their messages come back from the server too.
const SERVER_FILES = ["app/auth-actions.ts", "lib/server/accounts.ts", "app/distributor-actions.ts", "lib/server/distributors.ts", "app/registro/distributor-form.tsx", "app/driver-actions.ts", "lib/server/drivers.ts", "app/shop-actions.ts", "lib/server/shops.ts", "app/invoice-actions.ts", "lib/server/invoices.ts", "app/shop-signup-actions.ts", "components/shop-signup.tsx", "lib/server/authz.ts", "lib/server/rate-limit.ts"];

describe("translateMessage", () => {
  // One example of every message the server, the mock, the contract and the CSV parser send.
  const examples: [string, string][] = [
    ["Pago recibido: $45.00 en dólares digitales.", "Payment received: $45.00 in digital dollars."],
    ["Pago recibido: $20.00. Falta $1,040.50.", "Payment received: $20.00. $1,040.50 left to pay."],
    ["Listo. Tiene hasta el 20 nov para pagar $60.00, sin intereses.", "Done. You have until Nov 20 to pay $60.00, with no interest."],
    ["Listo. Tiene hasta el 3 ene para pagar $85.50, sin intereses.", "Done. You have until Jan 3 to pay $85.50, with no interest."],
    ["Listo. Ahora la tienda debe tocar «Confirmo».", "Done. Now the shop has to tap “Confirm”."],
    ["Listo. Confirmó $45.00 en efectivo.", "Done. You confirmed $45.00 in cash."],
    ["Listo. Carlos entregó $105.00 en efectivo.", "Done. Carlos handed in $105.00 in cash."],
    ["Deuda pagada con atraso. Su límite bajó a $175.00.", "Debt paid late. Your limit went down to $175.00."],
    ["Deuda pagada con atraso.", "Debt paid late."],
    ["Deuda pagada a tiempo. Su límite subió a $225.00.", "Debt paid on time. Your limit went up to $225.00."],
    ["Deuda pagada a tiempo. Gracias.", "Debt paid on time. Thank you."],
    ["El monto es mayor que lo que falta pagar ($12.00).", "The amount is more than what's left to pay ($12.00)."],
    ["El monto es mayor que lo que falta pagar.", "The amount is more than what's left to pay."],
    ["Hay $30.00 en efectivo por confirmar. Puede pagar hasta $15.00.", "$30.00 in cash is waiting to be confirmed. You can pay up to $15.00."],
    ["El efectivo registrado es mayor que lo que falta pagar.", "The cash registered is more than what's left to pay."],
    ["Listo. Se creó 1 factura.", "Done. 1 invoice created."],
    ["Listo. Se crearon 8 facturas.", "Done. 8 invoices created."],
    ["Se creó 1 factura.", "1 invoice created."],
    ["Se crearon 8 facturas.", "8 invoices created."],
    ["Se crearon 3 de 8 facturas. No se pudo completar. Intente de nuevo.", "3 of 8 invoices created. Couldn't complete it. Please try again."],
    ["No hay facturas para crear.", "There are no invoices to create."],
    ["Máximo 10 facturas por archivo.", "At most 10 invoices per file."],
    ["Fila 2: tienda desconocida.", "Row 2: unknown shop."],
    ["Fila 2: motorista desconocido.", "Row 2: unknown driver."],
    ["Fila 2: número de factura inválido.", "Row 2: invalid invoice number."],
    ["Fila 2: la factura 3001 está repetida.", "Row 2: invoice 3001 appears twice."],
    ["Fila 1: la factura 3001 ya existe.", "Row 1: invoice 3001 already exists."],
    ["Fila 4: monto inválido.", "Row 4: invalid amount."],
    ["Fila 4: fecha inválida.", "Row 4: invalid date."],
    ["Encabezado inválido. Use: invoice_id,shop_id,driver_id,amount,due_date", "Invalid header. Use: invoice_id,shop_id,driver_id,amount,due_date"],
    ["Número de factura inválido: abc", "Invalid invoice number: abc"],
    ["Factura repetida: 2001", "Invoice appears twice: 2001"],
    ["Tienda desconocida: tienda-9", "Unknown shop: tienda-9"],
    ["Motorista desconocido: motorista-7", "Unknown driver: motorista-7"],
    ["Monto inválido: 12,5", "Invalid amount: 12,5"],
    ["Fecha inválida (use AAAA-MM-DD)", "Invalid date (use YYYY-MM-DD)"],
    ["Factura 1042 creada.", "Invoice 1042 created."],
    ["El número 1042 ya está usado. Use otro.", "Number 1042 is already used. Use another one."],
    ["Escriba un monto mayor que $0 y hasta $10,000.", "Enter an amount over $0 and up to $10,000."],
    ["La nota puede tener hasta 300 letras.", "The note can have up to 300 characters."],
    ["Hay dos tiendas con ese nombre: Tienda Marta", "Two shops have that name: Tienda Marta"],
  ];

  it.each(examples)("%s", (spanish, english) => {
    expect(translateMessage(spanish)).toBe(english);
  });

  // Every fixed message in the code, read from the files themselves, so a new one can't slip by.
  const fixed = new Set<string>();
  for (const path of ["app/actions.ts", "lib/mock.ts", "lib/api.ts", "lib/labels.ts", "lib/csv.ts", "lib/stellar/errors.ts", ...SERVER_FILES]) {
    for (const match of source(path).matchAll(/(?:fail|ok|receipt\(hash,|message:|return|Error\(|^\s+\d+:)\s*\(?\s*"([^"]*[a-záéíóúñ][^"]*)"/gm)) {
      if (/[áéíóúñ¿¡]|\b(la|el|de|no|su|en|un|una)\b/i.test(match[1])) fixed.add(match[1]);
    }
  }

  it("finds the fixed messages in the code", () => {
    expect(fixed.size).toBeGreaterThan(30);
  });

  it.each([...fixed])("translates %s", (spanish) => {
    const english = translateMessage(spanish);
    expect(english).not.toBe(spanish);
    expect(english).not.toMatch(SPANISH);
  });

  it("leaves text it doesn't know alone", () => {
    expect(translateMessage("Hello")).toBe("Hello");
  });
});
