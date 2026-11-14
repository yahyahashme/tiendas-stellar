"use client";

import { useState } from "react";
import { OptionList, reveal } from "@/components/ticket";
import { BackLink, Chip, LoadError, Loading, NotFound, Screen } from "@/components/ui";
import { getDrivers, getShop, getShopHistory } from "@/lib/api";
import { formatDay, formatMoney } from "@/lib/format";
import { type Lang, useT } from "@/lib/i18n";
import type { HistoryRow } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

// A shop's payment history (#136): what it owes now, then every payment (a part-paid
// invoice has several rows) and what's still open. The shop sees it from Mi cuenta and the
// distributor from its dashboard; both read the same rows.

type Filter = "all" | "open" | "paid";

const METHOD: Record<NonNullable<HistoryRow["method"]>, { es: string; en: string }> = {
  digital: { es: "Dólares digitales", en: "Digital dollars" },
  cash: { es: "Efectivo", en: "Cash" },
  credit: { es: "Crédito 7 días", en: "7-day credit" },
  repay: { es: "Pago de deuda", en: "Debt payment" },
};

function methodText(row: HistoryRow, lang: Lang): string {
  const base = row.method ? METHOD[row.method][lang] : lang === "en" ? "Paid" : "Pagado";
  return row.partial && row.kind === "payment" ? `${base} · ${lang === "en" ? "part payment" : "pago parcial"}` : base;
}

function status(row: HistoryRow, lang: Lang): { text: string; tone: "paid" | "due" | "part" | "overdue" | "credit" } {
  const en = lang === "en";
  if (row.kind === "open") {
    if (row.daysLate > 0) return { text: en ? "Overdue" : "Vencida", tone: "overdue" };
    return row.partial ? { text: en ? "Part paid" : "Parcial", tone: "part" } : { text: en ? "Unpaid" : "Pendiente", tone: "due" };
  }
  if (row.method === "credit") return { text: en ? "On credit" : "A crédito", tone: "credit" };
  if (row.daysLate > 0) {
    const days = row.daysLate === 1 ? (en ? "1 day" : "1 día") : en ? `${row.daysLate} days` : `${row.daysLate} días`;
    return { text: en ? `Paid ${days} late` : `Pagada con ${days} de atraso`, tone: "due" };
  }
  return { text: en ? "Paid" : "Pagada", tone: "paid" };
}

function title(row: HistoryRow, lang: Lang): string {
  if (row.invoiceId === null) return lang === "en" ? "Credit paid back" : "Pago de crédito";
  return `${lang === "en" ? "Invoice" : "Factura"} ${row.invoiceId}`;
}

