"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { Chevron } from "./icons";

// Solid blue holds actions. Anything you tap is a filled blue control (the main action)
// or a clear outlined row (everything else). If it looks like paper, it isn't a button.

type Size = "md" | "lg";

/** 52 px tall; "lg" is 60 px, for the driver's screens (sun, gloves, one hand). */
const HEIGHT: Record<Size, string> = { md: "min-h-13", lg: "min-h-15" };

const PRESS =
  "transition-[scale,background-color,border-color] duration-[120ms] ease-snap active:scale-[0.97] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:active:scale-100 select-none";

/** A filled button can also be "sm" (44 px), for a top bar. */
type FilledSize = Size | "sm";
const FILL: Record<FilledSize, string> = {
  sm: "min-h-11 px-3.5 py-1 text-base leading-tight text-balance",
  md: "min-h-13 px-5 py-2 text-[1.125rem] text-balance",
  lg: "min-h-15 px-5 py-2 text-[1.125rem] text-balance",
};

const FILLED = `flex w-full flex-col items-center justify-center rounded-control text-center font-bold text-white ${PRESS}`;
const TONE = {
  primary:
    "bg-brand hover:bg-brand-press active:bg-brand-press disabled:bg-counter-rule disabled:text-muted aria-busy:disabled:bg-brand-press aria-busy:disabled:text-white data-arriving:disabled:bg-brand data-arriving:disabled:text-white",
  danger:
    "bg-bad hover:bg-[#8f1c13] active:bg-[#8f1c13] disabled:bg-counter-rule disabled:text-muted aria-busy:disabled:bg-[#8f1c13] aria-busy:disabled:text-white",
};

/**
 * The main action of a screen: filled blue ("danger" is filled red, for the confirm step of something that can't be undone).
 * `busy` holds the button and says "Procesando..."; nothing moves while a payment runs (the hint stays, so the button keeps its height).
 * `arriving` is for a button that can move money and has just come on screen: it fades in and ignores taps
 * for a beat (see useQuietOnArrival), so the second tap of a double tap can't pay.
 */
export function Button({
  children,
  hint,
  onClick,
  type = "button",
  disabled = false,
  busy = false,
  arriving = false,
  tone = "primary",
  size = "md",
}: {
  children: ReactNode;
  /** A second, lighter line: what exactly the tap will do. */
  hint?: ReactNode;
  /** Leave out for a form's submit button (type="submit"). */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  disabled?: boolean;
  busy?: boolean;
  arriving?: boolean;
  tone?: "primary" | "danger";
  size?: FilledSize;
}) {
  const { t } = useT();
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy || arriving}
      aria-busy={busy}
      data-arriving={arriving || undefined}
      className={`${FILLED} ${FILL[size]} ${TONE[tone]} ${arriving ? "arrive" : ""}`}
    >
      <span>{busy ? t("Procesando...", "Processing...") : children}</span>
      {hint && <span className="text-label font-normal opacity-90">{hint}</span>}
    </button>
  );
}

/**
 * Holds the place of a button that a payment removed, so no other button slides under the thumb.
 * Inert: words on the counter inside a dashed outline, the same size as the button it replaces.
 */
