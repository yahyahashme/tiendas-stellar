"use client";

import { type ReactNode, useEffect } from "react";

export type StampTone = "ok" | "warn" | "bad" | "credit" | "confirm" | "ink";

const TONE: Record<StampTone, string> = {
  ok: "stamp-ok",
  warn: "stamp-warn",
  bad: "stamp-bad",
  credit: "stamp-credit",
  confirm: "stamp-confirm",
  ink: "",
};

/**
 * Status is a rubber stamp, never a pill: PAGADA, CONFIRMADO, EN CRÉDITO, VENCE PRONTO, VENCIDA.
 * Always words plus colour. The large form is tilted and worn; `small` is the upright mark for dense tables.
 *
 * `fresh` plays the landing once (and a short buzz where the phone allows it): the product's one moment
 * of delight, for a payment that just completed. `onLanded` lets the screen make sure it never replays.
 *
 * `fit` is for a long word on a narrow slip ("NO APROBADA" on a folded phone with large text): give it
 * the number of letters and the large stamp shrinks to its paper instead of running off the screen.
 */
export function Stamp({
  children,
  tone = "ink",
  small = false,
  fresh = false,
  onLanded,
  tilt,
  fit,
  className = "",
}: {
  children: ReactNode;
  tone?: StampTone;
  small?: boolean;
  fresh?: boolean;
  onLanded?: () => void;
  /** Degrees, between -6 and -4. */
  tilt?: number;
  /** How many letters the word has, so the large stamp never gets wider than the paper it is on. */
  fit?: number;
  className?: string;
}) {
  useEffect(() => {
    if (!fresh || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      navigator.vibrate?.(30);
    } catch {
      // no vibration on this phone
    }
  }, [fresh]);
  // A wide letter with its spacing takes 0.78em; the frame, its padding and the tilt add 2.2em.
  const size = fit === undefined || small ? undefined : `min(1.375rem, calc(100cqi / ${(fit * 0.78 + 2.2).toFixed(1)}))`;
  return (
    <span
      onAnimationEnd={onLanded}
      style={{ ...(tilt === undefined ? null : { "--stamp-tilt": `${tilt}deg` }), ...(size ? { fontSize: size } : null) } as React.CSSProperties}
      className={`stamp ${TONE[tone]} ${small ? "stamp-small text-label" : "text-[1.375rem]"} ${fresh ? "stamp-land" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