function shareText(row: HistoryRow, shopName: string, driver: string | undefined, lang: Lang): string {
  const en = lang === "en";
  const when = row.at ? formatDay(row.at, lang) : "";
  return [
    `Relay · ${en ? "receipt" : "recibo"}`,
    shopName,
    row.distributor,
    title(row, lang),
    `${row.kind === "open" ? (en ? "Left to pay" : "Falta") : en ? "Paid" : "Pagado"}: ${formatMoney(row.amount)}`,
    row.kind === "payment" ? `${en ? "Method" : "Método"}: ${methodText(row, lang)}` : "",
    driver ? `${en ? "Driver" : "Motorista"}: ${driver}` : "",
    when ? `${en ? "Date" : "Fecha"}: ${when}` : "",
    row.explorerUrl ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ShopHistory({ shopId, backHref, backLabel }: { shopId: string; backHref: string; backLabel: string }) {
  const { lang, t } = useT();
  const { data, failed } = usePolling(`history-${shopId}`, async () => {
    const [history, shop, drivers] = await Promise.all([getShopHistory(shopId), getShop(shopId), getDrivers()]);
    return { history, shop, drivers };
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [distributor, setDistributor] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const back = <BackLink href={backHref} label={backLabel} />;

  if (!data) {
    return (
      <Screen>
        {back}
        {failed ? <LoadError /> : <Loading />}
      </Screen>
    );
  }
  const { history, shop, drivers } = data;
  if (!history || !shop) {
    return (
      <Screen>
        {back}
        <NotFound>{t("No encontramos esa tienda.", "We couldn't find that shop.")}</NotFound>
      </Screen>
    );
  }

  const driverName = (id?: string) => (id ? (drivers.find((d) => d.id === id)?.name ?? id) : undefined);
  const distributors = [...new Set(history.rows.map((r) => r.distributor))];
  const rows = history.rows.filter(
    (r) =>
      (filter === "all" || (filter === "open" ? r.kind === "open" : r.kind === "payment")) &&
      (distributor === "all" || r.distributor === distributor),
  );
  const filters: [Filter, string][] = [
    ["all", t("Todas", "All")],
    ["open", t("Pendientes", "Unpaid")],
    ["paid", t("Pagadas", "Paid")],
  ];

  return (
    <Screen>
      {back}
      <header>
        <h1 className="text-3xl font-bold text-balance">{t("Historial", "History")}</h1>
        <p className="text-muted">{shop.name}</p>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        {[
          [t("Debe ahora", "Owed now"), formatMoney(history.owedNow)],
          [t("Próximo vence", "Next due"), history.nextDue ? formatDay(history.nextDue, lang) : "—"],
          [t("Pagado este mes", "Paid this month"), formatMoney(history.paidThisMonth)],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border border-line bg-card px-3 py-3">
            <dt className="text-sm text-muted text-balance">{label}</dt>
            <dd className="text-lg font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t("Filtrar", "Filter")}>
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className="min-h-11 rounded-full border-2 border-line bg-card px-4 text-base font-semibold text-muted aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-white"
          >
            {label}
          </button>
        ))}
        {distributors.length > 1 && (
          <select
            value={distributor}
            onChange={(e) => setDistributor(e.target.value)}
            aria-label={t("Distribuidor", "Distributor")}
            className="min-h-11 rounded-full border-2 border-line bg-card px-4 text-base font-semibold"
          >
            <option value="all">{t("Todos los distribuidores", "All distributors")}</option>
            {distributors.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted">{t("No hay nada aquí todavía.", "Nothing here yet.")}</p>
      ) : (
        <OptionList>
          {rows.map((row) => {
            const s = status(row, lang);
            const isOpen = open === row.key;
            const driver = driverName(row.driverId);
            const when = row.at ? formatDay(row.at, lang) : row.dueDate ? t(`Vence el ${formatDay(row.dueDate)}`, `Due ${formatDay(row.dueDate, "en")}`) : "";
            return (
              <div key={row.key}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : row.key)}
                  className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left -outline-offset-3 active:bg-brand-soft"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-lg font-semibold text-brand">{title(row, lang)}</span>
                    <span className="text-sm text-muted">
                      {[when, row.kind === "payment" ? methodText(row, lang) : undefined, driver].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-lg font-semibold tabular-nums">{formatMoney(row.amount)}</span>
                    <Chip tone={s.tone}>{s.text}</Chip>
                  </span>
                </button>
                {isOpen && (
                  <div ref={reveal} className="unfold flex flex-col gap-3 px-4 pb-4">
                    <dl className="flex flex-col gap-1 text-base">
                      {[
                        [t("Distribuidor", "Distributor"), row.distributor],
                        [row.kind === "open" ? t("Falta pagar", "Left to pay") : t("Monto", "Amount"), formatMoney(row.amount)],
                        row.kind === "payment" ? [t("Cómo pagó", "How it was paid"), methodText(row, lang)] : null,
                        driver ? [t("Motorista", "Driver"), driver] : null,
                        row.at ? [t("Fecha", "Date"), formatDay(row.at, lang)] : null,
                        row.dueDate ? [t("Vencía", "Due"), formatDay(row.dueDate, lang)] : null,
                        [t("Estado", "Status"), s.text],
                      ]
                        .filter((x): x is string[] => x !== null)
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <dt className="text-muted">{k}</dt>
                            <dd className="text-right font-medium">{v}</dd>
                          </div>
                        ))}
                    </dl>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {row.explorerUrl && (
                        <a href={row.explorerUrl} target="_blank" rel="noreferrer" className="min-h-11 content-center font-medium text-brand underline">
                          {t("Ver detalles", "See details")}
                        </a>
                      )}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareText(row, shop.name, driver, lang))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-11 content-center font-medium text-brand underline"
                      >
                        {t("Compartir por WhatsApp", "Share on WhatsApp")}
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `${t("Hola, quiero reportar un error en este registro de Relay:", "Hi, I want to report a mistake in this Relay record:")}\n\n${shareText(row, shop.name, driver, lang)}`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-11 content-center font-medium text-muted underline"
                      >
                        {t("Reportar un error", "Report a mistake")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </OptionList>
      )}
      {history.rows.some((r) => r.kind === "payment" && !r.at) && (
      <p className="text-sm text-muted text-pretty">
        {t(
          "Los pagos de hace más de una semana se muestran sin fecha por ahora.",
          "Payments from more than a week ago show without a date for now.",
        )}
      </p>
      )}
    </Screen>
  );
}
