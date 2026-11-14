"use client";

import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useId, useState } from "react";
import { useT } from "@/lib/i18n";

// A form is paper you write on: each input is a blank with a clear outline, a large label above it,
// and its error in words underneath.

// scroll-mb: when the phone brings a focused input into view, the button under it comes too.
export const INPUT =
  "min-h-13 w-full scroll-mb-28 rounded-control border-[1.5px] border-muted bg-paper px-3.5 text-[1.125rem] text-ink placeholder:text-muted/70 focus:border-brand focus:outline-3 focus:outline-brand focus:-outline-offset-1 aria-invalid:border-bad disabled:border-counter-rule disabled:text-muted";

type Common = { label: ReactNode; hint?: ReactNode; error?: ReactNode };

function Frame({ id, label, hint, error, children }: Common & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[1.0625rem] font-bold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-note`} role="alert" className="font-semibold text-bad">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-note`} className="text-label text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** A labelled input, 52 px tall. Pass `inputMode` for the right phone keyboard. */
export function Field({ label, hint, error, className = "", ...input }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error}>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined} className={`${INPUT} ${className}`} {...input} />
    </Frame>
  );
}

/** A few lines of free text (a note, the products on an invoice). */
export function AreaField({ label, hint, error, className = "", ...area }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error}>
      <textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined} className={`${INPUT} py-3 ${className}`} {...area} />
    </Frame>
  );
}

/** An amount in dollars: the decimal keypad, mono figures, the sign already printed in the blank. */
export function MoneyField({ label, hint, error, ...input }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-mono text-[1.25rem] font-semibold text-muted">
          $
        </span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          className={`${INPUT} pl-9 font-mono text-[1.25rem] font-semibold`}
          {...input}
        />
      </div>
    </Frame>
  );
}

export function SelectField({ label, hint, error, children, ...select }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error}>
      <select id={id} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined} className={`${INPUT} select-chevron appearance-none pr-10`} {...select}>
        {children}
      </select>
    </Frame>
  );
}

/**
 * One choice in the row of filters above a ledger. Compact (44 px) and outlined in blue: it is a control, not paper.
 * With room the label sits beside it; on a phone it sits above, and the filters share the row.
 */
export function FilterSelect({ label, children, ...select }: { label: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div className="flex min-w-30 flex-1 flex-col gap-1 @min-[40rem]:flex-none @min-[40rem]:flex-row @min-[40rem]:items-center @min-[40rem]:gap-2">
      <label htmlFor={id} className="text-label font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </label>
      <select
        id={id}
        className="select-chevron min-h-11 w-full appearance-none rounded-control border-[1.5px] border-brand bg-transparent py-1 pr-9 pl-3 text-base font-bold text-brand hover:bg-brand/6 focus:outline-3 focus:outline-brand @min-[40rem]:w-auto"
        {...select}
      >
        {children}
      </select>
    </div>
  );
}

/** A password input with "Mostrar / Ocultar". */
export function PasswordField({ label, hint, error, ...input }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const { t } = useT();
  return (
    <Frame id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          className={`${INPUT} pr-24`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="absolute inset-y-0 right-0 min-w-22 rounded-control px-3 font-bold text-brand underline decoration-2 underline-offset-4 -outline-offset-3"
        >
          {shown ? t("Ocultar", "Hide") : t("Mostrar", "Show")}
        </button>
      </div>
    </Frame>
  );
}

/** What went wrong with the whole form, in words, above its button. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="font-semibold text-bad">
      {children}
    </p>
  );
}
