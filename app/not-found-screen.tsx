"use client";

import { ActionLink } from "@/components/kit/button";
import { Slip } from "@/components/kit/layout";
import { Empty } from "@/components/kit/states";
import { useT } from "@/lib/i18n";

/** A slip, one sentence, one way out. */
export default function NotFoundScreen() {
  const { t } = useT();
  return (
    <Slip className="pt-6">
      <h1 className="text-title font-bold">{t("Página no encontrada", "Page not found")}</h1>
      <Empty action={<ActionLink href="/" title={t("Volver al inicio", "Back to the start")} />}>
        {t("Esta dirección no existe en Relay. Revise el enlace que le enviaron.", "This address doesn't exist on Relay. Check the link you were sent.")}
      </Empty>
    </Slip>
  );
}
