"use client";

import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { Button, DetailLink } from "./button";
import { MoneyText } from "./money";

// The four states every screen has besides its content. Success is not here: success is the
// receipt itself, with its stamp.

/** Loading: "Cargando..." on a blank ruled slip. Never a spinner on its own, never a blank screen. */
export function Loading({ lines = 4, torn = true }: { lines?: number; torn?: boolean }) {
  const { t } = useT();
  return (
    <div role="status" className={`flex flex-col bg-paper px-4 pb-5 pt-4 ${torn ? "torn" : "rounded-paper"}`}>
      <p className="font-mono text-base font-medium text-muted">{t("Cargando...", "Loading...")}</p>
      {Array.from({ length: lines }, (_, line) => (
        <span key={line} aria-hidden className="mt-7 block border-b border-paper-rule" />
      ))}
    </div>
  );
}

/** Empty: one plain sentence, then the next thing to do. */
export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-paper bg-paper px-4 py-5 text-lead text-balance">{children}</p>
      {action}
    </div>
  );
}

/** Error: what we couldn't do, in words, and a way to try again (`size="lg"`: the driver's 60 px button). */
export function Failure({ children, onRetry, busy = false, size = "md" }: { children?: ReactNode; onRetry?: () => void; busy?: boolean; size?: "md" | "lg" }) {
  const { t } = useT();
  return (
    <div role="alert" className="flex flex-col gap-3">
      <p className="rounded-paper bg-paper px-4 py-5 text-lead font-semibold text-bad text-balance">
        {children ?? t("No pudimos cargar esta pantalla. Revise su conexión.", "We couldn't load this screen. Check your connection.")}
      </p>
      {onRetry && (
        <Button onClick={onRetry} busy={busy} size={size}>
          {t("Reintentar", "Try again")}
        </Button>
      )}
    </div>
  );
}

/** A line of news after an action (saved, sent, failed) that isn't a payment. Words, in the status colour. */
export function Notice({ tone = "ok", children }: { tone?: "ok" | "bad"; children: ReactNode }) {
  return (
    <p role="status" className={`font-semibold ${tone === "ok" ? "text-ok" : "text-bad"}`}>
      {children}
    </p>
  );
}

/**
 * The answer to an action that isn't a payment on a slip (cash handed in, invoices imported): the server's
 * words, with "Ver detalles" when there is a public record. Give it a place of its own that is always there
 * (min-h-11, the height of "Ver detalles"), so the answer never moves the buttons around it.
 */
export function Answer({ receipt }: { receipt: { ok: boolean; message: string; explorerUrl?: string } }) {
  const { t, msg } = useT();
  return (
    <p role="status" className={`flex min-h-11 flex-wrap items-center gap-x-3 font-semibold ${receipt.ok ? "text-ok" : "text-bad"}`}>
      <span>
        <MoneyText>{msg(receipt.message)}</MoneyText>
      </span>
      {receipt.explorerUrl && (
        <DetailLink href={receipt.explorerUrl} external>
          {t("Ver detalles", "See details")}
        </DetailLink>
      )}
    </p>
  );
}
