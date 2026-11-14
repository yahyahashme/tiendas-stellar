import type { InvoiceRow } from "./types";

const HEADER = "invoice_id,shop_id,driver_id,amount,due_date";

export type CsvError = { line: number; field?: string; message: string };

/** A shop or driver the file may name: by id, or (#133) by its name, ignoring case and accents. */
export type Known = string | { id: string; name: string };

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/** One CSV line into its fields. A field in double quotes may hold commas ("Tienda Marta, frente a la iglesia"); "" is a quote. */
function splitLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        value += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else value += ch;
    } else if (ch === '"' && value.trim() === "") {
      quoted = true;
      value = "";
    } else if (ch === ",") {
      values.push(value.trim());
      value = "";
    } else value += ch;
  }
  values.push(value.trim());
  return values;
}

/** Id or name -> id. A name two of them share stays ambiguous (null). */
function lookup(list: Known[]): (text: string) => string | null | undefined {
  const ids = new Set<string>();
  const names = new Map<string, string | null>();
  for (const item of list) {
    const { id, name } = typeof item === "string" ? { id: item, name: "" } : item;
    ids.add(id);
    if (name) names.set(fold(name), names.has(fold(name)) && names.get(fold(name)) !== id ? null : id);
  }
  return (text) => (ids.has(text) ? text : names.get(fold(text)));
}

export function parseInvoiceCsv(
  text: string,
  known: { shops: Known[]; drivers: Known[] },
): { rows: InvoiceRow[]; errors: CsvError[] } {
  const [header, ...dataLines] = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const rows: InvoiceRow[] = [];
  const errors: CsvError[] = [];

  if (header.split(",").map((column) => column.trim()).join(",") !== HEADER) {
    return { rows, errors: [{ line: 1, message: `Encabezado inválido. Use: ${HEADER}` }] };
  }

  const findShop = lookup(known.shops);
  const findDriver = lookup(known.drivers);
  const seenIds = new Set<string>();

  for (const [index, rawLine] of dataLines.entries()) {
    if (!rawLine.trim()) continue;

    const line = index + 2;
    const values = splitLine(rawLine);
    if (values.length !== 5) {
      errors.push({ line, message: "La fila debe tener 5 columnas" });
      continue;
    }

    const [id, shopText, driverText, amount, dueDate] = values;
    const shopId = findShop(shopText);
    const driverId = findDriver(driverText);
    const previousErrorCount = errors.length;

    if (!id) {
      errors.push({ line, field: "invoice_id", message: "Falta el número de factura" });
    } else if (!/^[1-9]\d{0,14}$/.test(id)) {
      errors.push({ line, field: "invoice_id", message: `Número de factura inválido: ${id}` });
    } else if (seenIds.has(id)) {
      errors.push({ line, field: "invoice_id", message: `Factura repetida: ${id}` });
    } else {
      seenIds.add(id);
    }

    if (!shopText) {
      errors.push({ line, field: "shop_id", message: "Falta la tienda" });
    } else if (shopId === null) {
      errors.push({ line, field: "shop_id", message: `Hay dos tiendas con ese nombre: ${shopText}` });
    } else if (!shopId) {
      errors.push({ line, field: "shop_id", message: `Tienda desconocida: ${shopText}` });
    }

    if (!driverText) {
      errors.push({ line, field: "driver_id", message: "Falta el motorista" });
    } else if (driverId === null) {
      errors.push({ line, field: "driver_id", message: `Hay dos motoristas con ese nombre: ${driverText}` });
    } else if (!driverId) {
      errors.push({ line, field: "driver_id", message: `Motorista desconocido: ${driverText}` });
    }

    if (!amount) {
      errors.push({ line, field: "amount", message: "Falta el monto" });
    } else if (!/^-?\d+(\.\d{1,2})?$/.test(amount)) {
      errors.push({ line, field: "amount", message: `Monto inválido: ${amount}` });
    } else if (amount.startsWith("-") || !/[1-9]/.test(amount)) {
      errors.push({ line, field: "amount", message: "El monto debe ser mayor que 0" });
    }

    if (!dueDate) {
      errors.push({ line, field: "due_date", message: "Falta la fecha" });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || new Date(dueDate).toJSON()?.slice(0, 10) !== dueDate) {
      errors.push({ line, field: "due_date", message: "Fecha inválida (use AAAA-MM-DD)" });
    }

    if (errors.length === previousErrorCount) {
      const [dollars, cents = ""] = amount.split(".");
      rows.push({
        invoiceId: Number(id),
        shopId: shopId!,
        driverId: driverId!,
        amount: `${dollars.replace(/^0+(?=\d)/, "")}.${cents.padEnd(2, "0")}`,
        dueDate,
      });
    }
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push({ line: 1, message: "El archivo no tiene facturas" });
  }

  return { rows, errors };
}
