import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseInvoiceCsv } from "./csv";

const header = "invoice_id,shop_id,driver_id,amount,due_date";
const known = {
  shops: ["tienda-1", "tienda-2", "tienda-3"],
  drivers: ["motorista-1", "motorista-2"],
};

describe("parseInvoiceCsv", () => {
  it("parses the sample file and reports its two errors", () => {
    const sample = readFileSync(new URL("../public/sample-invoices.csv", import.meta.url), "utf8");
    const { rows, errors } = parseInvoiceCsv(sample, known);

    expect(rows.map(({ invoiceId }) => invoiceId)).toEqual([2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008]);
    expect(errors).toEqual([
      { line: 10, field: "amount", message: "El monto debe ser mayor que 0" },
      { line: 11, field: "shop_id", message: "Tienda desconocida: tienda-9" },
    ]);
  });

  it.each([
    ["150", "150.00"],
    ["85.5", "85.50"],
    ["007.5", "7.50"],
    ["9007199254740993.01", "9007199254740993.01"],
  ])("normalizes amount %s to %s and returns a numeric ID", (input, amount) => {
    expect(parseInvoiceCsv(`${header}\n2001,tienda-1,motorista-1,${input},2026-11-20`, known)).toEqual({
      rows: [{ invoiceId: 2001, shopId: "tienda-1", driverId: "motorista-1", amount, dueDate: "2026-11-20" }],
      errors: [],
    });
  });

  it("accepts a BOM, CRLF, surrounding spaces and blank lines", () => {
    const csv = "\uFEFFinvoice_id , shop_id , driver_id , amount , due_date\r\n 2001 , tienda-1 , motorista-1 , 150 , 2026-11-20 \r\n\r\n  \r\n";

    expect(parseInvoiceCsv(csv, known)).toEqual({
      rows: [{ invoiceId: 2001, shopId: "tienda-1", driverId: "motorista-1", amount: "150.00", dueDate: "2026-11-20" }],
      errors: [],
    });
  });

  it("rejects an incorrect header on line 1", () => {
    expect(parseInvoiceCsv("id,shop_id,driver_id,amount,due_date\n2001,tienda-1,motorista-1,150,2026-11-20", known)).toEqual({
      rows: [],
      errors: [{ line: 1, message: `Encabezado inválido. Use: ${header}` }],
    });
  });

  it.each([
    ["", "Falta el monto"],
    ["0", "El monto debe ser mayor que 0"],
    ["12.345", "Monto inválido: 12.345"],
  ])("rejects amount %j", (amount, message) => {
    expect(parseInvoiceCsv(`${header}\n2001,tienda-1,motorista-1,${amount},2026-11-20`, known)).toEqual({
      rows: [],
      errors: [{ line: 2, field: "amount", message }],
    });
  });

  it.each(["2026-02-30", "2026-13-01", "2026-1-05", "20/11/2026"])("rejects date %s", (dueDate) => {
    expect(parseInvoiceCsv(`${header}\n2001,tienda-1,motorista-1,150,${dueDate}`, known)).toEqual({
      rows: [],
      errors: [{ line: 2, field: "due_date", message: "Fecha inválida (use AAAA-MM-DD)" }],
    });
  });

  it("accepts February 29 in a leap year", () => {
    const { rows, errors } = parseInvoiceCsv(`${header}\n2001,tienda-1,motorista-1,150,2028-02-29`, known);

    expect(rows.map(({ dueDate }) => dueDate)).toEqual(["2028-02-29"]);
    expect(errors).toEqual([]);
  });

  it("rejects an unknown driver", () => {
    expect(parseInvoiceCsv(`${header}\n2001,tienda-1,motorista-7,150,2026-11-20`, known)).toEqual({
      rows: [],
      errors: [{ line: 2, field: "driver_id", message: "Motorista desconocido: motorista-7" }],
    });
  });

  it("keeps the first invoice and reports the duplicate on its original line", () => {
    const csv = `${header}\n2003,tienda-1,motorista-1,150,2026-11-20\n\n2003,tienda-2,motorista-2,200,2026-11-21`;

    expect(parseInvoiceCsv(csv, known)).toEqual({
      rows: [{ invoiceId: 2003, shopId: "tienda-1", driverId: "motorista-1", amount: "150.00", dueDate: "2026-11-20" }],
      errors: [{ line: 4, field: "invoice_id", message: "Factura repetida: 2003" }],
    });
  });

  it("rejects a nonnumeric invoice ID", () => {
    expect(parseInvoiceCsv(`${header}\nabc,tienda-1,motorista-1,150,2026-11-20`, known)).toEqual({
      rows: [],
      errors: [{ line: 2, field: "invoice_id", message: "Número de factura inválido: abc" }],
    });
  });

  it("rejects a row with four columns", () => {
    expect(parseInvoiceCsv(`${header}\n2001,tienda-1,motorista-1,150`, known)).toEqual({
      rows: [],
      errors: [{ line: 2, message: "La fila debe tener 5 columnas" }],
    });
  });

  it("reports an empty file when only the header is present", () => {
    expect(parseInvoiceCsv(`${header}\n\n  `, known)).toEqual({
      rows: [],
      errors: [{ line: 1, message: "El archivo no tiene facturas" }],
    });
  });

  it("reports every invalid field in column order", () => {
    expect(parseInvoiceCsv(`${header}\n,,,,`, known)).toEqual({
      rows: [],
      errors: [
        { line: 2, field: "invoice_id", message: "Falta el número de factura" },
        { line: 2, field: "shop_id", message: "Falta la tienda" },
        { line: 2, field: "driver_id", message: "Falta el motorista" },
        { line: 2, field: "amount", message: "Falta el monto" },
        { line: 2, field: "due_date", message: "Falta la fecha" },
      ],
    });
  });

  it("reports a duplicate even when another field in the first row was invalid", () => {
    const csv = `${header}\n2003,tienda-1,motorista-1,0,2026-11-20\n2003,tienda-1,motorista-1,150,2026-11-20`;

    expect(parseInvoiceCsv(csv, known)).toEqual({
      rows: [],
      errors: [
        { line: 2, field: "amount", message: "El monto debe ser mayor que 0" },
        { line: 3, field: "invoice_id", message: "Factura repetida: 2003" },
      ],
    });
  });

  it("takes a real distributor's shop and driver names, ignoring case and accents (#133)", () => {
    const named = {
      shops: [{ id: "t-0", name: "Tienda de Marta, frente a la iglesia" }, { id: "t-1", name: "Tienda Marta" }, { id: "t-2", name: "Abarrotes Doña Rosa" }, { id: "t-3", name: "La Esquina" }, { id: "t-4", name: "La Esquina" }],
      drivers: [{ id: "m-1", name: "Pedro López" }, { id: "m-2", name: 'Pedro "Pelón" López' }],
    };
    const csv = `${header}\n"2000","Tienda de Marta, frente a la iglesia","Pedro ""Pelón"" López",10,2026-11-20\n2001,tienda marta,pedro lopez,10,2026-11-20\n2002,ABARROTES DONA ROSA,m-1,5,2026-11-20\n2003,La Esquina,Pedro López,5,2026-11-20\n2004,Otra,Pedro,5,2026-11-20`;
    const { rows, errors } = parseInvoiceCsv(csv, named);
    expect(rows.map((r) => [r.invoiceId, r.shopId, r.driverId])).toEqual([
      [2000, "t-0", "m-2"],
      [2001, "t-1", "m-1"],
      [2002, "t-2", "m-1"],
    ]);
    expect(errors).toEqual([
      { line: 5, field: "shop_id", message: "Hay dos tiendas con ese nombre: La Esquina" },
      { line: 6, field: "shop_id", message: "Tienda desconocida: Otra" },
      { line: 6, field: "driver_id", message: "Motorista desconocido: Pedro" },
    ]);
  });
});
