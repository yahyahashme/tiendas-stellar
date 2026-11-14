"use client";

import { Chip } from "@/components/ui";
import { type CreditScore, SCORE_LABEL } from "@/lib/credit";
import { useT } from "@/lib/i18n";

/** How long a shared history link stays valid. */
export const SHARE_DAYS = 30;

/** The link a shop sends to a lender or a new supplier: read-only, and it expires. */
export function shareLink(shopId: string, now: number, origin: string): { url: string; until: string } {
  const until = new Date(now + SHARE_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { url: `${origin}/compartido/${shopId}?hasta=${until}`, until };
}

/** The Relay score with its label and the reasons behind it (#137). */
export function CreditScoreCard({ score, shareFrom }: { score: CreditScore; shareFrom?: { shopId: string; shopName: string; now: number } }) {
  const { lang, t } = useT();
  const label = SCORE_LABEL[score.label];
  const share = shareFrom && typeof window !== "undefined" ? shareLink(shareFrom.shopId, shareFrom.now, window.location.origin) : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight tabular-nums">{score.score}</span>
          <span className="text-muted">/ 100</span>
        </div>
        <Chip tone={label.tone}>{label[lang]}</Chip>
      </div>
      <p className="text-sm text-muted">
        {t("Puntaje propio de Relay, no de un buró de crédito.", "Relay's own score, not a credit bureau's.")}
      </p>
      {score.isNew && (
        <p className="text-muted">{t("Todavía es nuevo en Relay: el puntaje se afina con cada pago.", "Still new on Relay: the score sharpens with each payment.")}</p>
      )}
      <ul className="flex flex-col gap-1.5">
        {score.reasons.map((r) => (
          <li key={r.es} className="flex items-start gap-2 text-lg">
            <span aria-hidden className={`mt-0.5 font-bold ${r.good ? "text-ok" : "text-bad"}`}>
              {r.good ? "✓" : "!"}
            </span>
            <span>
              <span className="sr-only">{r.good ? t("Ayuda: ", "Helps: ") : t("Baja: ", "Lowers: ")}</span>
              {r[lang]}
            </span>
          </li>
        ))}
      </ul>
      {score.tips.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{t("Para subirlo", "To raise it")}</p>
          {score.tips.map((tip) => (
            <p key={tip.es} className="text-muted">
              {tip[lang]}
            </p>
          ))}
        </div>
      )}
      {share && shareFrom && (
        <div className="flex flex-col gap-1 border-t-2 border-dashed border-line pt-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              t(
                `Historial de pagos de ${shareFrom.shopName} en Relay: ${share.url}`,
                `${shareFrom.shopName}'s payment history on Relay: ${share.url}`,
              ),
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center rounded-xl border-2 border-brand px-4 text-lg font-semibold text-brand active:bg-brand-soft"
          >
            {t("Compartir mi historial", "Share my history")}
          </a>
          <p className="text-sm text-muted text-pretty">
            {t(
              "Quien tenga el enlace puede ver su puntaje, su límite y cuántos pagos hizo. Envíelo solo a quien usted elija. Relay no comparte su historial sin su permiso.",
              "Anyone with the link can see your score, your limit and how many payments you made. Send it only to people you choose. Relay never shares your history without your permission.",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
