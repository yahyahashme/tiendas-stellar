"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Money } from "@/components/kit/money";
import { Paper } from "@/components/kit/paper";
import { useT } from "@/lib/i18n";
import { Buttons, Fields, InvoiceReceipt, PayActions, SampleFigures, SampleLedger, SampleManifest, Section, Stamps, States } from "./samples";

// The design system on one page: every component in every state, with sample content.
// Open it at 390 and 1280 px (node scripts/screens.mjs system). It loads no data and links nowhere real.

const COLOURS: [string, string, string][] = [
  ["counter", "bg-counter", "#e6e1d4"],
  ["paper", "bg-paper", "#fffdf8"],
  ["paper-rule", "bg-paper-rule", "#d9d3c4"],
  ["ink", "bg-ink", "#14202e"],
  ["muted", "bg-muted", "#4f5a68"],
  ["brand", "bg-brand", "#0b4ea2"],
  ["ok", "bg-ok", "#146c43"],
  ["warn", "bg-warn", "#8f5200"],
  ["bad", "bg-bad", "#b42318"],
  ["credit", "bg-credit", "#5b3fa6"],
];

export default function Sistema() {
  const { t } = useT();
  return (
    <main className="@container mx-auto w-full max-w-[84rem] flex-1 px-(--gutter) pb-10 pt-4">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="flex flex-col gap-2">
          <Logo className="h-9 w-auto" />
          <h1 className="text-title font-bold">Papel de confianza</h1>
          <p className="max-w-[60ch] text-lead text-muted">{t("El papel guarda los datos. El azul sólido guarda las acciones.", "Paper holds facts. Solid blue holds actions.")}</p>
        </div>
        <nav className="flex gap-2 font-bold text-brand underline decoration-2 underline-offset-4">
          <Link href="/sistema/split" className="inline-flex min-h-11 min-w-11 items-center px-1">
            Split
          </Link>
          <Link href="/sistema/shell" className="inline-flex min-h-11 min-w-11 items-center px-1">
            Shell
          </Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 @min-[60rem]:grid-cols-2 @min-[84rem]:grid-cols-3">
        <Section title={t("Recibo: por pagar", "Receipt: unpaid")}>
          <InvoiceReceipt />
        </Section>
        <Section title={t("Recibo: pagada, con productos", "Receipt: paid, with items")}>
          <InvoiceReceipt paid lines amount={1234.5} />
        </Section>
        <Section title={t("Acciones de pago", "Pay actions")}>
          <PayActions />
        </Section>

        <Section title={t("Sellos", "Stamps")}>
          <Stamps />
        </Section>
        <Section title={t("Botones y filas", "Buttons and rows")}>
          <Buttons />
        </Section>
        <Section title={t("Campos", "Fields")}>
          <Fields />
        </Section>

        <Section title={t("Libro mayor", "Ledger")} wide>
          <SampleFigures />
          <SampleLedger />
        </Section>
        <Section title={t("Hoja de ruta", "Route sheet")}>
          <SampleManifest />
        </Section>

        <Section title={t("Estados: cargando, vacío, error", "States: loading, empty, error")}>
          <States />
        </Section>
        <Section title={t("Letra", "Type")}>
          <Paper className="flex flex-col gap-3 px-4 py-5">
            <p className="text-title font-bold">Atkinson Hyperlegible Next 700</p>
            <p className="text-lead font-semibold">¿Cuánto paga ahora? ¡Año, pingüino, señal!</p>
            <p>El papel guarda los datos: montos, fechas, nombres, historial y estado. Á É Í Ó Ú Ñ Ü á é í ó ú ñ ü ¿ ¡ $</p>
            <p className="text-label text-muted">Etiqueta de 14 px, nunca menos.</p>
            <p className="font-mono text-figure font-semibold">
              <Money value={1234.5} />
            </p>
            <p className="font-mono font-medium">IBM Plex Mono 500 · 0123456789 · n.º 1001 · 13 nov 2026</p>
          </Paper>
        </Section>
        <Section title={t("Color", "Colour")}>
          <ul className="grid grid-cols-2 gap-2">
            {COLOURS.map(([name, swatch, hex]) => (
              <li key={name} className="flex flex-wrap items-center gap-2">
                <span className={`size-9 shrink-0 rounded-paper border border-counter-rule ${swatch}`} />
                <span className="flex min-w-0 flex-col leading-tight wrap-anywhere">
                  <span className="text-label font-semibold">{name}</span>
                  <span className="font-mono text-label font-medium text-muted">{hex}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </main>
  );
}
