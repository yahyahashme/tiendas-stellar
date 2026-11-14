"use client";

import { useParams } from "next/navigation";
import { BackLink, NotFound, Screen } from "@/components/ui";
import { HELP, isHelpTopic } from "@/lib/account-help";
import { useT } from "@/lib/i18n";

/** One of Mi cuenta's explainers: how an option will work, clearly marked as not built yet. */
export default function HelpScreen() {
  const { shopId, topic } = useParams<{ shopId: string; topic: string }>();
  const { lang, t } = useT();
  const back = <BackLink href={`/tienda/cuenta/${shopId}`} label={t("Mi cuenta", "My account")} />;

  if (!isHelpTopic(topic)) {
    return (
      <Screen>
        {back}
        <NotFound>{t("No encontramos esa página.", "We couldn't find that page.")}</NotFound>
      </Screen>
    );
  }

  const help = HELP[topic][lang];
  return (
    <Screen>
      {back}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-balance">{help.title}</h1>
        <p className="self-start rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
          {t("Así funcionará · todavía no está activo", "How it will work · not live yet")}
        </p>
      </header>
      <p className="text-lg text-pretty">{help.intro}</p>
      <ol className="flex flex-col gap-3">
        {help.points.map((point, i) => (
          <li key={i} className="flex gap-3 text-lg text-pretty">
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {i + 1}
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ol>
      <p className="text-muted text-pretty">
        {t(
          "Un socio autorizado revisa la identidad de cada tienda y mueve el efectivo. Relay no lo hace por su cuenta.",
          "A licensed partner checks each shop's identity and handles the cash. Relay doesn't do that on its own.",
        )}
      </p>
    </Screen>
  );
}
