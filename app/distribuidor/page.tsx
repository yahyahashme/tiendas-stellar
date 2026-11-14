"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { BackLink, Card, Chip, Label, LoadError, Loading, ReceiptView, Screen } from "@/components/ui";
import { CsvImport } from "@/components/csv-import";
import { createDemoInvoice, getDistributorView, handInCash } from "@/lib/api";
import { DEMO_PHONES } from "@/lib/demo-contacts";
import { formatDay, formatMoney } from "@/lib/format";
import { toUnits } from "@/lib/money";
import { reminderLink } from "@/lib/whatsapp";
import { useT } from "@/lib/i18n";
import { invoiceStatus, methodLabel, STATUS_LABEL, type StatusTone } from "@/lib/labels";
import type { Invoice, Receipt, Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

const STATUS_FILTERS: { key: string; tone?: StatusTone }[] = [
  { key: "all" },
  { key: "due", tone: "due" },
  { key: "part", tone: "part" },
  { key: "paid", tone: "paid" },
  { key: "credit", tone: "credit" },
];

/**
 * `pages` pages of history (newest first): every refresh re-reads all of them, so nothing goes stale.
 * A signed-in, approved distributor sees their own business (#130); anyone else, the demo.
 * Shops include every shop the distributor works with, so a debt counts even when its invoices are older.
 */
const loadDashboard = (pages: number) => getDistributorView(pages);

/** "Primeros pasos" for a new distributor (#130): done when there is at least one of each. */
function FirstSteps({ drivers, shops, invoices }: { drivers: number; shops: number; invoices: number }) {
  const { t } = useT();
  const steps: { label: string; done: boolean; href?: string }[] = [
    { label: t("Agregar sus motoristas", "Add your drivers"), done: drivers > 0, href: "/distribuidor/motoristas" },
    { label: t("Agregar sus tiendas", "Add your shops"), done: shops > 0, href: "/distribuidor/tiendas" },
    { label: t("Crear su primera factura", "Create your first invoice"), done: invoices > 0, href: "/distribuidor/factura" },
  ];
  if (steps.every((s) => s.done)) return null;
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{t("Primeros pasos", "First steps")}</h2>
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-3 text-lg">
            <span
              aria-hidden
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                step.done ? "bg-ok text-white" : "bg-brand-soft text-brand"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </span>
            {step.href && !step.done ? (
              <Link href={step.href} className="font-semibold text-brand underline">
                {step.label}
              </Link>
            ) : (
              <span className={step.done ? "text-muted line-through" : ""}>{step.label}</span>
            )}
            <span className="sr-only">{step.done ? t("Hecho", "Done") : t("Por hacer", "To do")}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const HIGHLIGHT_MS = 4000;

/** WhatsApp link with the reminder ready, or null if the shop has no demo phone. */
function shopReminder(shop: Shop): string | null {
  const phone = DEMO_PHONES[shop.id];
  if (!phone || shop.creditOwed <= 0) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL || (typeof window === "undefined" ? "" : window.location.origin);
  try {
    return reminderLink({
      phone,
      shopName: shop.name,
      amountUnits: toUnits(shop.creditOwed.toFixed(2)),
      dueAt: shop.creditDue ? Math.floor(Date.parse(shop.creditDue) / 1000) : 0,
      now: Math.floor(Date.now() / 1000),
      link: site ? `${site}/tienda/cuenta/${shop.id}` : undefined,
    });
  } catch {
    return null;
  }
}


/** What a row looks like; when it changes between refreshes, the row lights up. */
const rowKey = (i: Invoice) => `${i.status}|${i.paid}|${i.method ?? ""}|${i.cashClaim ?? ""}`;

/**
 * Ids of invoices that are new or changed since the last refresh, for a few seconds.
 * "New" means newer than anything loaded before: older rows that "Ver más" adds don't light up.
 */
function useChangedRows(invoices: Invoice[] | undefined): Set<number> {
  const seen = useRef<Map<number, string> | null>(null);
  const [changed, setChanged] = useState<Map<number, number>>(new Map());
  useEffect(() => {
    if (!invoices) return;
    const before = seen.current;
    seen.current = new Map(invoices.map((i) => [i.id, rowKey(i)]));
    if (!before) return; // first load: nothing "changed"
    const now = Date.now();
    const newestBefore = Math.max(0, ...before.keys());
    const fresh = invoices
      .filter((i) => (before.has(i.id) ? before.get(i.id) !== rowKey(i) : i.id > newestBefore))
      .map((i) => i.id);
    if (fresh.length === 0) return;
    setChanged((old) => new Map([...old, ...fresh.map((id) => [id, now] as const)]));
  }, [invoices]);
  useEffect(() => {
    if (changed.size === 0) return;
    const timer = setTimeout(
      () => setChanged((old) => new Map([...old].filter(([, at]) => Date.now() - at < HIGHLIGHT_MS))),
      HIGHLIGHT_MS,
    );
    return () => clearTimeout(timer);
  }, [changed]);
  return new Set(changed.keys());
}

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;

function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-12 rounded-full border px-4 font-medium ${
        active ? "border-brand bg-brand text-white" : "border-line bg-card text-ink active:bg-brand-soft"
      }`}
    >
      {children}
    </button>
  );
}

function Total({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="text-2xl font-semibold tabular-nums lg:text-4xl">{children}</div>
    </Card>
  );
}

export default function Dashboard() {
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const { data, failed, reload } = usePolling("dashboard", () => loadDashboard(pages));
  const firstPages = useRef(pages);
  useEffect(() => {
    if (pages === firstPages.current) return; // the first load is usePolling's
    firstPages.current = pages;
    setLoadingMore(true);
    void reload().finally(() => setLoadingMore(false));
  }, [pages, reload]);
  const [statusFilter, setStatusFilter] = useState<StatusTone | "all">("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [newest, setNewest] = useState<number | null>(null);
  const changed = useChangedRows(data?.invoices);
  const [handingIn, setHandingIn] = useState<string | null>(null);
  const [cashReceipt, setCashReceipt] = useState<Receipt | null>(null);
  const { lang, t } = useT();

  async function cashHandedIn(driverId: string, amount: number) {
    setHandingIn(driverId);
    setCashReceipt(null);
    const result = await handInCash(driverId, amount);
    if (result.ok) await reload();
    setCashReceipt(result);
    setHandingIn(null);
  }

  async function newDemoInvoice() {
    setCreating(true);
    try {
      const invoice = await createDemoInvoice();
      await reload();
      setNewest(invoice.id);
    } finally {
      setCreating(false);
    }
  }

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="min-h-9 text-3xl font-bold">{data?.scope.name ?? ""}</h1>
        <p className="text-muted">{t("Se actualiza cada 5 segundos.", "Updates every 5 seconds.")}</p>
      </div>
      {data && !data.scope.isDemo && (
        <nav className="flex flex-wrap gap-2">
          <Link
            href="/distribuidor/factura"
            className="flex min-h-12 items-center rounded-xl bg-brand px-5 text-lg font-semibold text-white active:bg-brand-dark"
          >
            {t("Nueva factura", "New invoice")}
          </Link>
          <Link
            href="/distribuidor/tiendas"
            className="flex min-h-12 items-center rounded-xl border-2 border-brand px-4 text-base font-semibold text-brand active:bg-brand-soft"
          >
            {t("Tiendas", "Shops")}
          </Link>
          <Link
            href="/distribuidor/motoristas"
            className="flex min-h-12 items-center rounded-xl border-2 border-brand px-4 text-base font-semibold text-brand active:bg-brand-soft"
          >
            {t("Motoristas", "Drivers")}
          </Link>
        </nav>
      )}
      {data?.scope.isDemo && (
        <button
          type="button"
          onClick={newDemoInvoice}
          disabled={creating}
          className="min-h-12 rounded-xl bg-brand px-5 text-lg font-semibold text-white active:bg-brand-dark disabled:bg-line disabled:text-muted"
        >
          {creating ? t("Creando...", "Creating...") : t("Nueva factura de demo", "New demo invoice")}
        </button>
      )}
    </header>
  );

  if (!data) {
    return (
      <Screen wide>
        <BackLink />
        {header}
        {failed ? <LoadError /> : <Loading />}
      </Screen>
    );
  }

  const { invoices, total, totals, drivers, shops, scope } = data;
  const shopName = (id: string) => shops.find((s) => s.id === id)?.name ?? id;
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id;

  const collected = totals.digital; // all history, from the contract's running totals
  const onCredit = sum(shops.map((s) => s.creditOwed));
  const overdue = sum(shops.filter((s) => s.overdue).map((s) => s.creditOwed));
  const owing = shops.filter((s) => s.creditOwed > 0);

  const rows = invoices.filter( // already newest first
    (i) =>
      (statusFilter === "all" || invoiceStatus(i).tone === statusFilter) &&
      (driverFilter === "all" || i.driverId === driverFilter),
  );

  return (
    <Screen wide>
      <BackLink />
      {header}
      {failed && <LoadError />}
      {!scope.isDemo && <FirstSteps drivers={drivers.length} shops={shops.length} invoices={total} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Total label={t("Cobrado digital", "Collected digitally")}>{formatMoney(collected)}</Total>
        <Total label={t("Efectivo por motorista", "Cash by driver")}>
          <span className="flex flex-col gap-2 text-lg">
            {drivers.length === 0 && (
              <span className="text-base font-normal text-muted">{t("Todavía no tiene motoristas.", "You don't have drivers yet.")}</span>
            )}
            {drivers.map((d) => (
              <span key={d.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="whitespace-nowrap">
                  {d.name} {formatMoney(d.cashHeld)}
                </span>
                {d.cashHeld > 0 && (
                  <button
                    type="button"
                    onClick={() => cashHandedIn(d.id, d.cashHeld)}
                    disabled={handingIn !== null}
                    className="min-h-12 rounded-xl border border-brand px-3 text-base font-semibold text-brand active:bg-brand-soft disabled:border-line disabled:text-muted"
                  >
                    {handingIn === d.id ? t("Guardando...", "Saving...") : t("Marcar efectivo entregado", "Mark cash handed in")}
                  </button>
                )}
              </span>
            ))}
          </span>
        </Total>
        <Total label={t("En crédito", "On credit")}>{formatMoney(onCredit)}</Total>
        <Total label={t("Vencido", "Overdue")}>
          <span className={overdue > 0 ? "text-bad" : ""}>{formatMoney(overdue)}</span>
        </Total>
      </div>

      {cashReceipt && <ReceiptView receipt={cashReceipt} />}

      {owing.length > 0 && (
        <section className="flex flex-col gap-3">
          <Label>{t("Tiendas con deuda", "Shops that owe")}</Label>
          <ul className="flex flex-col gap-3">
            {owing.map((shop) => {
              const href = shopReminder(shop);
              return (
                <li key={shop.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <Link href={`/distribuidor/tienda/${shop.id}`} className="text-lg font-semibold text-brand underline-offset-4 hover:underline">
                        {shop.name}
                      </Link>
                      <span className={shop.overdue ? "font-medium text-bad" : "text-muted"}>
                        {t(`Debe ${formatMoney(shop.creditOwed)}`, `Owes ${formatMoney(shop.creditOwed)}`)}
                        {shop.creditDue
                          ? ` · ${
                              shop.overdue
                                ? t(`venció el ${formatDay(shop.creditDue)}`, `was due ${formatDay(shop.creditDue, "en")}`)
                                : t(`vence el ${formatDay(shop.creditDue)}`, `due ${formatDay(shop.creditDue, "en")}`)
                            }`
                          : ""}
                      </span>
                    </div>
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-12 items-center rounded-xl border border-brand px-4 text-base font-semibold text-brand active:bg-brand-soft"
                      >
                        {t("Recordar por WhatsApp", "Remind on WhatsApp")}
                      </a>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted">
            {t(
              "Demo: los números son de prueba. Revise el mensaje, pero no lo envíe.",
              "Demo: these are test phone numbers. Check the message, but don't send it. The message stays in Spanish, for the shop.",
            )}
          </p>
        </section>
      )}

      <div id="importar">
        <CsvImport
          shopName={shopName}
          driverName={driverName}
          onCreated={reload}
          known={scope.isDemo ? undefined : { shops: shops.map((s) => ({ id: s.id, name: s.name })), drivers: drivers.map((d) => ({ id: d.id, name: d.name })) }}
        />
      </div>

      {total === 0 ? (
        <Card className="flex flex-col gap-1 text-center">
          <p className="text-lg font-semibold">{t("Todavía no hay facturas.", "No invoices yet.")}</p>
          <p className="text-muted">{t("Aquí verá cada factura, quién la pagó y cómo.", "Here you'll see every invoice, who paid it and how.")}</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Label>{t("Estado", "Status")}</Label>
              {STATUS_FILTERS.map((f) => (
                <Filter key={f.key} active={statusFilter === (f.tone ?? "all")} onClick={() => setStatusFilter(f.tone ?? "all")}>
                  {f.tone ? STATUS_LABEL[f.tone][lang] : t("Todas", "All")}
                </Filter>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label>{t("Motorista", "Driver")}</Label>
              <Filter active={driverFilter === "all"} onClick={() => setDriverFilter("all")}>
                {t("Todos", "All")}
              </Filter>
              {drivers.map((d) => (
                <Filter key={d.id} active={driverFilter === d.id} onClick={() => setDriverFilter(d.id)}>
                  {d.name}
                </Filter>
              ))}
            </div>
          </div>

          {rows.length === 0 ? (
            <Card>
              <p className="text-center text-lg text-muted">{t("No hay facturas con este filtro.", "No invoices match this filter.")}</p>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-card">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-line text-sm text-muted">
                  <tr>
                    {[
                      [t("Factura", "Invoice"), false],
                      [t("Tienda", "Shop"), false],
                      [t("Motorista", "Driver"), false],
                      [t("Monto", "Amount"), true],
                      [t("Pagado", "Paid"), true],
                      [t("Estado", "Status"), false],
                      [t("Método", "Method"), false],
                      [t("Vence", "Due"), false],
                    ].map(([h, right]) => (
                      <th key={String(h)} scope="col" className={`px-4 py-3 font-semibold ${right ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                    {!scope.isDemo && (
                      <th scope="col" className="px-4 py-3">
                        <span className="sr-only">{t("Repetir", "Repeat")}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((invoice) => {
                    const status = invoiceStatus(invoice, lang);
                    return (
                      <tr
                        key={invoice.id}
                        className={`transition-colors duration-700 lg:text-lg ${invoice.id === newest || changed.has(invoice.id) ? "bg-brand-soft" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium tabular-nums">{invoice.id}</td>
                        <td className="px-4 py-3">
                          <Link href={`/distribuidor/tienda/${invoice.shopId}`} className="text-brand underline-offset-4 hover:underline">
                            {shopName(invoice.shopId)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{driverName(invoice.driverId)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(invoice.amount)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(invoice.paid)}
                          {invoice.creditFee !== undefined && (
                            <span className="block text-sm text-muted">
                              {t(`comisión de crédito ${formatMoney(invoice.creditFee)}`, `credit fee ${formatMoney(invoice.creditFee)}`)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex flex-wrap gap-1">
                            <Chip tone={status.tone}>{status.label}</Chip>
                            {invoice.cashClaim !== undefined && <Chip tone="cash">{t("Efectivo por confirmar", "Cash to confirm")}</Chip>}
                          </span>
                        </td>
                        <td className="px-4 py-3">{invoice.method ? methodLabel(invoice.method, lang) : "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDay(invoice.dueDate, lang)}</td>
                        {!scope.isDemo && (
                          <td className="px-2 py-1 text-right">
                            <Link
                              href={`/distribuidor/factura?tienda=${encodeURIComponent(invoice.shopId)}&motorista=${encodeURIComponent(invoice.driverId)}`}
                              aria-label={t(`Repetir factura ${invoice.id}`, `Repeat invoice ${invoice.id}`)}
                              className="inline-flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-brand underline active:bg-brand-soft"
                            >
                              {t("Repetir", "Repeat")}
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <p className="text-muted">
              {t(
                `Mostrando las ${invoices.length} facturas más recientes de ${total}.`,
                `Showing the ${invoices.length} most recent invoices of ${total}.`,
              )}
            </p>
            {invoices.length < total && (
              <button
                type="button"
                onClick={() => setPages((p) => p + 1)}
                disabled={loadingMore}
                className="min-h-12 rounded-xl border border-brand px-5 text-lg font-semibold text-brand active:bg-brand-soft disabled:border-line disabled:text-muted"
              >
                {loadingMore ? t("Cargando...", "Loading...") : t("Ver más", "Show more")}
              </button>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}
