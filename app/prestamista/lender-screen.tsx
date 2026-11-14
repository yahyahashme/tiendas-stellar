"use client";

import { useEffect, useState } from "react";
import testnet from "@/config/testnet.json";
import { DetailLink } from "@/components/kit/button";
import { Slip, TopNav } from "@/components/kit/layout";
import { LedgerFigure, LedgerFigures } from "@/components/kit/ledger";
import { Failure, Loading } from "@/components/kit/states";
import { getLender, getPool } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { LenderView, Pool } from "@/lib/types";

type Data = { pool: Pool; lender: LenderView };

const HEADING = "text-lead leading-tight font-bold";
const contractUrl = `${testnet.explorer}/contract/${testnet.contracts.routeLedger}`;

/**
 * Lenders: licensed institutions Relay approves, anywhere, as long as they hold digital dollars on Stellar.
 * They put money in the pool, earn 0.50% of every credit sale and take out what isn't lent. Read only:
 * a lender signs its own deposits and withdrawals, so Relay never moves a lender's money.
 */
export default function LenderScreen() {
  const { t } = useT();
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function load() {
    const [pool, lender] = await Promise.all([getPool(), getLender()]);
    setData({ pool, lender });
  }
  useEffect(() => {
    let live = true;
    Promise.all([getPool(), getLender()]).then(
      ([pool, lender]) => live && setData({ pool, lender }),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);
  async function retry() {
    setRetrying(true);
    try {
      await load();
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setRetrying(false);
  }

  const earned = data ? Math.round((data.lender.value - data.lender.netDeposited) * 100) / 100 : 0;

  return (
    <Slip wide>
      <TopNav back="/" backLabel={t("Inicio", "Home")} />
      <h1 className="text-title font-bold">{t("Fondo de crédito", "Credit pool")}</h1>
      <p className="max-w-[40rem] text-pretty">
        {t(
          "Prestamistas con licencia ponen dólares digitales en este fondo. El fondo le paga a la distribuidora cuando entrega, y la tienda le devuelve el dinero en 7 días, sin intereses.",
          "Licensed lenders put digital dollars in this pool. The pool pays the distributor at delivery, and the shop pays it back in 7 days, with no interest.",
        )}
      </p>

      {failed ? (
        <Failure onRetry={() => void retry()} busy={retrying} />
      ) : !data ? (
        <Loading lines={5} torn={false} />
      ) : (
        <>
          <LedgerFigures>
            <LedgerFigure label={t("Disponible", "Available")} value={data.pool.available} />
            <LedgerFigure label={t("Prestado a tiendas", "Lent to shops")} value={data.pool.lent} />
            <LedgerFigure label={t("Fondo de respaldo", "Backup fund")} value={data.pool.buffer} />
            <LedgerFigure label={t("Total de los prestamistas", "Lenders' total")} value={Math.round((data.pool.available + data.pool.lent) * 100) / 100} />
          </LedgerFigures>

          <section className="flex flex-col gap-2">
            <h2 className={HEADING}>{t("El prestamista de la demo", "The demo lender")}</h2>
            <LedgerFigures>
              <LedgerFigure label={t("Puso", "Put in")} value={data.lender.netDeposited} />
              <LedgerFigure label={t("Vale hoy", "Worth today")} value={data.lender.value} />
              <LedgerFigure label={t("Ganó", "Earned")} value={earned} />
              <LedgerFigure label={t("Puede retirar hoy", "Can take out today")} value={Math.min(data.lender.value, data.pool.available)} />
            </LedgerFigures>
          </section>
        </>
      )}

      <section className="flex max-w-[40rem] flex-col gap-2">
        <h2 className={HEADING}>{t("Cómo funciona", "How it works")}</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-pretty">
          <li>{t("Solo los prestamistas que Relay aprueba pueden poner dinero. Pueden estar en cualquier país.", "Only lenders Relay approves can put money in. They can be in any country.")}</li>
          <li>{t("Ganan 0.50% de cada venta a crédito. La distribuidora paga esa comisión, la tienda nunca.", "They earn 0.50% of every credit sale. The distributor pays that fee, never the shop.")}</li>
          <li>{t("Pueden retirar lo que no está prestado. Lo prestado vuelve cuando las tiendas pagan.", "They can take out what isn't lent. Lent money comes back as shops pay.")}</li>
          <li>{t("Si una tienda no paga, el fondo de respaldo cubre primero. Lo que no cubre, lo comparten todos los prestamistas.", "If a shop doesn't pay, the backup fund covers it first. What it can't cover, all lenders share.")}</li>
          <li>{t("Cada prestamista pone y retira desde su propia cuenta. Relay no puede mover su dinero.", "Each lender puts money in and takes it out from its own account. Relay can't move its money.")}</li>
        </ul>
        <DetailLink href={contractUrl} external>
          {t("Ver detalles", "See details")}
        </DetailLink>
      </section>
    </Slip>
  );
}
