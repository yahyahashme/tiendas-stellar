"use client";

import { type ReactNode, useState } from "react";
import { ActionLink, ActionList, ActionRow, Button, ButtonLink, DetailLink, Held, TextButton } from "@/components/kit/button";
import { Field, FilterSelect, FormError, MoneyField, PasswordField, SelectField } from "@/components/kit/field";
import { Ledger, LedgerCard, type LedgerColumn, LedgerFigure, LedgerFigures, RowAction, RowButton, RowLink } from "@/components/kit/ledger";
import { Manifest, ManifestRow } from "@/components/kit/manifest";
import { Money } from "@/components/kit/money";
import { Paper, Receipt, ReceiptFold, ReceiptFoot, ReceiptHeader, ReceiptLine, ReceiptLines, ReceiptRule, ReceiptTotal } from "@/components/kit/paper";
import { Stamp, type StampTone } from "@/components/kit/stamp";
import { Answer, Empty, Failure, Loading, Notice } from "@/components/kit/states";
import { useT } from "@/lib/i18n";

// Sample content for the design-system pages under /sistema. Nothing here loads or changes data.

export function Section({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`flex flex-col gap-3 ${wide ? "@min-[60rem]:col-span-2" : ""}`}>
      <h2 className="border-b border-counter-rule pb-1 text-label font-semibold uppercase tracking-[0.1em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

export function InvoiceReceipt({ paid = false, fresh = false, lines = false, amount = 150 }: { paid?: boolean; fresh?: boolean; lines?: boolean; amount?: number }) {
  const { t } = useT();
  return (
    <Receipt>
      <ReceiptHeader from="Distribuidora El Sol" number={`${t("Factura n.º", "Invoice no.")} 1001`} date={t("13 nov 2026", "Nov 13, 2026")} />
      <ReceiptRule />
      {lines ? (
        <ReceiptFold count={3}>
          <ReceiptLines>
            <ReceiptLine label={t("Cliente", "Customer")}>Tienda Rosa</ReceiptLine>
            <ReceiptLine label={t("Motorista", "Driver")}>Carlos</ReceiptLine>
            <ReceiptLine label="Arroz 5 lb × 12">
              <Money value={54} />
            </ReceiptLine>
            <ReceiptLine label="Frijol rojo 2 lb × 20">
              <Money value={46} />
            </ReceiptLine>
            <ReceiptLine label="Aceite 750 ml × 10">
              <Money value={amount - 100} />
            </ReceiptLine>
          </ReceiptLines>
        </ReceiptFold>
      ) : (
        <ReceiptLines>
          <ReceiptLine label={t("Cliente", "Customer")}>Tienda Rosa</ReceiptLine>
          <ReceiptLine label={t("Motorista", "Driver")}>Carlos</ReceiptLine>
        </ReceiptLines>
      )}
      <ReceiptTotal label="Total" value={amount} note={paid ? t("Pagada el 13 nov", "Paid Nov 13") : t("Vence el 20 nov", "Due Nov 20")} />
      {paid && (
        <ReceiptFoot
          stamp={
            <Stamp tone="ok" fresh={fresh}>
              {t("Pagada", "Paid")}
            </Stamp>
          }
        >
          <DetailLink href="https://stellar.expert/explorer/testnet" external>
            {t("Ver detalles", "See details")}
          </DetailLink>
        </ReceiptFoot>
      )}
    </Receipt>
  );
}

export function PayActions({ size = "md" }: { size?: "md" | "lg" }) {
  const { t } = useT();
  const [open, setOpen] = useState<"part" | "cash" | null>(null);
  return (
    <>
      <Button size={size} hint={<><Money value={150} /> {t("con dólares digitales", "in digital dollars")}</>} onClick={() => {}}>
        {t("Pagar ahora", "Pay now")}
      </Button>
      <ActionList>
        <ActionRow size={size} title={t("Pagar en 7 días", "Pay in 7 days")} hint={t("Sin intereses", "No interest")} onClick={() => {}} />
        <ActionRow size={size} title={t("Pagué en efectivo", "I paid in cash")} open={open === "cash"} onClick={() => setOpen(open === "cash" ? null : "cash")}>
          <p>{t("El motorista debe marcar el efectivo primero.", "The driver has to mark the cash first.")}</p>
        </ActionRow>
        <ActionRow size={size} title={t("Pagar otro monto", "Pay another amount")} open={open === "part"} onClick={() => setOpen(open === "part" ? null : "part")}>
          <MoneyField label={t("¿Cuánto paga ahora?", "How much are you paying now?")} hint={<>{t("Falta", "Left to pay:")} <Money value={150} /></>} defaultValue="75.00" />
          <Button onClick={() => {}}>{t("Pagar este monto", "Pay this amount")}</Button>
        </ActionRow>
      </ActionList>
    </>
  );
}

const STAMPS: [StampTone, string, string][] = [
  ["ok", "Pagada", "Paid"],
  ["confirm", "Confirmado", "Confirmed"],
  ["credit", "En crédito", "On credit"],
  ["warn", "Vence pronto", "Due soon"],
  ["bad", "Vencida", "Overdue"],
  ["ink", "En revisión", "In review"],
];

export function Stamps() {
  const { t } = useT();
  return (
    <Paper className="flex flex-col gap-5 px-4 py-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
        {STAMPS.map(([tone, es, en], i) => (
          <Stamp key={tone} tone={tone} tilt={-4 - (i % 3)}>
            {t(es, en)}
          </Stamp>
        ))}
      </div>
      <ReceiptRule />
      <div className="flex flex-wrap items-center gap-2">
        {STAMPS.map(([tone, es, en]) => (
          <Stamp key={tone} tone={tone} small>
            {t(es, en)}
          </Stamp>
        ))}
        <Stamp small>{t("Pendiente", "Unpaid")}</Stamp>
      </div>
    </Paper>
  );
}

export function Buttons() {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => {}} hint={<><Money value={150} /> {t("con dólares digitales", "in digital dollars")}</>}>
        {t("Pagar ahora", "Pay now")}
      </Button>
      <Button onClick={() => {}}>{t("Confirmo", "Confirm")}</Button>
      <Button onClick={() => {}} busy>
        {t("Pagar ahora", "Pay now")}
      </Button>
      <Button onClick={() => {}} disabled>
        {t("Pagar deuda", "Pay debt")}
      </Button>
      <Held hint={t("No queda nada por pagar", "Nothing left to pay")}>{t("Factura pagada", "Invoice paid")}</Held>
      <Button onClick={() => {}} size="lg">
        {t("Recibí efectivo", "I received cash")}
      </Button>
      <Button onClick={() => {}} tone="danger">
        {t("Sí, cerrar mi cuenta", "Yes, close my account")}
      </Button>
      <ButtonLink href="/sistema">{t("Nueva factura", "New invoice")}</ButtonLink>
      <ActionList>
        <ActionRow title={t("Pagar en 7 días", "Pay in 7 days")} hint={t("Sin intereses", "No interest")} onClick={() => {}} />
        <ActionLink href="/sistema" title={t("Factura 1004", "Invoice 1004")} hint={t("Vence el 20 nov", "Due Nov 20")} figure={<Money value={60} />} />
        <ActionRow title={t("Pagar en 7 días", "Pay in 7 days")} hint={t("No disponible: tiene una deuda vencida.", "Not available: you have an overdue debt.")} onClick={() => {}} disabled />
        <ActionLink href="https://wa.me/" external title={t("Recordar por WhatsApp", "Remind on WhatsApp")} />
      </ActionList>
      <TextButton onClick={() => {}}>{t("Cancelar", "Cancel")}</TextButton>
    </div>
  );
}

