"use client";

import Link from "next/link";
import { Children, type CSSProperties, Fragment, isValidElement, type ReactNode, useState } from "react";
import { useT } from "@/lib/i18n";
import { Chevron } from "./icons";
import { Money, moneyWidth } from "./money";

// El libro mayor: the distributor's ledger. Ruled columns, right-aligned mono figures,
// totals under a double rule. With less than 60 rem of room it keeps its priority columns
// and folds the rest into each row (a column worth more than its room can come back sooner);
// below 40 rem each row becomes a ledger card. It never scrolls sideways.

export type LedgerColumn<Row> = {
  id: string;
  header: ReactNode;
  /** A figure column: right-aligned mono between vertical rules, like the money columns of a ledger. */
  figure?: boolean;
  /** Mono (invoice numbers, dates). */
  mono?: boolean;
  /** Right-aligned without the rules (dates). */
  end?: boolean;
  /**
   * Not a priority column: with little room it moves into the row's fold. `true` brings it back as a column
   * at 60 rem of room; 54 brings it back sooner (a large iPad on its side has room for more than an upright one).
   */
  secondary?: boolean | 54;
  /** Stays a column of the table at every width, but on a phone's card it goes into the card's fold (the invoice number). */
  foldOnCard?: boolean;
  /** The one column that takes the room the others leave. A name too long for it ends in "…", so every row keeps one height. */
  grow?: boolean;
  cell: (row: Row) => ReactNode;
  /** The whole text of a `grow` cell, shown when the pointer rests on it. */
  title?: (row: Row) => string;
  /** The total under this column, if the ledger has a totals row. */
  total?: ReactNode;
  /** Extra classes for this column's cells (width, wrapping). */
  className?: string;
};

// Row actions come up on hover or focus, when there is a mouse and room for every column. They take the end
// of the `grow` cell and the name shortens with "…" to make room, so they never cover an amount, a stamp or a
// date (a ledger without a `grow` column shows them over the end of the row). Until then they are out of sight
// but still reachable with Tab. Everywhere else (touch, or a narrower table) each row has a fold button instead,
// and the actions sit inside the fold with the columns that didn't fit.
const HOVER_ONLY = "hidden pointer-fine:@min-[60rem]:table-cell";
const HOVER_ACTIONS = "items-center gap-1 bg-paper pl-3 whitespace-nowrap opacity-0 group-focus-within:opacity-100 group-hover:opacity-100";
const IN_CELL_ACTIONS = "sr-only hidden shrink-0 group-focus-within:not-sr-only group-hover:not-sr-only pointer-fine:@min-[60rem]:block";

/** When a folded column comes back as a column of the table, and the rule that takes it out of the fold then. */
const RETURNS = {
  54: { column: "hidden @min-[54rem]:table-cell", fold: "@min-[54rem]:hidden" },
  60: { column: "hidden @min-[60rem]:table-cell", fold: "@min-[60rem]:hidden" },
} as const;
const returnsAt = (column: { secondary?: boolean | 54 }) => (column.secondary === true ? 60 : column.secondary || undefined);

