"use client";

import { ActionLink } from "@/components/kit/button";
import { Paper } from "@/components/kit/paper";
import { Stamp, type StampTone } from "@/components/kit/stamp";
import { type CreditScore, SCORE_LABEL, type ScoreLabel } from "@/lib/credit";
import { useT } from "@/lib/i18n";

/** How long a shared history link stays valid. */
export const SHARE_DAYS = 30;

/** The link a shop sends to a lender or a new supplier: read-only, and it expires. */
export function shareLink(shopId: string, now: number, origin: string): { url: string; until: string } {
  const until = new Date(now + SHARE_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { url: `${origin}/compartido/${shopId}?hasta=${until}`, until };
}

/** The stamp's ink. The word on it says which of the four it is; the colour only says good, careful or bad. */
const TONE: Record<ScoreLabel, StampTone> = { excelente: "ok", bueno: "ok", regular: "warn", riesgo: "bad" };

/**
 * The Relay score and why (#137): the number, its word as a stamp, and each reason in plain words with
 * "A favor" or "En contra" beside it. It has no paper of its own, so it can sit inside a slip (the shared
 * record) or on a sheet (Mi cuenta). `tips` are for the shop itself, not for whoever it shares the record with.
 */
export function ScoreFacts({ score, tips = true }: { score: CreditScore; tips?: boolean }) {
  const { lang, t } = useT();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4">
        <p className="flex items-baseline gap-2 font-mono">
          <span className="text-[2.75rem] leading-none font-semibold tracking-[-0.03em]">{score.score}</span>
          <span className="text-base font-medium text-muted">{t("de 100", "of 100")}</span>
        </p>
        <span className="pr-1">
          <Stamp tone={TONE[score.label]}>{SCORE_LABEL[score.label][lang]}</Stamp>
        </span>
      </div>
      <ul className="flex flex-col border-t border-paper-rule">
        {score.reasons.map((reason) => (
          <li key={reason.es} className="flex items-baseline justify-between gap-3 border-b border-paper-rule py-2">
            <span className="min-w-0 text-pretty">{reason[lang]}</span>
            <span className={`shrink-0 text-label font-bold uppercase tracking-[0.08em] ${reason.good ? "text-ok" : "text-bad"}`}>
              {reason.good ? t("A favor", "For") : t("En contra", "Against")}
            </span>
          </li>
        ))}
      </ul>
      {score.isNew && <p className="text-muted text-pretty">{t("Todavía es nuevo en Relay: el puntaje se afina con cada pago.", "Still new on Relay: the score sharpens with each payment.")}</p>}
      {tips && score.tips.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="font-bold">{t("Para subirlo", "To raise it")}</h3>
          {score.tips.map((tip) => (
            <p key={tip.es} className="text-muted text-pretty">
              {tip[lang]}
            </p>
          ))}
        </div>
      )}
      <p className="text-label text-muted text-pretty">{t("Puntaje propio de Relay, no de un buró de crédito.", "Relay's own score, not a credit bureau's.")}</p>
    </>
  );
}

/** The score on its own sheet, for Mi cuenta. With `shareFrom`, the blue row under it sends the shop's history link by WhatsApp. */
export function CreditScoreCard({ score, shareFrom }: { score: CreditScore; shareFrom?: { shopId: string; shopName: string; now: number } }) {
  const { t } = useT();
  const share = shareFrom && typeof window !== "undefined" ? shareLink(shareFrom.shopId, shareFrom.now, window.location.origin) : null;

  return (
    <div className="flex flex-col gap-2">
      <Paper as="div" className="flex flex-col gap-3 px-4 py-4">
        <ScoreFacts score={score} />
      </Paper>
      {share && shareFrom && (
        <>
          <ActionLink
            external
            href={`https://wa.me/?text=${encodeURIComponent(
              t(`Historial de pagos de ${shareFrom.shopName} en Relay: ${share.url}`, `${shareFrom.shopName}'s payment history on Relay: ${share.url}`),
            )}`}
            title={t("Compartir mi historial", "Share my history")}
            hint={t(`Por WhatsApp. El enlace vale ${SHARE_DAYS} días`, `On WhatsApp. The link lasts ${SHARE_DAYS} days`)}
          />
          <p className="text-label text-muted text-pretty">
            {t(
              "Quien tenga el enlace puede ver su puntaje, su límite y cuántos pagos hizo. Envíelo solo a quien usted elija. Relay no comparte su historial sin su permiso.",
              "Anyone with the link can see your score, your limit and how many payments you made. Send it only to people you choose. Relay never shares your history without your permission.",
            )}
          </p>
        </>
      )}
    </div>
  );
}
