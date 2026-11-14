"use client";

import { useParams, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { ScoreFacts } from "@/components/credit-score-card";
import { ActionLink } from "@/components/kit/button";
import { Split } from "@/components/kit/layout";
import { Money } from "@/components/kit/money";
import { Receipt, ReceiptHeader, ReceiptLine, ReceiptLines, ReceiptRule } from "@/components/kit/paper";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { Logo } from "@/components/logo";
import { getShop, getShopHistory, getSuppliers } from "@/lib/api";
import { creditScore } from "@/lib/credit";
import { formatDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { usePolling } from "@/lib/use-polling";

/** The page before the record arrives, and when the link is no good. No way back: whoever opens it is not a Relay user. */
export function SharedFrame({ children, aside = null }: { children: ReactNode; aside?: ReactNode }) {
  return <Split className="pt-3" facts={children} actions={aside} />;
}

/**
 * What a lender or new supplier sees from a shop's "Compartir mi historial" link (#137): one printed record,
 * with Relay's name on it, who it is about, until when it is valid, and what it does and doesn't prove.
 */
export default function SharedScreen() {
  const { shopId } = useParams<{ shopId: string }>();
  const until = useSearchParams().get("hasta") ?? "";
  const { t } = useT();
  const { data, failed, reload } = usePolling(
    `shared-${shopId}`,
    async () => {
      const [shop, history, suppliers] = await Promise.all([getShop(shopId), getShopHistory(shopId), getSuppliers(shopId)]);
      return { shop, history, suppliers, now: Date.now() };
    },
    0,
  );
  const about = <ActionLink href="/" title={t("Qué es Relay", "What Relay is")} hint={t("Pagos y crédito entre tiendas y distribuidoras", "Payments and credit between shops and distributors")} />;

  if (!data) return <SharedFrame>{failed ? <Failure onRetry={reload} /> : <Loading lines={6} />}</SharedFrame>;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(until) && Date.parse(`${until}T23:59:59Z`) >= data.now;
  const { shop, history, suppliers } = data;
  if (!valid || !shop || !history) {
    return (
      <SharedFrame>
        <Empty action={about}>{t("Este enlace ya no es válido. Pídale a la tienda uno nuevo.", "This link is no longer valid. Ask the shop for a new one.")}</Empty>
      </SharedFrame>
    );
  }

  const payments = history.rows.filter((r) => r.kind === "payment");
  const score = creditScore(shop, history.rows, suppliers.length, data.now);
  // A record a stranger reads carries its year: "14 nov 2026" ("Nov 14, 2026").
  const fullDay = (iso: string) => {
    const year = new Date(Date.parse(iso) - 6 * 60 * 60 * 1000).getUTCFullYear(); // El Salvador time, like formatDay
    return t(`${formatDay(iso)} ${year}`, `${formatDay(iso, "en")}, ${year}`);
  };
  const today = fullDay(new Date(data.now).toISOString());
  const lastDay = fullDay(`${until}T18:00:00Z`);

  return (
    <SharedFrame
      aside={
        <>
          <h2 className="text-label font-bold uppercase tracking-[0.12em]">{t("Sobre este historial", "About this record")}</h2>
          <p className="text-pretty">{t(`${shop.name} lo compartió con usted. Nadie más lo recibe sin su permiso.`, `${shop.name} shared it with you. No one else gets it without the shop's permission.`)}</p>
          <p className="text-muted text-pretty">
            {t(
              "Relay no es un buró de crédito. Este historial viene de los pagos de la tienda a sus proveedores en Relay. En el producto real se comparte a través de un socio autorizado, solo con el permiso de la tienda.",
              "Relay is not a credit bureau. This record comes from the shop's payments to its suppliers on Relay. In the real product it is shared through a licensed partner, only with the shop's consent.",
            )}
          </p>
          {about}
        </>
      }
    >
      <Receipt>
        <div className="flex justify-center pt-1">
          <Logo className="h-7 w-auto" />
        </div>
        <ReceiptHeader as="h1" from={shop.name} number={t("Historial compartido", "Shared history")} />
        <ReceiptLines>
          <ReceiptLine label={t("Datos al", "As of")}>{today}</ReceiptLine>
          <ReceiptLine label={t("Válido hasta", "Valid until")}>{lastDay}</ReceiptLine>
        </ReceiptLines>
        <ReceiptRule />
        <h2 className="text-label font-bold uppercase tracking-[0.12em]">{t("Puntaje Relay", "Relay score")}</h2>
        <ScoreFacts score={score} tips={false} />
        <ReceiptRule />
        <ReceiptLines>
          <ReceiptLine label={t("Límite en Relay", "Limit on Relay")}>
            <Money value={shop.creditLimit} />
          </ReceiptLine>
          <ReceiptLine label={t("Debe ahora", "Owed now")}>
            <Money value={shop.creditOwed} />
          </ReceiptLine>
          <ReceiptLine label={t("Créditos a tiempo", "Credit on time")}>
            {shop.onTime} {t("de", "of")} {shop.onTime + shop.late}
          </ReceiptLine>
          <ReceiptLine label={t("Pagos registrados", "Payments on record")}>{payments.length}</ReceiptLine>
        </ReceiptLines>
        <ReceiptRule double />
        <p className="text-center font-mono text-label font-medium uppercase tracking-[0.04em] text-muted">{t("Solo lectura · fin del historial", "Read only · end of record")}</p>
      </Receipt>
    </SharedFrame>
  );
}
