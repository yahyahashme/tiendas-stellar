"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyDistributor, type MyDistributor } from "@/app/distributor-actions";
import { HomeNav, StatusSlip } from "@/components/auth";
import { ActionLink } from "@/components/kit/button";
import { Slip } from "@/components/kit/layout";
import { Loading } from "@/components/kit/states";
import { useT } from "@/lib/i18n";

const POLL_MS = 3000;

/** After a distributor signs up (#130): a slip stamped "En revisión", until the business is approved. */
export default function Waiting() {
  const { t } = useT();
  const router = useRouter();
  const [mine, setMine] = useState<MyDistributor | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const found = await getMyDistributor().catch(() => undefined);
      if (!live) return;
      if (found === null) return router.replace("/entrar");
      if (found?.status === "aprobado") return router.replace("/distribuidor");
      if (found) setMine(found);
      timer = setTimeout(check, POLL_MS);
    };
    void check();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [router]);

  if (!mine) {
    return (
      <Slip>
        <HomeNav />
        <Loading />
      </Slip>
    );
  }

  const kind = t("Cuenta de distribuidora", "Distributor account");

  if (mine.status === "rechazado") {
    return (
      <Slip>
        <HomeNav />
        <StatusSlip from={mine.businessName} kind={kind} title={t("No pudimos aprobar su empresa", "We couldn't approve your business")} stamp={t("No aprobada", "Not approved")} tone="bad">
          {t("Escríbanos y le explicamos qué falta.", "Write to us and we'll explain what's missing.")}
        </StatusSlip>
        <ActionLink href="/cuenta" title={t("Mi cuenta", "My account")} />
      </Slip>
    );
  }

  return (
    <Slip>
      <HomeNav />
      <StatusSlip from={mine.businessName} kind={kind} title={t("Estamos revisando su empresa", "We're reviewing your business")} stamp={t("En revisión", "In review")}>
        {mine.autoApprove
          ? t(
              "En esta demo se aprueba sola en unos segundos; después podrá crear facturas y agregar a sus motoristas y sus tiendas.",
              "In this demo it approves itself in a few seconds; then you can create invoices and add your drivers and your shops.",
            )
          : t(
              "Le avisamos aquí cuando esté aprobada; después podrá crear facturas y agregar a sus motoristas y sus tiendas.",
              "We'll let you know here once it's approved; then you can create invoices and add your drivers and your shops.",
            )}
      </StatusSlip>
      <p className="text-muted text-pretty">
        {t("En el producto real, un socio con licencia verifica la empresa antes de aprobarla.", "In the real product, a licensed partner checks the business before approving it.")}
      </p>
    </Slip>
  );
}