export function Fields() {
  const { t } = useT();
  return (
    <Paper className="flex flex-col gap-4 px-4 py-5">
      <Field label={t("Nombre de la tienda", "Shop name")} defaultValue="Tienda Rosa" autoComplete="organization" />
      <Field label={t("Teléfono", "Phone")} hint={t("8 dígitos, sin guiones.", "8 digits, no dashes.")} inputMode="tel" placeholder="7000 0132" />
      <MoneyField label={t("Monto", "Amount")} defaultValue="48.50" />
      <SelectField label={t("Motorista", "Driver")} defaultValue="carlos">
        <option value="carlos">Carlos</option>
        <option value="ana">Ana</option>
      </SelectField>
      <PasswordField label={t("Contraseña", "Password")} defaultValue="secreto123" autoComplete="off" />
      <Field label="DUI" defaultValue="0123" inputMode="numeric" error={t("Revise el DUI: son 9 números.", "Check the DUI: it has 9 digits.")} />
      <FormError>{t("No pudimos guardar sus datos. Intente de nuevo.", "We couldn't save your details. Try again.")}</FormError>
      <Notice>{t("Datos guardados.", "Details saved.")}</Notice>
    </Paper>
  );
}

type Row = { id: number; shop: string; driver: string; amount: number; paid: number; tone: StampTone; es: string; en: string; due: string; dueEn: string };
export const ROWS: Row[] = [
  { id: 1010, shop: "Tienda Rosa", driver: "Carlos", amount: 150, paid: 150, tone: "ok", es: "Pagada", en: "Paid", due: "20 nov", dueEn: "Nov 20" },
  { id: 1009, shop: "Tienda Don Luis", driver: "Carlos", amount: 85.5, paid: 85.5, tone: "credit", es: "En crédito", en: "On credit", due: "20 nov", dueEn: "Nov 20" },
  { id: 1008, shop: "Mini Súper La Esquina", driver: "Ana", amount: 220, paid: 0, tone: "warn", es: "Vence pronto", en: "Due soon", due: "14 nov", dueEn: "Nov 14" },
  { id: 1007, shop: "Tienda Rosa", driver: "Carlos", amount: 60, paid: 20, tone: "confirm", es: "Parcial", en: "Part paid", due: "20 nov", dueEn: "Nov 20" },
  { id: 1006, shop: "Pupusería y Tienda La Bendición de Dios", driver: "Ana", amount: 1234.5, paid: 0, tone: "bad", es: "Vencida", en: "Overdue", due: "9 nov", dueEn: "Nov 9" },
  { id: 1005, shop: "Tienda Don Luis", driver: "Ana", amount: 130, paid: 0, tone: "ink", es: "Pendiente", en: "Unpaid", due: "20 nov", dueEn: "Nov 20" },
];

