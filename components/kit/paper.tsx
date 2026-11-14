"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { useT } from "@/lib/i18n";
import { Money, moneyWidth } from "./money";

/**
 * Paper holds facts: amounts, dates, names, history, status. Warm off-white on the counter, near-square
 * corners, hairline rules, no shadow. Nothing on paper is tappable except a "Ver detalles" text link.
 */
export function Paper({ children, className = "", as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" | "li" }) {
  return <Tag className={`rounded-paper bg-paper ${className}`}>{children}</Tag>;
}

/**
 * El recibo: the printed slip, torn at top and bottom. `printIn` reveals it top to bottom, once, when an
 * invoice first loads. Build it from the parts below.
 */
export function Receipt({ children, printIn = false, className = "" }: { children: ReactNode; printIn?: boolean; className?: string }) {
  return (
    <section className={`torn bleed-narrow @container flex flex-col gap-3 bg-paper px-[clamp(0.75rem,6cqi,1.5rem)] py-4 short:gap-2 short:py-3 ${printIn ? "print-in" : ""} ${className}`}>
      {children}
    </section>
  );
}

/** Who the slip is from, then its number and date in mono, centred like a printed header. `as="h1"` when it names the page. */
export function ReceiptHeader({ from, number, date, as: Tag = "p", children }: { from: ReactNode; number?: ReactNode; date?: ReactNode; as?: "p" | "h1" | "h2"; children?: ReactNode }) {
  return (
    <header className="flex flex-col items-center gap-1 text-center">
      <Tag className="text-lead font-bold uppercase tracking-[0.06em] text-balance">{from}</Tag>
      {(number || date) && (
        <p className="font-mono text-label font-medium uppercase tracking-[0.04em] text-muted">
          {number}
          {number && date && " · "}
          {date}
        </p>
      )}
      {children}
    </header>
  );
}

export function ReceiptRule({ double = false }: { double?: boolean }) {
  return <hr className={double ? "rule-double" : "rule-dotted"} />;
}

/** The lines of a slip. Each one is a ReceiptLine. */
export function ReceiptLines({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-1.5">{children}</dl>;
}

/**
 * One printed line: label, dotted leader, figure. `strong` for the line that matters most.
 * The label never gives up a word. A value too long to sit beside it (a long shop name on a small phone,
 * or any name at a large text size) drops to a line of its own, at the right, and wraps there if it must.
 * `shorten` is for a name, never for an amount: on a short screen the name stays on its line and is cut
 * with "…" instead, so the slip keeps its height and every way to pay stays in view.
 */
export function ReceiptLine({
  label,
  children,
  strong = false,
  shorten = false,
  className = "",
}: {
  label: ReactNode;
  children: ReactNode;
  strong?: boolean;
  shorten?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-end justify-end font-mono text-base ${shorten ? "short:flex-nowrap" : ""} ${strong ? "font-semibold text-ink" : "font-medium text-muted"} ${className}`}
    >
      <dt className="flex flex-1 items-end">
        <span>{label}</span>
        <span aria-hidden className={`leader ${shorten ? "short:min-w-0" : ""}`} />
      </dt>
      <dd className={`max-w-full text-right text-ink wrap-anywhere ${shorten ? "short:min-w-0 short:truncate" : ""}`}>{children}</dd>
    </div>
  );
}

/**
 * Lines that fold away on a short screen, so the total and the pay buttons stay in view without scrolling:
 * "Ver productos (3)". On a tall screen, or beside the actions in a Split, the lines simply show and there
 * is nothing to tap. (This and "Ver detalles" are the only things on paper that respond to a tap.)
 */
export function ReceiptFold({ count, label, children }: { count: number; /** Instead of "Ver productos (n)". */ label?: ReactNode; children: ReactNode }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="-my-1.5 flex flex-col @min-[40rem]/split:my-0 tall:my-0">
      <button
        type="button"
        onClick={() => setOpen((now) => !now)}
        aria-expanded={open}
        className="min-h-11 self-start font-semibold text-brand underline decoration-[1.5px] underline-offset-4 @min-[40rem]/split:hidden tall:hidden"
      >
        {open ? t("Ocultar", "Hide") : (label ?? t(`Ver productos (${count})`, `See items (${count})`))}
      </button>
      <div className={open ? "pb-1.5" : "hidden @min-[40rem]/split:block tall:block"}>{children}</div>
    </div>
  );
}

/**
 * The total under its double rule. On the shop's invoice this is the largest thing in the product, and it
 * shrinks to fit rather than clip when the amount is long or the screen is 280 px wide.
 */
export function ReceiptTotal({ label, value, note, children }: { label: ReactNode; value: number; note?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <ReceiptRule double />
      <p className="flex items-baseline justify-between gap-3 pt-1.5">
        <span className="text-label font-bold uppercase tracking-[0.12em]">{label}</span>
        {note && <span className="text-right font-mono text-label font-medium text-muted">{note}</span>}
      </p>
      <p
        className="fit-figure font-mono font-semibold leading-none tracking-[-0.03em]"
        style={{ "--fit-max": "var(--text-total)", "--fit-chars": moneyWidth(value) } as CSSProperties}
      >
        <Money value={value} />
      </p>
      {children}
    </div>
  );
}

/**
 * The foot of a slip: a line of words on the left, the stamp slot on the right.
 * The words may fold to their longest word to make room. When even that and the stamp cannot share a line
 * (a small phone, a large text size), the stamp moves under the words: it never lies over "Ver detalles".
 */
export function ReceiptFoot({ children, stamp }: { children?: ReactNode; stamp?: ReactNode }) {
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-4">
      <div className="w-min grow text-base text-muted">{children}</div>
      {stamp && <div className="-mt-2 ml-auto max-w-full pr-1">{stamp}</div>}
    </div>
  );
}
