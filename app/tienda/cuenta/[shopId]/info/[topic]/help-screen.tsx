"use client";

import { useParams } from "next/navigation";
import { ActionLink } from "@/components/kit/button";
import { Receipt, ReceiptHeader, ReceiptRule } from "@/components/kit/paper";
import { Stamp } from "@/components/kit/stamp";
import { Empty } from "@/components/kit/states";
import { HELP, isHelpTopic } from "@/lib/account-help";
import { useT } from "@/lib/i18n";
import { AccountPage } from "../../account-page";

/** One of Mi cuenta's explainers: how an option will work, clearly marked as not built yet. A printed leaflet: paper, nothing to tap on it. */
export default function HelpScreen() {
  const { shopId, topic } = useParams<{ shopId: string; topic: string }>();
  const { lang, t } = useT();
  const back = <ActionLink href={`/tienda/cuenta/${shopId}`} title={t("Volver a Mi cuenta", "Back to My account")} />;

  if (!isHelpTopic(topic)) {
    return (
      <AccountPage shopId={shopId}>
        <Empty action={back}>{t("No encontramos esa página.", "We couldn't find that page.")}</Empty>
      </AccountPage>
    );
  }

  const help = HELP[topic][lang];
  return (
    <AccountPage shopId={shopId}>
      <Receipt>
        {/* The stamp comes first, under the title: nobody should read the steps thinking they can do them today. */}
        <ReceiptHeader as="h1" from={help.title} number={t("Así funcionará", "How it will work")}>
          <span className="pt-2 pb-1">
            <Stamp tone="warn">{t("Aún no activo", "Not live yet")}</Stamp>
          </span>
        </ReceiptHeader>
        <ReceiptRule />
        <p className="text-lead text-pretty">{help.intro}</p>
        <ol className="flex flex-col border-t border-paper-rule">
          {help.points.map((point, i) => (
            <li key={i} className="flex gap-3 border-b border-paper-rule py-2.5 text-pretty">
              <span aria-hidden className="w-5 shrink-0 font-mono font-semibold">
                {i + 1}.
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ol>
        <p className="text-label text-muted text-pretty">
          {t(
            "Un socio autorizado revisa la identidad de cada tienda y mueve el efectivo. Relay no lo hace por su cuenta.",
            "A licensed partner checks each shop's identity and handles the cash. Relay doesn't do that on its own.",
          )}
        </p>
      </Receipt>
      {back}
    </AccountPage>
  );
}