export function SampleFigures() {
  const { t } = useT();
  return (
    <LedgerFigures>
      <LedgerFigure label={t("Cobrado", "Collected")} value={255.5} />
      <LedgerFigure label={t("Por cobrar", "To collect")} value={1624.5} />
      <LedgerFigure label={t("En crédito", "On credit")} value={85.5} />
      <LedgerFigure label={t("Efectivo con motoristas", "Cash with drivers")} value={40} />
    </LedgerFigures>
  );
}

export function SampleLedger({ rows = ROWS }: { rows?: Row[] }) {
  const { t, lang } = useT();
  const sum = (pick: (row: Row) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const stamp = (row: Row) => (
    <Stamp tone={row.tone} small>
      {lang === "en" ? row.en : row.es}
    </Stamp>
  );
  const columns: LedgerColumn<Row>[] = [
    { id: "id", header: t("N.º", "No."), mono: true, foldOnCard: true, cell: (row) => row.id },
    { id: "shop", header: t("Tienda", "Shop"), grow: true, cell: (row) => row.shop, title: (row) => row.shop, total: "Total" },
    { id: "driver", header: t("Motorista", "Driver"), secondary: true, cell: (row) => row.driver },
    { id: "amount", header: t("Monto", "Amount"), figure: true, cell: (row) => <Money value={row.amount} />, total: <Money value={sum((row) => row.amount)} /> },
    { id: "paid", header: t("Pagado", "Paid"), figure: true, secondary: true, cell: (row) => <Money value={row.paid} />, total: <Money value={sum((row) => row.paid)} /> },
    { id: "status", header: t("Estado", "Status"), cell: stamp },
    { id: "due", header: t("Vence", "Due"), mono: true, end: true, cell: (row) => (lang === "en" ? row.dueEn : row.due) },
  ];
  return (
    <Ledger
      label={t("Facturas", "Invoices")}
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      rowName={(row) => `${t("factura", "invoice")} ${row.id}`}
      actions={(row) => <RowAction onClick={() => {}} label={`${t("Repetir factura", "Repeat invoice")} ${row.id}`}>{t("Repetir", "Repeat")}</RowAction>}
      card={(row) => <LedgerCard title={row.shop} amount={<Money value={row.amount} />} stamp={stamp(row)} note={`${t("Vence", "Due")} ${lang === "en" ? row.dueEn : row.due}`} />}
    />
  );
}

/** A ledger's filters: one row with room, two to a row on a phone. */
export function SampleFilters() {
  const { t } = useT();
  const [status, setStatus] = useState("all");
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <FilterSelect label={t("Estado", "Status")} value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="all">{t("Todas", "All")}</option>
        <option value="due">{t("Pendiente", "Unpaid")}</option>
        <option value="paid">{t("Pagada", "Paid")}</option>
      </FilterSelect>
      <FilterSelect label={t("Motorista", "Driver")} defaultValue="all">
        <option value="all">{t("Todos", "All")}</option>
        <option>Carlos</option>
        <option>Ana</option>
      </FilterSelect>
    </div>
  );
}

