"use client";

import { type ReactNode, useState } from "react";
import { ActionLink } from "@/components/kit/button";
import { FilterSelect } from "@/components/kit/field";
import { Slip, TopNav } from "@/components/kit/layout";
import { Ledger, LedgerCard, type LedgerColumn, LedgerFigure, LedgerFigures, RowLink } from "@/components/kit/ledger";
import { Money } from "@/components/kit/money";
import { Stamp } from "@/components/kit/stamp";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { getDrivers, getShop, getShopHistory } from "@/lib/api";
import { formatDay, formatMoney } from "@/lib/format";
import { type Lang, useT } from "@/lib/i18n";
import { MARK } from "@/lib/stamps";
import type { HistoryRow } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

// A shop's payment history (#136): what it owes now, then every payment (a part-paid
// invoice has several rows) and what's still open. The shop sees it from Mi cuenta and the
// distributor from its dashboard; both read the same rows. It is a ledger: a table with room,
// a card per row on a phone, and each row unfolds to its details and its receipt links.

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

/** "3 días de atraso": how late a payment came in. The per-invoice lateness line of the credit work (#137). */
function lateText(days: number, lang: Lang): string {
  if (lang === "en") return days === 1 ? "1 day late" : `${days} days late`;
  return days === 1 ? "1 día de atraso" : `${days} días de atraso`;
}

/**
 * The row's status as a small stamp. An invoice that is simply waiting carries no stamp, only the grey word.
 * A payment that came in late keeps its stamp and says how late beside it, in words.
 */
function StatusMark({ row }: { row: HistoryRow }) {
  const { lang } = useT();
  if (row.kind === "open") {
    if (row.daysLate > 0) {
      return (
        <Stamp small tone="bad">
          {MARK.overdue[lang]}
        </Stamp>
      );
    }
    return row.partial ? <Stamp small>{MARK.part[lang]}</Stamp> : <span className="font-sans text-muted">{MARK.due[lang]}</span>;
  }
  if (row.method === "credit") {
    return (
      <Stamp small tone="credit">
        {MARK.credit[lang]}
      </Stamp>
    );
  }
  if (row.daysLate > 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Stamp small tone="warn">
          {MARK.paid[lang]}
        </Stamp>
        <span className="font-sans text-label font-bold text-warn">{lateText(row.daysLate, lang)}</span>
      </span>
    );
  }
  return (
    <Stamp small tone="ok">
      {MARK.paid[lang]}
    </Stamp>
  );
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

/** The page around the ledger: as wide as a ledger needs, with the way back above it. */
export function HistoryFrame({ back, backLabel, children }: { back?: string; backLabel?: string; children: ReactNode }) {
  return (
    <Slip wide>
      <TopNav back={back} backLabel={backLabel} />
      {children}
    </Slip>
  );
}