export function Ledger<Row>({
  label,
  columns,
  rows,
  rowKey,
  rowName,
  card,
  actions,
  empty,
  rowClassName,
}: {
  /** What this ledger lists, for screen readers. */
  label: string;
  columns: LedgerColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
  /** What to call a row out loud ("factura 1010"), for the fold button. */
  rowName?: (row: Row) => string;
  /** The same row as a card, for phones: name and amount first, stamp and date second. */
  card: (row: Row) => ReactNode;
  /** Blue controls for a row: its row menu. */
  actions?: (row: Row) => ReactNode;
  /** One plain sentence (plus the next action) for when there are no rows. */
  empty?: ReactNode;
  rowClassName?: (row: Row) => string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState<ReadonlySet<string | number>>(new Set());
  const toggle = (key: string | number) =>
    setOpen((now) => {
      const next = new Set(now);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const hasTotals = columns.some((column) => column.total !== undefined);
  const folded = columns.filter((column) => column.secondary);
  const cardFolded = columns.filter((column) => column.secondary || column.foldOnCard);
  const hasFold = folded.length > 0 || actions !== undefined;
  const hasGrow = columns.some((column) => column.grow);
  const endActions = actions !== undefined && !hasGrow;
  const hasCardFold = cardFolded.length > 0 || actions !== undefined;
  const foldOnly = actions ? "pointer-fine:@min-[60rem]:hidden" : "@min-[60rem]:hidden";
  const place = (column: LedgerColumn<Row>) =>
    `${column.figure ? "border-x border-paper-rule text-right font-mono font-medium" : column.end ? "text-right" : "text-left"} ${column.mono ? "font-mono font-medium" : ""} ${
      column.secondary ? RETURNS[returnsAt(column)!].column : ""
    } ${column.grow ? "w-full max-w-0 truncate" : "whitespace-nowrap"}`;
  const more = (row: Row, key: string | number) => t(`Ver más de ${rowName?.(row) ?? key}`, `See more of ${rowName?.(row) ?? key}`);
  const details = (row: Row, inCard: boolean) => (
    <>
      {(inCard ? cardFolded : folded).length > 0 && (
        <dl className={`flex flex-wrap gap-x-8 gap-y-1 ${inCard ? "" : "@min-[60rem]:hidden"}`}>
          {(inCard ? cardFolded : folded).map((column) => (
            <div key={column.id} className={`flex flex-wrap items-baseline gap-x-2 ${inCard || !column.secondary ? "" : RETURNS[returnsAt(column)!].fold}`}>
              <dt className="text-label font-semibold uppercase tracking-[0.08em] text-muted">{column.header}</dt>
              <dd className={column.figure || column.mono ? "font-mono font-medium" : ""}>{column.cell(row)}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions && <div className="flex flex-wrap gap-x-2">{actions(row)}</div>}
    </>
  );

  if (rows.length === 0 && empty) return <div className="rounded-paper bg-paper px-4 py-6">{empty}</div>;
  return (
    <div className="@container">
      <table className="hidden w-full border-collapse rounded-paper bg-paper @min-[40rem]:table">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-b border-ink">
            {columns.map((column) => (
              <th key={column.id} scope="col" className={`h-10 px-3 text-label font-semibold uppercase tracking-[0.08em] text-muted ${place(column)} font-sans`}>
                {column.header}
              </th>
            ))}
            {endActions && (
              <th scope="col" className={`w-0 p-0 ${HOVER_ONLY}`}>
                <span className="sr-only">{t("Acciones", "Actions")}</span>
              </th>
            )}
            {hasFold && (
              <th scope="col" className={`w-0 p-0 ${foldOnly}`}>
                <span className="sr-only">{t("Más", "More")}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const isOpen = open.has(key);
            return (
              <Fragment key={key}>
                <tr className={`group border-b border-paper-rule ${rowClassName?.(row) ?? ""}`}>
                  {columns.map((column) => {
                    // The `grow` cell names the row (the shop, the driver): it is the row's header.
                    const Cell = column.grow ? "th" : "td";
                    return (
                      <Cell key={column.id} scope={column.grow ? "row" : undefined} title={column.title?.(row)} className={`h-11 px-3 py-1 text-base ${column.grow ? "font-normal" : ""} ${place(column)} ${column.className ?? ""}`}>
                        {column.grow && actions ? (
                          <div className="flex items-center gap-1">
                            <span className="min-w-0 flex-1 truncate">{column.cell(row)}</span>
                            <span className={IN_CELL_ACTIONS}>
                              {/* As tall as the cell's words, so the row keeps its height when they come up. */}
                              <span className="flex h-9 items-center gap-1">{actions(row)}</span>
                            </span>
                          </div>
                        ) : (
                          column.cell(row)
                        )}
                      </Cell>
                    );
                  })}
                  {endActions && (
                    <td className={`w-0 p-0 ${HOVER_ONLY}`}>
                      <div className="relative">
                        <div className={`absolute top-1/2 right-0 flex h-10.5 -translate-y-1/2 pr-1 ${HOVER_ACTIONS}`}>{actions(row)}</div>
                      </div>
                    </td>
                  )}
                  {hasFold && (
                    <td className={`h-11 w-0 p-0 text-right ${foldOnly}`}>
                      <button type="button" onClick={() => toggle(key)} aria-expanded={isOpen} aria-label={more(row, key)} className="inline-flex size-11 items-center justify-center text-brand -outline-offset-3">
                        <Chevron open={isOpen} />
                      </button>
                    </td>
                  )}
                </tr>
                {isOpen && hasFold && (
                  <tr className={`border-b border-paper-rule ${foldOnly}`}>
                    <td colSpan={columns.length + (endActions ? 2 : 1)} className="px-3 pt-1 pb-2">
                      <div className="flex flex-col gap-1">{details(row, false)}</div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        {hasTotals && (
          <tfoot>
            <tr className="border-t-[3px] border-double border-ink">
              {columns.map((column) => {
                const Cell = column.grow ? "th" : "td";
                return (
                  <Cell key={column.id} scope={column.grow ? "row" : undefined} className={`h-12 px-3 text-base ${place(column)} font-semibold`}>
                    {column.total}
                  </Cell>
                );
              })}
              {endActions && <td className={`p-0 ${HOVER_ONLY}`} />}
              {hasFold && <td className={`p-0 ${foldOnly}`} />}
            </tr>
          </tfoot>
        )}
      </table>
      <ul className="flex flex-col gap-2 @min-[40rem]:hidden">
        {rows.map((row) => {
          const key = rowKey(row);
          const isOpen = open.has(key);
          return (
            <li key={key} className={`rounded-paper bg-paper ${rowClassName?.(row) ?? ""}`}>
              <div className="flex items-stretch">
                <div className={`min-w-0 flex-1 py-3 pl-3 ${hasCardFold ? "" : "pr-3"}`}>{card(row)}</div>
                {hasCardFold && (
                  <button type="button" onClick={() => toggle(key)} aria-expanded={isOpen} aria-label={more(row, key)} className="flex w-11 shrink-0 items-center justify-center rounded-r-paper text-brand -outline-offset-3">
                    <Chevron open={isOpen} />
                  </button>
                )}
              </div>
              {isOpen && hasCardFold && <div className="flex flex-col gap-1 border-t border-paper-rule px-3 pt-2 pb-1">{details(row, true)}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The usual shape of a ledger card: name and amount on the first line, stamp and date on the second, actions below. */
export function LedgerCard({ title, amount, stamp, note, actions }: { title: ReactNode; amount: ReactNode; stamp?: ReactNode; note?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-[1.0625rem] font-bold wrap-anywhere">{title}</span>
        <span className="shrink-0 font-mono text-[1.0625rem] font-semibold">{amount}</span>
      </p>
      {(stamp || note) && (
        <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex flex-wrap items-center gap-1.5">{stamp}</span>
          {note && <span className="font-mono text-label font-medium text-muted">{note}</span>}
        </p>
      )}
      {actions && <div className="flex flex-col gap-2 pt-1">{actions}</div>}
    </div>
  );
}

const ROW_TEXT = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control px-2.5 font-sans text-base font-bold text-brand underline decoration-2 underline-offset-4 -outline-offset-3";

/** A small blue action in a row's menu ("Repetir"). `danger` turns it red, for the second tap of something that can't be undone. */
export function RowAction({ children, onClick, label, danger = false }: { children: ReactNode; onClick: () => void; label?: string; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`${ROW_TEXT} ${danger ? "text-bad!" : ""}`}>
      {children}
    </button>
  );
}

/** The same, as a link to another screen (or, with `external`, to WhatsApp in a new tab). */
export function RowLink({ children, href, label, external = false }: { children: ReactNode; href: string; label?: string; external?: boolean }) {
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={ROW_TEXT}>
      {children}
    </a>
  ) : (
    <Link href={href} aria-label={label} className={ROW_TEXT}>
      {children}
    </Link>
  );
}

/**
 * A row's own main action, always in view ("Marcar efectivo entregado"): a small outlined blue button.
 * `label` says out loud which row it acts on; start it with the words on the button.
 */
export function RowButton({ children, onClick, label, disabled = false, busy = false }: { children: ReactNode; onClick: () => void; label?: string; disabled?: boolean; busy?: boolean }) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
      aria-label={label}
      className="inline-flex min-h-11 items-center justify-center rounded-control border-[1.5px] border-brand px-3 py-1 text-center font-sans text-base leading-tight font-bold text-brand select-none hover:bg-brand/6 active:bg-brand/10 disabled:cursor-not-allowed disabled:border-counter-rule disabled:text-muted disabled:hover:bg-transparent"
    >
      {busy ? t("Guardando...", "Saving...") : children}
    </button>
  );
}

/**
 * The strip of figures that opens a ledger page: labels above, big mono numbers, a double rule underneath.
 * Four across with room; two by two on a phone. Every figure is set at one size: the size at which the
 * longest of them fits the narrowest column, so one amount passing $1,000 never looks smaller than its neighbours.
 */
export function LedgerFigures({ children, pair = false }: { children: ReactNode; /** Two figures only: they stay two across at every width. */ pair?: boolean }) {
  const longest = Math.max(1, ...Children.toArray(children).map((child) => (isValidElement<{ value?: number }>(child) && typeof child.props.value === "number" ? moneyWidth(child.props.value) : 0)));
  return (
    <div className="@container/figures">
      <dl
        style={{ "--fit-chars": longest } as CSSProperties}
        className={`grid grid-cols-2 rounded-t-paper bg-paper [--fit-cols:2] ${pair ? "" : "@min-[44rem]:grid-cols-4 @min-[44rem]:[--fit-cols:4] @min-[58rem]:grid-cols-[1fr_1fr_1fr_1.3fr] @min-[58rem]:[--fit-cols:4.3]"}`}
      >
        {children}
      </dl>
      <hr className="rule-double bg-paper" />
    </div>
  );
}

/** One figure of the strip, for <LedgerFigures>. A long amount shrinks to stay inside its column, and the others with it. */
export function LedgerFigure({ label, value, note }: { label: ReactNode; value: number; note?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-paper-rule px-4 pt-2.5 pb-2.5 not-first:border-l @max-[43.99rem]/figures:nth-[3]:border-l-0 @max-[43.99rem]/figures:nth-[n+3]:border-t @max-[43.99rem]/figures:[&:nth-child(n+3)>dt]:min-h-[2lh]">
      {/* A long label takes two lines (four across on a tablet, the second pair on a phone): its row of labels keeps room for two, so the figures stay in line. */}
      <dt className="flex items-end wrap-anywhere text-label font-semibold uppercase tracking-[0.08em] text-muted @min-[44rem]/figures:@max-[57.99rem]/figures:min-h-[2lh]">{label}</dt>
      <dd
        className="font-mono leading-tight font-semibold tracking-[-0.02em]"
        style={{ fontSize: "min(var(--text-figure), calc((100cqi / var(--fit-cols) - 2rem) / (var(--fit-chars) * 0.62)))" }}
      >
        <Money value={value} />
      </dd>
      {note && <dd className="text-label text-muted text-pretty">{note}</dd>}
    </div>
  );
}
