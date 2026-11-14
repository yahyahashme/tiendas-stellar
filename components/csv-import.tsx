"use client";

import { useRef, useState } from "react";
import { ActionRow, Button, TextButton } from "@/components/kit/button";
import { Ledger, LedgerCard, type LedgerColumn } from "@/components/kit/ledger";
import { Money } from "@/components/kit/money";
import { Answer } from "@/components/kit/states";
import { createInvoices } from "@/lib/api";
import { type CsvError, type Known, parseInvoiceCsv } from "@/lib/csv";
import { formatDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { InvoiceRow, Receipt } from "@/lib/types";

// The demo's shops and drivers (the ids in the CSV's shop_id and driver_id columns).
const DEMO = { shops: ["tienda-1", "tienda-2", "tienda-3"], drivers: ["motorista-1", "motorista-2"] };
// Same limit as createInvoices in app/actions.ts: each invoice is its own
// transaction (about 5 s) and the server has 60 s for the whole file.
const MAX_ROWS = 10;

type Parsed = { fileName: string; rows: InvoiceRow[]; errors: CsvError[] };

/** One red row per bad line, with every reason on it. */
function errorLines(errors: CsvError[], translate: (text: string) => string): [number, string][] {
  const byLine = new Map<number, string[]>();
  for (const e of errors) byLine.set(e.line, [...(byLine.get(e.line) ?? []), translate(e.message)]);
  return [...byLine.entries()].sort(([a], [b]) => a - b).map(([line, messages]) => [line, messages.join(" · ")]);
}

/** "Importar facturas (CSV)" on the distributor's Nueva factura page, linked from the dashboard (#32): pick a file, check it, create the good rows. */
export function CsvImport({
  shopName,
  driverName,
  onCreated,
  known,
}: {
  shopName: (id: string) => string;
  driverName: (id: string) => string;
  onCreated: () => Promise<void>;
  /** A real distributor's shops and drivers (#133): the file can use their names. The demo's ids otherwise. */
  known?: { shops: Known[]; drivers: Known[] };
}) {
  const input = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Receipt | null>(null);
  const { lang, t, msg } = useT();

  async function pick(file: File | undefined) {
    if (!file) return;
    setResult(null);
    const text = await file.text();
    setParsed({ fileName: file.name, ...parseInvoiceCsv(text, known ?? DEMO) });
    if (input.current) input.current.value = ""; // picking the same file again still triggers
  }

  async function create() {
    if (!parsed) return;
    setBusy(true);
    const receipt = await createInvoices(parsed.rows);
    if (receipt.ok) {
      setParsed(null);
      await onCreated();
    }
    setResult(receipt);
    setBusy(false);
  }

  const rows = parsed?.rows ?? [];
  const bad = parsed ? errorLines(parsed.errors, msg) : [];
  const tooMany = rows.length > MAX_ROWS;

  const due = (row: InvoiceRow) => formatDay(`${row.dueDate}T06:00:00Z`, lang);
  const columns: LedgerColumn<InvoiceRow>[] = [
    { id: "id", header: t("N.º", "No."), mono: true, foldOnCard: true, cell: (row) => row.invoiceId },
    { id: "shop", header: t("Tienda", "Shop"), grow: true, cell: (row) => shopName(row.shopId), title: (row) => shopName(row.shopId) },
    { id: "driver", header: t("Motorista", "Driver"), secondary: true, cell: (row) => driverName(row.driverId) },
    { id: "amount", header: t("Monto", "Amount"), figure: true, cell: (row) => <Money value={Number(row.amount)} /> },
    { id: "due", header: t("Vence", "Due"), mono: true, end: true, cell: due },
  ];

  return (
    <div className="flex flex-col gap-3">
      <ActionRow
        title={t("Importar facturas (CSV)", "Import invoices (CSV)")}
        hint={
          <>
            {t("Columnas", "Columns")}: invoice_id, shop_id, driver_id, amount, due_date.
            {known && ` ${t("En tienda y motorista puede poner el nombre.", "For shop and driver you can write the name.")}`}
            {` ${t(`Hasta ${MAX_ROWS} facturas por archivo.`, `Up to ${MAX_ROWS} invoices per file.`)}`}
          </>
        }
        onClick={() => input.current?.click()}
        disabled={busy}
      />
      <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void pick(event.target.files?.[0])} />

      {result && <Answer receipt={result} />}

      {parsed && (
        <div className="flex flex-col gap-3">
          <p className="text-lead">
            <strong>{parsed.fileName}</strong>:{" "}
            {t(
              `${rows.length} ${rows.length === 1 ? "factura lista" : "facturas listas"}`,
              `${rows.length} ${rows.length === 1 ? "invoice ready" : "invoices ready"}`,
            )}
            {bad.length > 0 &&
              t(
                `, ${bad.length} ${bad.length === 1 ? "fila con error" : "filas con error"} (no se crean)`,
                `, ${bad.length} ${bad.length === 1 ? "row with an error" : "rows with errors"} (not created)`,
              )}
            .
          </p>
          {rows.length > 0 && (
            <Ledger
              label={t("Facturas del archivo", "Invoices in the file")}
              columns={columns}
              rows={rows}
              rowKey={(row) => row.invoiceId}
              rowName={(row) => t(`la factura ${row.invoiceId}`, `invoice ${row.invoiceId}`)}
              card={(row) => <LedgerCard title={shopName(row.shopId)} amount={<Money value={Number(row.amount)} />} note={`${t("Vence", "Due")} ${due(row)}`} />}
            />
          )}
          {bad.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-paper bg-paper px-3 py-3 font-semibold text-bad">
              {bad.map(([line, reason]) => (
                <li key={line}>
                  {t("Línea", "Line")} {line}: {reason}
                </li>
              ))}
            </ul>
          )}
          {tooMany && (
            <p className="font-semibold text-bad">
              {t(`Máximo ${MAX_ROWS} facturas por archivo.`, `At most ${MAX_ROWS} invoices per file.`)}{" "}
              {t(
                "Cada factura se registra por separado y toma unos segundos. Divida el archivo en partes.",
                "Each invoice is recorded separately and takes a few seconds. Split the file into parts.",
              )}
            </p>
          )}
          <Button onClick={() => void create()} busy={busy} disabled={rows.length === 0 || tooMany} hint={busy ? t("Se crean una por una, unos segundos cada una.", "They're created one by one, a few seconds each.") : undefined}>
            {t(
              `Crear ${rows.length} ${rows.length === 1 ? "factura" : "facturas"}`,
              `Create ${rows.length} ${rows.length === 1 ? "invoice" : "invoices"}`,
            )}
          </Button>
          <TextButton onClick={() => setParsed(null)} disabled={busy}>
            {t("Cancelar", "Cancel")}
          </TextButton>
        </div>
      )}
    </div>
  );
}