export function ShopHistory({ shopId, backHref, backLabel }: { shopId: string; backHref: string; backLabel: string }) {
  const { lang, t } = useT();
  const { data, failed, reload } = usePolling(`history-${shopId}`, async () => {
    const [history, shop, drivers] = await Promise.all([getShopHistory(shopId), getShop(shopId), getDrivers()]);
    return { history, shop, drivers };
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [distributor, setDistributor] = useState<string>("all");
  const frame = (children: ReactNode) => (
    <HistoryFrame back={backHref} backLabel={backLabel}>
      {children}
    </HistoryFrame>
  );

  if (!data) return frame(failed ? <Failure onRetry={reload} /> : <Loading torn={false} lines={6} />);
  const { history, shop, drivers } = data;
  if (!history || !shop) {
    return frame(<Empty action={<ActionLink href={backHref} title={t(`Volver a ${backLabel}`, `Back to ${backLabel}`)} />}>{t("No encontramos esa tienda.", "We couldn't find that shop.")}</Empty>);
  }

  const driverName = (id?: string) => (id ? (drivers.find((d) => d.id === id)?.name ?? id) : undefined);
  const distributors = [...new Set(history.rows.map((r) => r.distributor))];
  const rows = history.rows.filter(
    (r) => (filter === "all" || (filter === "open" ? r.kind === "open" : r.kind === "payment")) && (distributor === "all" || r.distributor === distributor),
  );
  const filtered = filter !== "all" || distributor !== "all";

  /** When it was paid, or when it is due: "14 nov", "Vence 20 nov". */
  const when = (row: HistoryRow) =>
    row.at ? (
      formatDay(row.at, lang)
    ) : row.dueDate ? (
      <>
        <span className="font-sans text-label text-muted">{row.daysLate > 0 ? t("Venció", "Was due") : t("Vence", "Due")}</span> {formatDay(row.dueDate, lang)}
      </>
    ) : (
      "—"
    );
  const columns: LedgerColumn<HistoryRow>[] = [
    { id: "what", header: t("Registro", "Record"), grow: true, cell: (row) => title(row, lang), title: (row) => title(row, lang) },
    { id: "when", header: t("Fecha", "Date"), mono: true, cell: when },
    { id: "how", header: t("Cómo pagó", "How it was paid"), secondary: 54, cell: (row) => (row.kind === "payment" ? methodText(row, lang) : "—") },
    { id: "distributor", header: t("Distribuidor", "Distributor"), secondary: true, cell: (row) => row.distributor },
    { id: "driver", header: t("Motorista", "Driver"), secondary: true, cell: (row) => driverName(row.driverId) ?? "—" },
    { id: "due", header: t("Vencimiento", "Due date"), mono: true, secondary: true, cell: (row) => (row.dueDate ? formatDay(row.dueDate, lang) : "—") },
    { id: "amount", header: t("Monto", "Amount"), figure: true, cell: (row) => <Money value={row.amount} /> },
    { id: "status", header: t("Estado", "Status"), cell: (row) => <StatusMark row={row} /> },
  ];
  /** A row's receipt: the public record, a copy to send, and a way to say it is wrong. Blue links inside the row's fold. */
  const links = (row: HistoryRow) => {
    const receipt = shareText(row, shop.name, driverName(row.driverId), lang);
    const name = title(row, lang);
    return (
      <>
        {row.explorerUrl && (
          <RowLink external href={row.explorerUrl} label={t(`Ver detalles de ${name}`, `See details of ${name}`)}>
            {t("Ver detalles", "See details")}
          </RowLink>
        )}
        <RowLink external href={`https://wa.me/?text=${encodeURIComponent(receipt)}`} label={t(`Compartir por WhatsApp: ${name}`, `Share on WhatsApp: ${name}`)}>
          {t("Compartir por WhatsApp", "Share on WhatsApp")}
        </RowLink>
        <RowLink
          external
          href={`https://wa.me/?text=${encodeURIComponent(`${t("Hola, quiero reportar un error en este registro de Relay:", "Hi, I want to report a mistake in this Relay record:")}\n\n${receipt}`)}`}
          label={t(`Reportar un error en ${name}`, `Report a mistake in ${name}`)}
        >
          {t("Reportar un error", "Report a mistake")}
        </RowLink>
      </>
    );
  };

  return frame(
    <div className="@container flex flex-col gap-4">
      <header>
        <h1 className="text-title font-bold text-balance">{t("Historial", "History")}</h1>
        <p className="text-muted">{shop.name}</p>
      </header>

      <LedgerFigures pair>
        <LedgerFigure
          label={t("Debe ahora", "Owed now")}
          value={history.owedNow}
          note={history.nextDue ? `${t("Próximo vence", "Next due")} ${formatDay(history.nextDue, lang)}` : t("Nada por vencer", "Nothing coming due")}
        />
        <LedgerFigure label={t("Pagado este mes", "Paid this month")} value={history.paidThisMonth} />
      </LedgerFigures>

      {history.rows.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <FilterSelect label={t("Estado", "Status")} value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
            <option value="all">{t("Todas", "All")}</option>
            <option value="open">{t("Pendientes", "Unpaid")}</option>
            <option value="paid">{t("Pagadas", "Paid")}</option>
          </FilterSelect>
          {distributors.length > 1 && (
            <FilterSelect label={t("Distribuidor", "Distributor")} value={distributor} onChange={(event) => setDistributor(event.target.value)}>
              <option value="all">{t("Todos", "All")}</option>
              {distributors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </FilterSelect>
          )}
        </div>
      )}

      <Ledger
        label={t(`Historial de ${shop.name}`, `${shop.name}'s history`)}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.key}
        rowName={(row) => title(row, lang)}
        actions={links}
        card={(row) => (
          <LedgerCard
            title={title(row, lang)}
            amount={<Money value={row.amount} />}
            stamp={
              <>
                <StatusMark row={row} />
                {row.kind === "payment" && <span className="text-label text-muted">{methodText(row, lang)}</span>}
              </>
            }
            note={when(row)}
          />
        )}
        empty={<p className="text-lead text-balance">{filtered ? t("No hay nada con ese filtro.", "Nothing matches that filter.") : t("No hay nada aquí todavía.", "Nothing here yet.")}</p>}
      />

      {history.rows.some((r) => r.kind === "payment" && !r.at) && (
        <p className="text-label text-muted text-pretty">{t("Los pagos de hace más de una semana se muestran sin fecha por ahora.", "Payments from more than a week ago show without a date for now.")}</p>
      )}
    </div>,
  );
}
