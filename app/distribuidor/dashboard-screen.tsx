"use client";

import { useEffect, useRef, useState } from "react";
import { DistributorShell } from "@/components/distributor-shell";
import { ActionLink, Button, ButtonLink, TextButton } from "@/components/kit/button";
import { FilterSelect } from "@/components/kit/field";
import { Ledger, LedgerCard, type LedgerColumn, LedgerFigure, LedgerFigures, RowButton, RowLink } from "@/components/kit/ledger";
import { Money } from "@/components/kit/money";
import { Stamp } from "@/components/kit/stamp";
import { Answer, Empty, Failure, Loading } from "@/components/kit/states";
import { TapShield, useMovedGuard, useTapShield } from "@/components/tap-shield";
import { createDemoInvoice, getDistributorView, handInCash } from "@/lib/api";
import { DEMO_PHONES } from "@/lib/demo-contacts";
import { formatAmount, formatDay, plural } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { invoiceStatus, leftToPay, methodLabel, type StatusTone } from "@/lib/labels";
import { toUnits } from "@/lib/money";
import { dueWindow, invoiceMark, MARK } from "@/lib/stamps";
import type { Driver, Invoice, Receipt, Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";
import { reminderLink } from "@/lib/whatsapp";

const STATUS_FILTERS: StatusTone[] = ["due", "part", "paid", "credit"];
type DueFilter = "all" | "overdue" | "week";

/** The panel opens on the ten newest invoices: with the four figures above them, that is the first screenful on a laptop. */
const FIRST_ROWS = 10;

/**
 * `pages` pages of history (newest first): every refresh re-reads all of them, so nothing goes stale.
 * A signed-in, approved distributor sees their own business (#130); anyone else, the demo.
 * Shops include every shop the distributor works with, so a debt counts even when its invoices are older.
 */
const loadDashboard = async (pages: number) => ({ ...(await getDistributorView(pages)), now: Date.now() });

const HIGHLIGHT_MS = 4000;

/** WhatsApp link with the reminder ready, or null if the shop has no demo phone. */
function shopReminder(shop: Shop, now: number): string | null {
  const phone = DEMO_PHONES[shop.id];
  if (!phone || shop.creditOwed <= 0) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL || (typeof window === "undefined" ? "" : window.location.origin);
  try {
    return reminderLink({
      phone,
      shopName: shop.name,
      amountUnits: toUnits(shop.creditOwed.toFixed(2)),
      dueAt: shop.creditDue ? Math.floor(Date.parse(shop.creditDue) / 1000) : 0,
      now: Math.floor(now / 1000),
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

const SECTION = "flex scroll-mt-[calc(var(--band-h)+0.75rem)] flex-col gap-2";
/** The small ledgers under the invoices share one width. */
const SMALL = "max-w-[48rem]";
const HEADING = "text-lead leading-tight font-bold";

/** "Primeros pasos" for a new distributor (#130): done when there is at least one of each. A done step is a fact on paper; a step to do is a blue row. */
function FirstSteps({ steps }: { steps: { label: string; done: boolean; href: string }[] }) {
  const { t } = useT();
  return (
    <section id="pasos" className={SECTION}>
      <h2 className={HEADING}>{t("Primeros pasos", "First steps")}</h2>
      <ol className="grid gap-2 @min-[48rem]:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.label}>
            {step.done ? (
              // On the narrowest phone at a large text size the stamp goes under the words instead of off the paper.
              <p className="flex min-h-13 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-paper bg-paper px-4 py-2">
                <span className="min-w-0 wrap-anywhere">
                  {index + 1}. {step.label}
                </span>
                <Stamp small tone="ok">
                  {t("Hecho", "Done")}
                </Stamp>
              </p>
            ) : (
              <ActionLink href={step.href} title={`${index + 1}. ${step.label}`} />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function DashboardScreen() {
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const { data, failed, reload, stale } = usePolling("dashboard", () => loadDashboard(pages));
  const firstPages = useRef(pages);
  useEffect(() => {
    if (pages === firstPages.current) return; // the first load is usePolling's
    firstPages.current = pages;
    setLoadingMore(true);
    void reload().finally(() => setLoadingMore(false));
  }, [pages, reload]);
  const [statusFilter, setStatusFilter] = useState<StatusTone | "all">("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newest, setNewest] = useState<number | null>(null);
  const changed = useChangedRows(data?.invoices);
  const [handingIn, setHandingIn] = useState<string | null>(null);
  const [held, setHeld] = useState(false);
  const running = useRef(false);
  const [cashReceipt, setCashReceipt] = useState<Receipt | null>(null);
  const { noteTap, settle } = useTapShield();
  // A refresh can add a row above the drivers (a shop takes credit), and one driver's button moves to where the other's was.
  const { ref: driversBlock, justMoved } = useMovedGuard<HTMLElement>();
  const { lang, t } = useT();

  async function cashHandedIn(driverId: string, amount: number) {
    if (running.current || justMoved()) return;
    running.current = true;
    setHandingIn(driverId);
    setCashReceipt(null);
    const result = await handInCash(driverId, amount);
    if (result.ok) await reload();
    setCashReceipt(result);
    setHeld(true);
    setHandingIn(null);
    await settle();
    setHeld(false);
    running.current = false;
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
  // The new invoice stays lit as long as a changed row does, then the ledger is plain paper again.
  useEffect(() => {
    if (newest === null) return;
    const timer = setTimeout(() => setNewest(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [newest]);

  const isDemo = data ? data.scope.isDemo : true;
  const steps = data
    ? [
        { label: t("Agregar sus motoristas", "Add your drivers"), done: data.drivers.length > 0, href: "/distribuidor/motoristas" },
        { label: t("Agregar sus tiendas", "Add your shops"), done: data.shops.length > 0, href: "/distribuidor/tiendas" },
        { label: t("Crear su primera factura", "Create your first invoice"), done: data.total > 0, href: "/distribuidor/factura" },
      ]
    : [];
  const stepsLeft = !isDemo && steps.some((step) => !step.done);

  const shell = (children: React.ReactNode) => (
    <DistributorShell
      current="panel"
      name={data?.scope.name}
      demo={isDemo}
      firstSteps={stepsLeft}
      action={(place) => {
        if (!data) return null;
        const size = place === "bar" ? "sm" : "md";
        return isDemo ? (
          <Button size={size} onClick={newDemoInvoice} busy={creating}>
            {t("Nueva factura de demo", "New demo invoice")}
          </Button>
        ) : (
          <ButtonLink size={size} href="/distribuidor/factura">
            {t("Nueva factura", "New invoice")}
          </ButtonLink>
        );
      }}
    >
      {children}
    </DistributorShell>
  );

  if (!data)
    return shell(
      <>
        <h1 className="sr-only">{t("Panel", "Dashboard")}</h1>
        {failed ? <Failure onRetry={reload} /> : <Loading lines={8} torn={false} />}
      </>,
    );

  const { invoices, total, totals, drivers, shops, scope, now } = data;
  const shopName = (id: string) => shops.find((s) => s.id === id)?.name ?? id;
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id;

  // The four figures. Collected comes from the contract's running totals, so it covers all history.
  const collected = sum([totals.digital, totals.credit, totals.cash]);
  const cashless = sum([totals.digital, totals.credit]);
  const unpaid = invoices.filter((i) => i.status !== "paid");
  const toCollect = sum(unpaid.map(leftToPay));
  const onCredit = sum(shops.map((s) => s.creditOwed));
  const overdue = sum(shops.filter((s) => s.overdue).map((s) => s.creditOwed));
  const owing = shops.filter((s) => s.creditOwed > 0);
  const cashOut = sum(drivers.map((d) => d.cashHeld));
  const holding = drivers.filter((d) => d.cashHeld > 0).length;

  const filtered = statusFilter !== "all" || driverFilter !== "all" || dueFilter !== "all";
  const matching = invoices.filter( // already newest first
    (i) =>
      (statusFilter === "all" || invoiceStatus(i).tone === statusFilter) &&
      (driverFilter === "all" || i.driverId === driverFilter) &&
      (dueFilter === "all" || dueWindow(i, now) === dueFilter),
  );
  const rows = expanded || filtered ? matching : matching.slice(0, FIRST_ROWS);
  const moreLoaded = rows.length < matching.length;
  const lit = (i: Invoice) => i.id === newest || changed.has(i.id);

  const stamp = (i: Invoice) => {
    const mark = invoiceMark(i, now);
    // Nothing has happened to an unpaid invoice yet, so nothing is stamped on it: plain words, and the stamps stand out.
    if (mark === "due") return <span className="text-muted">{MARK.due[lang]}</span>;
    return (
      <Stamp small tone={MARK[mark].tone} fresh={changed.has(i.id) && (mark === "paid" || mark === "credit")}>
        {MARK[mark][lang]}
      </Stamp>
    );
  };
  // What the distributor paid for the part that went on credit (#135). Two tight lines, so the row keeps its height.
  const paidCell = (i: Invoice) =>
    i.creditFee !== undefined ? (
      <span className="inline-flex flex-col items-end align-middle leading-[1.1]" title={t("Comisión de crédito", "Credit fee")}>
        <Money value={i.paid} />
        <span className="font-sans text-[0.875rem]/[1.1] font-normal text-muted">
          <span className="sr-only">{t("comisión de crédito", "credit fee")}</span>
          <span aria-hidden>{t("comisión", "fee")}</span> <Money value={i.creditFee} className="text-ink" />
        </span>
      </span>
    ) : i.paid > 0 ? (
      <Money value={i.paid} />
    ) : (
      // Nothing paid yet reads as a dash, like the method beside it: the amounts that were paid are the ones to see.
      <span className="font-sans text-muted">
        <span aria-hidden>—</span>
        <span className="sr-only">{formatAmount(0)}</span>
      </span>
    );
  const invoiceColumns: LedgerColumn<Invoice>[] = [
    { id: "id", header: t("N.º", "No."), mono: true, foldOnCard: true, cell: (i) => i.id },
    { id: "shop", header: t("Tienda", "Shop"), grow: true, cell: (i) => shopName(i.shopId), title: (i) => shopName(i.shopId), total: `Total · ${plural(rows.length, t("factura", "invoice"), t("facturas", "invoices"))}` },
    { id: "driver", header: t("Motorista", "Driver"), secondary: 54, cell: (i) => driverName(i.driverId) },
    { id: "amount", header: t("Monto", "Amount"), figure: true, cell: (i) => <Money value={i.amount} />, total: <Money value={sum(rows.map((i) => i.amount))} /> },
    { id: "paid", header: t("Pagado", "Paid"), figure: true, secondary: 54, cell: paidCell, total: <Money value={sum(rows.map((i) => i.paid))} /> },
    { id: "status", header: t("Estado", "Status"), cell: stamp },
    { id: "method", header: t("Método", "Method"), secondary: true, cell: (i) => (i.method ? methodLabel(i.method, lang) : i.cashClaim !== undefined ? methodLabel("cash", lang) : "—") },
    { id: "due", header: t("Vence", "Due"), mono: true, end: true, cell: (i) => formatDay(i.dueDate, lang) },
  ];

  const handIn = (d: Driver) =>
    d.cashHeld > 0 ? (
      <RowButton
        onClick={() => void cashHandedIn(d.id, d.cashHeld)}
        label={t(`Marcar efectivo entregado: ${d.name}, ${formatAmount(d.cashHeld)}`, `Mark cash handed in: ${d.name}, ${formatAmount(d.cashHeld)}`)}
        // Old figures (the page was left and come back to) could hand in an amount the driver no longer holds.
        disabled={handingIn !== null || held || Boolean(stale)}
        busy={handingIn === d.id}
      >
        {t("Marcar efectivo entregado", "Mark cash handed in")}
      </RowButton>
    ) : (
      // As tall as the button it replaces: when cash is handed in, the next driver's button stays where it was.
      <span className="inline-flex min-h-11 items-center justify-end font-sans text-label text-muted">{t("Nada por entregar", "Nothing to hand in")}</span>
    );
  const driverColumns: LedgerColumn<Driver>[] = [
    { id: "driver", header: t("Motorista", "Driver"), grow: true, cell: (d) => d.name, title: (d) => d.name, total: "Total" },
    { id: "cash", header: t("Efectivo", "Cash"), figure: true, cell: (d) => <Money value={d.cashHeld} />, total: <Money value={cashOut} /> },
    // One width whatever it holds (the button, "Guardando...", "Nada por entregar"), so the cash column never moves sideways.
    { id: "hand", header: <span className="sr-only">{t("Entrega", "Hand-in")}</span>, end: true, className: "w-64 min-w-64 py-1", cell: handIn },
  ];

  const remind = (shop: Shop) => {
    const href = shopReminder(shop, now);
    return href ? (
      <RowLink external href={href} label={t(`Recordar por WhatsApp a ${shop.name}`, `Remind ${shop.name} on WhatsApp`)}>
        {t("Recordar por WhatsApp", "Remind on WhatsApp")}
      </RowLink>
    ) : null;
  };
  const shopStamp = (shop: Shop) =>
    shop.overdue ? (
      <Stamp small tone="bad">
        {MARK.overdue[lang]}
      </Stamp>
    ) : (
      <Stamp small tone="credit">
        {MARK.credit[lang]}
      </Stamp>
    );
  const shopColumns: LedgerColumn<Shop>[] = [
    { id: "shop", header: t("Tienda", "Shop"), grow: true, cell: (s) => s.name, title: (s) => s.name, total: "Total" },
    { id: "owed", header: t("Debe", "Owes"), figure: true, cell: (s) => <Money value={s.creditOwed} />, total: <Money value={onCredit} /> },
    { id: "status", header: t("Estado", "Status"), cell: shopStamp },
    { id: "due", header: t("Vence", "Due"), mono: true, end: true, cell: (s) => (s.creditDue ? formatDay(s.creditDue, lang) : "—") },
    { id: "remind", header: <span className="sr-only">{t("Recordatorio", "Reminder")}</span>, end: true, className: "py-0", cell: remind },
  ];

  return shell(
    <div className="flex flex-col gap-4">
      {(handingIn !== null || held) && <TapShield onTap={noteTap} />}
      <h1 className="sr-only">{t(`Panel de ${scope.name}`, `${scope.name} dashboard`)}</h1>
      <p aria-hidden className="text-label font-semibold uppercase tracking-[0.1em] text-muted sm:hidden">
        {scope.name}
      </p>

      {stepsLeft && <FirstSteps steps={steps} />}

      <section id="resumen" aria-label={t("Resumen", "Summary")}>
        <LedgerFigures>
          <LedgerFigure
            label={t("Cobrado", "Collected")}
            value={collected}
            note={
              collected > 0 ? (
                <>
                  <Money value={cashless} className="text-ink" /> {t("sin efectivo", "without cash")}
                </>
              ) : (
                t("Todavía nada", "Nothing yet")
              )
            }
          />
          <LedgerFigure
            label={t("Por cobrar", "To collect")}
            value={toCollect}
            // Older invoices that aren't loaded aren't in the sum, and the note says so in one line.
            note={
              invoices.length < total
                ? t(`en las ${invoices.length} más recientes`, `in the ${invoices.length} most recent`)
                : plural(unpaid.length, t("factura", "invoice"), t("facturas", "invoices"))
            }
          />
          <LedgerFigure
            label={t("En crédito", "On credit")}
            value={onCredit}
            note={
              overdue > 0 ? (
                <span className="font-semibold text-bad">
                  <Money value={overdue} className="text-ink" /> {t("vencido", "overdue")}
                </span>
              ) : onCredit > 0 ? (
                t("Al día", "On time")
              ) : (
                t("Ninguna tienda debe", "No shop owes")
              )
            }
          />
          <LedgerFigure
            label={t("Efectivo con motoristas", "Cash with drivers")}
            value={cashOut}
            note={holding > 0 ? plural(holding, t("motorista", "driver"), t("motoristas", "drivers")) : t("Nada por entregar", "Nothing to hand in")}
          />
        </LedgerFigures>
      </section>

      <section id="facturas" className={SECTION}>
        <div className="flex flex-col gap-2 @min-[56rem]:flex-row @min-[56rem]:items-end @min-[56rem]:justify-between">
          <div className="flex min-h-11 flex-col justify-end">
            <h2 className={HEADING}>{t("Facturas", "Invoices")}</h2>
            <p role="status" className={`text-label ${failed ? "font-semibold text-bad" : "text-muted"}`}>
              {failed ? t("No se pudo actualizar. Reintentando...", "Couldn't update. Trying again...") : t("Se actualiza cada 5 segundos.", "Updates every 5 seconds.")}
            </p>
          </div>
          {total > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <FilterSelect label={t("Estado", "Status")} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusTone | "all")}>
                <option value="all">{t("Todas", "All")}</option>
                {STATUS_FILTERS.map((tone) => (
                  <option key={tone} value={tone}>
                    {MARK[tone][lang]}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect label={t("Motorista", "Driver")} value={driverFilter} onChange={(event) => setDriverFilter(event.target.value)}>
                <option value="all">{t("Todos", "All")}</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect label={t("Vence", "Due")} value={dueFilter} onChange={(event) => setDueFilter(event.target.value as DueFilter)}>
                <option value="all">{t("Cualquier fecha", "Any date")}</option>
                <option value="overdue">{t("Vencidas", "Overdue")}</option>
                <option value="week">{t("En 7 días", "Within 7 days")}</option>
              </FilterSelect>
            </div>
          )}
        </div>

        {total === 0 ? (
          <Empty>{t("Todavía no hay facturas. Aquí verá cada factura, quién la pagó y cómo.", "No invoices yet. Here you'll see every invoice, who paid it and how.")}</Empty>
        ) : (
          <>
            <Ledger
              label={t("Facturas", "Invoices")}
              columns={invoiceColumns}
              rows={rows}
              rowKey={(i) => i.id}
              rowName={(i) => t(`la factura ${i.id}`, `invoice ${i.id}`)}
              rowClassName={(i) => `transition-colors duration-700 ${lit(i) ? "bg-brand-tint!" : ""}`}
              card={(i) => <LedgerCard title={shopName(i.shopId)} amount={<Money value={i.amount} />} stamp={stamp(i)} note={`${t("Vence", "Due")} ${formatDay(i.dueDate, lang)}`} />}
              actions={(i) => (
                <>
                  <RowLink href={`/distribuidor/tienda/${i.shopId}`} label={t(`Historial de ${shopName(i.shopId)}`, `History of ${shopName(i.shopId)}`)}>
                    {t("Historial", "History")}
                  </RowLink>
                  {!scope.isDemo && (
                    <RowLink
                      href={`/distribuidor/factura?tienda=${encodeURIComponent(i.shopId)}&motorista=${encodeURIComponent(i.driverId)}`}
                      label={t(`Repetir factura ${i.id}`, `Repeat invoice ${i.id}`)}
                    >
                      {t("Repetir", "Repeat")}
                    </RowLink>
                  )}
                </>
              )}
              empty={<p className="text-lead">{t("No hay facturas con este filtro.", "No invoices match this filter.")}</p>}
            />
            <div className="flex flex-wrap items-center justify-between gap-x-4">
              <p className="text-label text-muted">
                {filtered
                  ? invoices.length >= total
                    ? t(`${plural(rows.length, "factura", "facturas")} con este filtro, de ${total} en total.`, `${plural(rows.length, "invoice", "invoices")} with this filter, of ${total} in all.`)
                    : t(
                        `${plural(rows.length, "factura", "facturas")} con este filtro, entre las ${invoices.length} más recientes de ${total}.`,
                        `${plural(rows.length, "invoice", "invoices")} with this filter, among the ${invoices.length} most recent of ${total}.`,
                      )
                  : rows.length >= total
                    ? t(`${plural(total, "factura", "facturas")} en total.`, `${plural(total, "invoice", "invoices")} in all.`)
                    : t(`Mostrando las ${rows.length} facturas más recientes de ${total}.`, `Showing the ${rows.length} most recent invoices of ${total}.`)}
              </p>
              {filtered && (
                <TextButton
                  onClick={() => {
                    setStatusFilter("all");
                    setDriverFilter("all");
                    setDueFilter("all");
                  }}
                >
                  {t("Quitar filtros", "Clear filters")}
                </TextButton>
              )}
              {(moreLoaded || invoices.length < total) && (
                <TextButton
                  disabled={loadingMore}
                  onClick={() => {
                    if (moreLoaded) setExpanded(true);
                    else setPages((p) => p + 1);
                  }}
                >
                  {loadingMore ? t("Cargando...", "Loading...") : t("Ver más", "Show more")}
                </TextButton>
              )}
            </div>
          </>
        )}
      </section>

      <section id="tiendas" className={`${SECTION} ${SMALL}`}>
        <h2 className={HEADING}>{t("Tiendas con deuda", "Shops that owe")}</h2>
        <Ledger
          label={t("Tiendas con deuda", "Shops that owe")}
          columns={shopColumns}
          rows={owing}
          rowKey={(s) => s.id}
          rowName={(s) => s.name}
          card={(s) => (
            <LedgerCard
              title={s.name}
              amount={<Money value={s.creditOwed} />}
              stamp={shopStamp(s)}
              note={s.creditDue ? `${s.overdue ? t("Venció", "Was due") : t("Vence", "Due")} ${formatDay(s.creditDue, lang)}` : undefined}
              actions={remind(s)}
            />
          )}
          actions={(s) => (
            <RowLink href={`/distribuidor/tienda/${s.id}`} label={t(`Historial de ${s.name}`, `History of ${s.name}`)}>
              {t("Historial", "History")}
            </RowLink>
          )}
          empty={<p className="text-lead">{t("Ninguna tienda debe ahora.", "No shop owes right now.")}</p>}
        />
        {owing.some((s) => DEMO_PHONES[s.id]) && (
          <p className="text-label text-muted">
            {t(
              "Demo: los números son de prueba. Revise el mensaje, pero no lo envíe.",
              "Demo: these are test phone numbers. Check the message, but don't send it. The message stays in Spanish, for the shop.",
            )}
          </p>
        )}
      </section>

      <section id="motoristas" ref={driversBlock} className={`${SECTION} ${SMALL}`}>
        <h2 className={HEADING}>{t("Efectivo con motoristas", "Cash with drivers")}</h2>
        <Ledger
          label={t("Efectivo con motoristas", "Cash with drivers")}
          columns={driverColumns}
          rows={drivers}
          rowKey={(d) => d.id}
          card={(d) => <LedgerCard title={d.name} amount={<Money value={d.cashHeld} />} actions={handIn(d)} />}
          empty={<p className="text-lead">{t("Todavía no tiene motoristas.", "You don't have drivers yet.")}</p>}
        />
        {/* Its place is always there, so the news of a hand-in never moves anything. */}
        <div className="min-h-11">{cashReceipt && <Answer receipt={cashReceipt} />}</div>
      </section>

      {/* A file of invoices is imported on the Nueva factura page, beside the form. */}
      <div className={SMALL}>
        <ActionLink
          href="/distribuidor/factura#importar"
          title={t("Importar facturas (CSV)", "Import invoices (CSV)")}
          hint={t("Varias facturas a la vez, desde un archivo.", "Several invoices at once, from a file.")}
        />
      </div>
    </div>,
  );
}
