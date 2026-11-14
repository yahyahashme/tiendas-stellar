"use client";

import { type InputHTMLAttributes, type ReactNode, useId, useState } from "react";
import { useT } from "@/lib/i18n";

export const INPUT =
  "min-h-14 w-full rounded-xl border-2 border-line bg-card px-3 text-lg placeholder:text-muted focus:border-brand focus:outline-none aria-invalid:border-bad";

/** A labelled input, big enough for a thumb, with an optional hint under it. */
export function TextField({
  label,
  hint,
  ...input
}: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-semibold">
        {label}
      </label>
      <input id={id} className={INPUT} {...input} />
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** A password input with "Mostrar / Ocultar". */
export function PasswordField({
  label,
  hint,
  ...input
}: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const { t } = useT();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-semibold">
        {label}
      </label>
      <div className="relative">
        <input id={id} type={shown ? "text" : "password"} className={`${INPUT} pr-24`} {...input} />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="absolute inset-y-1 right-1 min-w-20 rounded-lg px-3 text-base font-semibold text-brand active:bg-brand-soft"
        >
          {shown ? t("Ocultar", "Hide") : t("Mostrar", "Show")}
        </button>
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** A red line under a form. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-bad-soft px-4 py-3 font-medium text-bad" role="alert">
      {children}
    </p>
  );
}
