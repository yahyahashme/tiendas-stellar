"use client";

import { useState } from "react";
import { Button, TextButton } from "@/components/kit/button";
import { MoneyField } from "@/components/kit/field";
import { Paper } from "@/components/kit/paper";
import { Answer } from "@/components/kit/states";
import { depositRecourse, getRecourse, getShop, vouchShop, withdrawRecourse } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { HIGHLY_TRUSTED_CYCLES, parseAmount, recourseRequired, shopCreditFeeBps, TRUSTED_CYCLES, trustLevel } from "@/lib/labels";
import type { Receipt } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

const percent = (bps: number) => `${(bps / 100).toFixed(2)}%`;

/**
 * What a credit sale to this shop costs the distributor (#185), and the two ways it gets cheaper:
 * the shop's own record (4 and 8 good cycles in a row), or the distributor vouching for it with a
 * deposit that covers late payers (0.25%). Shown on the distributor's view of one shop.
 */
export function ShopCreditTier({ shopId }: { shopId: string }) {
  const { t } = useT();
  const { data, reload } = usePolling(`tier-${shopId}`, async () => {
    const [shop, recourse] = await Promise.all([getShop(shopId), getRecourse()]);
    return { shop, recourse };
  });
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<Receipt | null>(null);
  const [amount, setAmount] = useState("");

  if (!data?.shop) return null;
  const { shop, recourse } = data;
  const good = shop.goodCycles ?? 0;
  const mine = shop.voucherId !== undefined && shop.voucherId === recourse.distributorId;
  const other = shop.voucherId !== undefined && !mine;
  const fullBps = shopCreditFeeBps(1, 1, good);
  const level = trustLevel(good);
  // The next $100 sale on credit still gets 0.25% only if the deposit covers 20% of it too.
  const room = Math.max(0, Math.floor((recourse.deposit / 0.2 - recourse.vouchedOut) * 100) / 100);
  const parsed = parseAmount(amount);

  async function act(action: () => Promise<Receipt>) {
    setBusy(true);
    setAnswer(null);
    const result = await action();
    if (result.ok) {
      setAmount("");
      await reload();
    }
    setAnswer(result);
    setBusy(false);
  }

  const fee = mine
    ? t(`Usted la respalda: paga ${percent(25)} por cada venta a crédito mientras su depósito la cubra.`, `You back it: you pay ${percent(25)} on each credit sale while your deposit covers it.`)
    : level === 0
      ? t(`Paga hasta ${percent(fullBps)} por cada venta a crédito.`, `You pay up to ${percent(fullBps)} on each credit sale.`)
      : t(`Tienda confiable: paga hasta ${percent(fullBps)} en lugar de 1.50%.`, `Trusted shop: you pay up to ${percent(fullBps)} instead of 1.50%.`);
  const next = level === 0 ? TRUSTED_CYCLES : HIGHLY_TRUSTED_CYCLES;
  const cycles =
    level === 2
      ? t(`${good} ciclos pagados a tiempo seguidos. Tiene la comisión más baja.`, `${good} cycles paid on time in a row. It has the lowest fee.`)
      : t(
          `${good} de ${next} ciclos pagados a tiempo seguidos para bajar a ${level === 0 ? "1.25%" : "1.00%"}. Un atraso vuelve a cero.`,
          `${good} of ${next} cycles paid on time in a row to drop to ${level === 0 ? "1.25%" : "1.00%"}. Paying late starts it over.`,
        );

  // Paper holds the facts; the buttons sit on the counter below it.
  return (
    <section className="flex flex-col gap-3" aria-label={t("Comisión de crédito para esta tienda", "Credit fee for this shop")}>
      <Paper className="flex flex-col gap-2 p-4">
        <h2 className="text-lead font-bold">{t("Comisión de crédito para esta tienda", "Credit fee for this shop")}</h2>
        <p className="text-pretty">{fee}</p>
        <p className="text-label text-muted text-pretty">{cycles}</p>
        <div className="mt-1 flex flex-col gap-1 border-t border-paper-rule pt-2">
          <h3 className="font-bold">{t("Su depósito de respaldo", "Your backing deposit")}</h3>
          <p className="text-pretty">
            {t(
              `${formatMoney(recourse.deposit)} en el fondo. Respalda ${formatMoney(recourse.vouchedOut)} de crédito ahora (mínimo ${formatMoney(recourse.required)}). Cabe ${formatMoney(room)} más.`,
              `${formatMoney(recourse.deposit)} in the pool. It backs ${formatMoney(recourse.vouchedOut)} of credit now (minimum ${formatMoney(recourse.required)}). Room for ${formatMoney(room)} more.`,
            )}
          </p>
          <p className="text-label text-muted text-pretty">
            {t(
              "El depósito debe ser al menos el 20% del crédito que respalda. Si no alcanza, la venta usa la comisión normal.",
              "The deposit must be at least 20% of the credit you back. If it falls short, the sale uses the normal fee.",
            )}
          </p>
        </div>
      </Paper>

      {other ? (
        <p className="text-label text-muted">{t("Otra distribuidora respalda esta tienda.", "Another distributor backs this shop.")}</p>
      ) : (
        <Button
          onClick={() => act(() => vouchShop(shopId, !mine))}
          busy={busy}
          disabled={shop.creditOwed > 0}
          hint={
            shop.creditOwed > 0
              ? t("Puede cambiarlo cuando la tienda no deba nada.", "You can change this when the shop owes nothing.")
              : mine
                ? t("Vuelve a la comisión normal.", "It goes back to the normal fee.")
                : t(
                    "Paga 0.25%. Si se atrasa más de 7 días, su depósito le paga al fondo y usted le cobra a la tienda.",
                    "You pay 0.25%. If it is more than 7 days late, your deposit pays the pool and you collect from the shop.",
                  )
          }
        >
          {mine ? t("Dejar de respaldar", "Stop backing") : t("Respaldar esta tienda", "Back this shop")}
        </Button>
      )}

      <MoneyField label={t("Monto del depósito", "Deposit amount")} value={amount} onChange={(event) => setAmount(event.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => parsed && act(() => depositRecourse(parsed))} busy={busy} disabled={!parsed} size="sm">
          {t("Agregar al depósito", "Add to deposit")}
        </Button>
        <TextButton onClick={() => parsed && act(() => withdrawRecourse(parsed))} disabled={busy || !parsed || parsed > recourse.deposit - recourseRequired(recourse.vouchedOut)}>
          {t("Retirar", "Take out")}
        </TextButton>
      </div>
      {answer && <Answer receipt={answer} />}
    </section>
  );
}
