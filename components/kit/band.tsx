"use client";

import { setLang, useT } from "@/lib/i18n";

/** Español / English. The language on screen is plain ink (a fact); the other one is a blue link (an action). */
export function LangSwitch() {
  const { lang } = useT();
  const option = (value: "es" | "en", label: string, name: string) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      aria-label={name}
      lang={value}
      className={`relative h-4 min-w-11 px-2 text-label/4 font-bold tracking-[0.08em] before:absolute before:inset-x-0 before:-top-3 before:-bottom-4 gloves:min-w-[56px] gloves:before:-top-4 gloves:before:-bottom-6 ${
        lang === value ? "text-ink" : "text-brand underline decoration-2 underline-offset-4"
      }`}
    >
      {label}
    </button>
  );
  return (
    // One line tall, so the band's words run under it from their second line on. Each button's tap area reaches past its letters (44 px).
    <div role="group" aria-label="Idioma / Language" className="float-right -mr-2 ml-3 flex h-4 items-center text-label/4">
      {option("es", "ES", "Español")}
      <span aria-hidden className="text-muted gloves:px-1">
        ·
      </span>
      {option("en", "EN", "English")}
    </div>
  );
}

/**
 * The thin band above every screen, like the MUESTRA or COPIA marking on a slip: this is a demo.
 * It stays at the top while the screen scrolls, and holds the language switch.
 * Its words are label size (14 px), never smaller: the demo has to say on screen that the cash-in is simulated.
 */
export function TestnetBand() {
  const { t } = useT();
  return (
    <div className="sticky top-0 z-5 border-b border-dashed border-counter-rule bg-paper pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-(--band-h) items-center py-1 pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))]">
        {/* The switch floats at the end of the first line: on a phone the words get the whole width for their second line. */}
        <div className="flow-root w-full">
          <LangSwitch />
          <p className="text-label/[1.25] font-semibold uppercase tracking-[0.08em] text-muted">
            {t("Demo en testnet · dinero de prueba · cash-in simulado", "Testnet demo · test money · simulated cash-in")}
          </p>
        </div>
      </div>
    </div>
  );
}