type CashRow = { name: string; cash: number };

/** A small ledger whose rows carry their one action in view: a button, or words of the same height once it is done. */
export function SampleCash() {
  const { t } = useT();
  const [handedIn, setHandedIn] = useState(false);
  const rows: CashRow[] = [
    { name: "Carlos", cash: handedIn ? 0 : 60 },
    { name: "Ana", cash: 0 },
  ];
  const act = (row: CashRow) =>
    row.cash > 0 ? (
      <RowButton onClick={() => setHandedIn(true)}>{t("Marcar efectivo entregado", "Mark cash handed in")}</RowButton>
    ) : (
      <span className="inline-flex min-h-11 items-center justify-end font-sans text-label text-muted">{t("Nada por entregar", "Nothing to hand in")}</span>
    );
  const columns: LedgerColumn<CashRow>[] = [
    { id: "driver", header: t("Motorista", "Driver"), grow: true, cell: (row) => row.name, total: "Total" },
    { id: "cash", header: t("Efectivo", "Cash"), figure: true, cell: (row) => <Money value={row.cash} />, total: <Money value={rows.reduce((sum, row) => sum + row.cash, 0)} /> },
    { id: "act", header: <span className="sr-only">{t("Entrega", "Hand-in")}</span>, end: true, className: "py-1", cell: act },
  ];
  return (
    <div className="flex max-w-[44rem] flex-col gap-2">
      <Ledger
        label={t("Efectivo con motoristas", "Cash with drivers")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.name}
        card={(row) => <LedgerCard title={row.name} amount={<Money value={row.cash} />} actions={act(row)} />}
      />
      <div className="min-h-6">{handedIn && <Answer receipt={{ ok: true, message: "Listo. Carlos entregó $60.00 en efectivo." }} />}</div>
      <p>
        <RowLink href="/sistema/shell">{t("Ver el historial", "See the history")}</RowLink>
      </p>
    </div>
  );
}

export function SampleManifest({ size = "md" }: { size?: "md" | "lg" }) {
  const { t } = useT();
  void size;
  return (
    <Manifest label={t("Paradas de hoy", "Today's stops")}>
      <ManifestRow next number={1} name="Tienda Rosa" detail={`${t("Factura", "Invoice")} 1001`} amount={<Money value={150} />} href="/sistema" openLabel={t("Abrir parada 1: Tienda Rosa", "Open stop 1: Tienda Rosa")} />
      <ManifestRow number={2} name="Tienda Don Luis" detail={`${t("Factura", "Invoice")} 1002`} amount={<Money value={85.5} />} href="/sistema" openLabel="2" />
      <ManifestRow
        number={3}
        name="Pupusería y Tienda La Bendición de Dios"
        detail={`${t("Factura", "Invoice")} 1004`}
        amount={<Money value={1234.5} />}
        stamp={
          <Stamp tone="bad" small>
            {t("Vencida", "Overdue")}
          </Stamp>
        }
        href="/sistema"
        openLabel="3"
      />
      <ManifestRow
        done
        number={4}
        name="Mini Súper La Esquina"
        detail={`${t("Factura", "Invoice")} 1007`}
        amount={<Money value={40} />}
        stamp={
          <Stamp tone="ok" small>
            {t("Pagada", "Paid")}
          </Stamp>
        }
        href="/sistema"
        openLabel="4"
      />
    </Manifest>
  );
}

export function States() {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-4">
      <Loading />
      <Empty action={<ButtonLink href="/sistema">{t("Nueva factura", "New invoice")}</ButtonLink>}>{t("Todavía no hay facturas.", "No invoices yet.")}</Empty>
      <Failure onRetry={() => {}}>{t("No pudimos cargar sus facturas. Revise su conexión.", "We couldn't load your invoices. Check your connection.")}</Failure>
    </div>
  );
}
