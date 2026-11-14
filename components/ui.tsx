"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { setLang, useT } from "@/lib/i18n";
import type { StatusTone } from "@/lib/labels";
import type { Receipt } from "@/lib/types";

export function Screen({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto flex w-full flex-1 flex-col gap-5 px-4 pb-10 pt-4 ${wide ? "max-w-6xl" : "max-w-md"}`}>
      {children}
    </main>
  );
}

export function BackLink({ href = "/", label }: { href?: string; label?: string }) {
  const { t } = useT();
  return (
    <Link href={href} className="-ml-1 inline-flex min-h-12 items-center gap-1 self-start px-1 text-base font-medium text-brand">
      <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.5 4.5 7 10l5.5 5.5" />
      </svg>
      {label ?? t("Inicio", "Home")}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-card p-4 ${className}`}>{children}</section>;
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</p>;
}

type Variant = "primary" | "secondary";

const BUTTON =
  "flex min-h-14 w-full flex-col items-center justify-center rounded-xl px-5 py-2 text-center text-lg font-semibold transition-[background-color,scale] duration-150 ease-snap active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100";
const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand text-white active:bg-brand-dark disabled:bg-line disabled:text-muted aria-busy:disabled:bg-brand-dark aria-busy:disabled:text-white data-arriving:disabled:bg-brand data-arriving:disabled:text-white",
  secondary: "border-2 border-brand bg-card text-brand active:bg-brand-soft disabled:border-line disabled:text-muted aria-busy:disabled:border-brand aria-busy:disabled:text-brand",
};

export function Button({
  children,
  hint,
  onClick,
  type = "button",
  disabled = false,
  busy = false,
  arriving = false,
  variant = "primary",
}: {
  children: ReactNode;
  hint?: ReactNode;
  /** Leave out for a form's submit button (type="submit"). */
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  busy?: boolean;
  /** Just came on screen: fades in and can't be tapped yet (see useQuietOnArrival). */
  arriving?: boolean;
  variant?: Variant;
}) {
  const { t } = useT();
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy || arriving}
      aria-busy={busy}
      data-arriving={arriving || undefined}
      className={`${BUTTON} ${VARIANT[variant]} ${arriving ? "arrive" : ""}`}
    >
      <span className={busy ? "animate-pulse" : undefined}>{busy ? t("Procesando...", "Processing...") : children}</span>
      {hint && <span className="text-sm font-normal opacity-85">{hint}</span>}
    </button>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: Variant }) {
  return (
    <Link href={href} className={`${BUTTON} ${VARIANT[variant]}`}>
      {children}
    </Link>
  );
}

const CHIP: Record<StatusTone | "cash" | "overdue", string> = {
  due: "bg-warn-soft text-warn",
  part: "bg-brand-soft text-brand",
  paid: "bg-ok-soft text-ok",
  credit: "bg-credit-soft text-credit",
  cash: "bg-warn-soft text-warn ring-1 ring-warn/40",
  overdue: "bg-bad-soft text-bad",
};

export function Chip({ tone, children }: { tone: keyof typeof CHIP; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${CHIP[tone]}`}>
      {children}
    </span>
  );
}

export function Loading() {
  const { t } = useT();
  return (
    <p className="animate-pulse py-10 text-center text-lg text-muted" role="status">
      {t("Cargando...", "Loading...")}
    </p>
  );
}

export function LoadError() {
  const { t } = useT();
  return (
    <p className="rounded-xl bg-bad-soft px-4 py-3 text-bad" role="alert">
      {t("No se pudo cargar. Reintentando...", "Couldn't load. Trying again...")}
    </p>
  );
}

export function NotFound({ children }: { children: ReactNode }) {
  return (
    <Card>
      <p className="text-lg">{children}</p>
    </Card>
  );
}

export function ReceiptView({ receipt }: { receipt: Receipt }) {
  const { t, msg } = useT();
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-base ${receipt.ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}
    >
      <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d={receipt.ok ? "m4 10.5 4 4 8-9" : "M10 4v7.5M10 15.5v.01"} />
      </svg>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{msg(receipt.message)}</p>
        {receipt.explorerUrl && (
          <a href={receipt.explorerUrl} target="_blank" rel="noreferrer" className="text-sm underline">
            {t("Ver detalles", "See details")}
          </a>
        )}
      </div>
    </div>
  );
}

/** Español / English, in the demo banner at the top of every screen. */
export function LangSwitch() {
  const { lang } = useT();
  const option = (value: "es" | "en", label: string, name: string) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      aria-label={name}
      lang={value}
      className={`min-h-9 min-w-11 rounded-full px-3 text-sm font-semibold transition-colors duration-150 ${
        lang === value ? "bg-warn text-white" : "text-warn active:bg-warn/15"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Idioma / Language" className="flex shrink-0 rounded-full border border-warn/40 bg-card/60 p-0.5">
      {option("es", "ES", "Español")}
      {option("en", "EN", "English")}
    </div>
  );
}

/** The strip above every screen: this is a demo, plus the language switch. */
export function DemoBanner() {
  const { t } = useT();
  return (
    <div className="bg-warn-soft">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
        <p className="text-sm font-medium text-warn">
          {t("Demo en testnet · dinero de prueba · cash-in simulado", "Testnet demo · test money · simulated cash-in")}
        </p>
        <LangSwitch />
      </div>
    </div>
  );
}