export function Held({ children, hint, size = "md" }: { children: ReactNode; hint?: ReactNode; size?: Size }) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-control px-5 py-2 text-center text-[1.125rem] font-bold text-muted outline-[1.5px] -outline-offset-[1.5px] outline-counter-rule outline-dashed ${HEIGHT[size]}`}
    >
      <span>{children}</span>
      {hint && <span className="text-label font-normal">{hint}</span>}
    </div>
  );
}

/** The main action as a link to another screen (or, with `external`, to WhatsApp in a new tab). */
export function ButtonLink({ href, children, hint, size = "md", external = false }: { href: string; children: ReactNode; hint?: ReactNode; size?: FilledSize; external?: boolean }) {
  const className = `${FILLED} ${FILL[size]} ${TONE.primary}`;
  const inner = (
    <>
      <span>{children}</span>
      {hint && <span className="text-label font-normal opacity-90">{hint}</span>}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

// ---------- secondary actions: outlined rows ----------

const ROW = `flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-brand ${PRESS}`;
const OUTLINE = "rounded-control border-[1.5px] border-brand hover:bg-brand/6 active:bg-brand/10";
const OUTLINE_OFF = "disabled:border-counter-rule disabled:text-muted disabled:hover:bg-transparent";

function RowLabel({ title, hint }: { title: ReactNode; hint?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-[1.0625rem] font-bold">{title}</span>
      {hint && <span className="text-label font-normal text-muted">{hint}</span>}
    </span>
  );
}

function RowEnd({ figure, open }: { figure?: ReactNode; open?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2">
      {figure && <span className="font-mono text-[1.0625rem] font-semibold text-ink">{figure}</span>}
      <Chevron open={open} />
    </span>
  );
}

/** Brings a panel that just opened into view. Stable, so it runs once each time the panel appears. */
function reveal(panel: HTMLDivElement | null) {
  panel?.scrollIntoView({ block: "nearest" });
}

/** Secondary actions under the main button: full-width outlined rows with 8 px between them. */
export function ActionList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-2 ${className}`}>{children}</div>;
}

/**
 * A secondary action: an outlined row with a label and a chevron. With `open` set it unfolds a panel
 * inside its own outline (the "Pagar otro monto" input lives there, never in a bar at the bottom).
 */
export function ActionRow({
  title,
  hint,
  figure,
  onClick,
  disabled = false,
  open,
  size = "md",
  children,
}: {
  title: ReactNode;
  hint?: ReactNode;
  /** A figure at the right end, in ink mono. */
  figure?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Set for rows that unfold a panel; leave out for a row that just acts. */
  open?: boolean;
  size?: Size;
  children?: ReactNode;
}) {
  if (open === undefined) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={`${ROW} ${OUTLINE} ${OUTLINE_OFF} ${HEIGHT[size]}`}>
        <RowLabel title={title} hint={hint} />
        <RowEnd figure={figure} />
      </button>
    );
  }
  return (
    <div className={`rounded-control border-[1.5px] ${disabled ? "border-counter-rule" : "border-brand"}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-expanded={open}
        className={`${ROW} ${HEIGHT[size]} rounded-[8px] -outline-offset-3 hover:bg-brand/6 active:bg-brand/10 disabled:text-muted disabled:hover:bg-transparent`}
      >
        <RowLabel title={title} hint={hint} />
        <RowEnd figure={figure} open={open} />
      </button>
      {open && children && (
        <div ref={reveal} className="flex scroll-mb-4 flex-col gap-3 px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

/** The same outlined row, as a link to another screen. */
export function ActionLink({
  href,
  title,
  hint,
  figure,
  size = "md",
  external = false,
}: {
  href: string;
  title: ReactNode;
  hint?: ReactNode;
  figure?: ReactNode;
  size?: Size;
  /** Opens in a new tab (WhatsApp, the public record). */
  external?: boolean;
}) {
  const className = `${ROW} ${OUTLINE} ${HEIGHT[size]}`;
  const inner = (
    <>
      <RowLabel title={title} hint={hint} />
      <RowEnd figure={figure} />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

/** A quiet text action (Cancelar, Atrás): blue words, no outline, still a full-size target ("lg": 56 px, for the driver). */
export function TextButton({ children, onClick, disabled = false, size = "md" }: { children: ReactNode; onClick: () => void; disabled?: boolean; size?: Size }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`self-center px-4 text-[1.0625rem] font-bold text-brand underline decoration-2 underline-offset-4 disabled:text-muted ${size === "lg" ? "min-h-14" : "min-h-12"}`}
    >
      {children}
    </button>
  );
}

/** "Ver detalles": the one kind of link that may sit on paper. */
export function DetailLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  const className = "inline-flex min-h-11 items-center font-semibold text-brand underline decoration-[1.5px] underline-offset-4";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
