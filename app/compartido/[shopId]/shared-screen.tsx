"use client";

import { useParams, useSearchParams } from "next/navigation";
import { CreditScoreCard } from "@/components/credit-score-card";
import { LoadError, Loading, NotFound, Screen } from "@/components/ui";
import { getShop, getShopHistory, getSuppliers } from "@/lib/api";
import { creditScore } from "@/lib/credit";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { usePolling } from "@/lib/use-polling";

/** What a lender or new supplier sees from a shop's "Compartir mi historial" link (#137). */
export default function SharedScreen() {
  const { shopId } = useParams<{ shopId: string }>();
  const until = useSearchParams().get("hasta") ?? "";
  const { lang, t } = useT();
  const { data, failed } = usePolling(
    `shared-${shopId}`,
    async () => {
      const [shop, history, suppliers] = await Promise.all([getShop(shopId), getShopHistory(shopId), getSuppliers(shopId)]);
      return { shop, history, suppliers, now: Date.now() };
    },
    0,
  );

  if (!data) return <Screen>{failed ? <LoadError /> : <Loading />}</Screen>;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(until) && Date.parse(`${until}T23:59:59Z`) >= data.now;
  const { shop, history, suppliers } = data;
  if (!valid || !shop || !history) {
    return (
      <Screen>
        <NotFound>
          {t("Este enlace ya no es válido. Pídale a la tienda uno nuevo.", "This link is no longer valid. Ask the shop for a new one.")}
        </NotFound>
      </Screen>
    );
  }

  const payments = history.rows.filter((r) => r.kind === "payment");
  const score = creditScore(shop, history.rows, suppliers.length, data.now);
  return (
    <Screen>
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">{t("Historial compartido", "Shared history")}</p>
        <h1 className="text-3xl font-bold text-balance">{shop.name}</h1>
        <p className="text-muted">
          {t("La tienda lo compartió con usted. Puntaje propio de Relay, no de un buró de crédito.", "The shop shared it with you. Relay's own score, not a credit bureau's.")}
        </p>
      </header>
      <CreditScoreCard score={score} />
      <dl className="flex flex-col gap-1 rounded-2xl border border-line bg-card px-4 py-3 text-lg">
        {[
          [t("Límite de crédito en Relay", "Credit limit on Relay"), formatMoney(shop.creditLimit)],
          [t("Crédito que debe ahora", "Credit owed now"), formatMoney(shop.creditOwed)],
          [t("Créditos pagados a tiempo", "Credit paid on time"), `${shop.onTime} / ${shop.onTime + shop.late}`],
          [t("Pagos registrados", "Payments on record"), String(payments.length)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted text-pretty">
        {lang === "en"
          ? "Relay is not a credit bureau. This record comes from the shop's payments to its suppliers on Relay. In the real product it is shared through a licensed partner, only with the shop's consent."
          : "Relay no es un buró de crédito. Este historial viene de los pagos de la tienda a sus proveedores en Relay. En el producto real se comparte a través de un socio autorizado, solo con el permiso de la tienda."}
      </p>
    </Screen>
  );
}
