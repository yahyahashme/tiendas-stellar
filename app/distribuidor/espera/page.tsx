"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyDistributor, type MyDistributor } from "@/app/distributor-actions";
import { BackLink, ButtonLink, Card, Loading, Screen } from "@/components/ui";
import { useT } from "@/lib/i18n";

const POLL_MS = 3000;

/** After a distributor signs up (#130): "we're checking your business", until it's approved. */
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
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (mine.status === "rechazado") {
    return (
      <Screen>
        <BackLink />
        <h1 className="text-3xl font-bold">{t("No pudimos aprobar su empresa", "We couldn't approve your business")}</h1>
        <p className="text-lg">{t("Escríbanos y le explicamos qué falta.", "Write to us and we'll explain what's missing.")}</p>
        <ButtonLink href="/cuenta" variant="secondary">
          {t("Mi cuenta", "My account")}
        </ButtonLink>
      </Screen>
    );
  }

  return (
    <Screen>
      <BackLink />
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-balance">{t("Estamos revisando su empresa", "We're reviewing your business")}</h1>
        <p className="text-lg text-muted">{mine.businessName}</p>
      </header>
      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t("Qué sigue", "What happens next")}</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-lg">
          <li>{t("Revisamos los datos de su empresa.", "We check your business details.")}</li>
          <li>{t("Al aprobarla, su cuenta puede crear facturas.", "Once approved, your account can create invoices.")}</li>
          <li>{t("Luego agrega sus motoristas y sus tiendas.", "Then you add your drivers and your shops.")}</li>
        </ol>
        <p className="text-muted">{t("En el producto real, un socio con licencia verifica la empresa antes de aprobarla.", "In the real product, a licensed partner checks the business before approving it.")}</p>
      </Card>
      <p className="animate-pulse text-center text-lg text-muted" role="status">
        {mine.autoApprove ? t("En esta demo se aprueba sola en unos segundos.", "In this demo it approves itself in a few seconds.") : t("Le avisamos aquí cuando esté aprobada.", "We'll let you know here once it's approved.")}
      </p>
    </Screen>
  );
}
