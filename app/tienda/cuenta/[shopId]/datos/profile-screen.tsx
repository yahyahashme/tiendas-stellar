"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { BackLink, Button, LoadError, Loading, NotFound, ReceiptView, Screen } from "@/components/ui";
import { getProfile, saveProfile } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { Profile, Receipt } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

const FIELDS: { key: keyof Profile; es: string; en: string; inputMode?: "tel" | "numeric"; autoComplete: string; hintEs?: string; hintEn?: string }[] = [
  { key: "owner", es: "Su nombre", en: "Your name", autoComplete: "name" },
  { key: "shopName", es: "Nombre de la tienda", en: "Shop name", autoComplete: "organization" },
  { key: "address", es: "Dirección", en: "Address", autoComplete: "street-address" },
  { key: "phone", es: "Teléfono (WhatsApp)", en: "Phone (WhatsApp)", inputMode: "tel", autoComplete: "tel" },
  { key: "dui", es: "DUI", en: "DUI (ID number)", inputMode: "numeric", autoComplete: "off", hintEs: "9 números, por ejemplo 04512345-6", hintEn: "9 digits, for example 04512345-6" },
];

/** Mi cuenta → Datos personales y de la tienda: an editable form (demo data until accounts, #129). */
export default function ProfileScreen() {
  const { shopId } = useParams<{ shopId: string }>();
  const { t } = useT();
  const { data, failed } = usePolling(`profile-${shopId}`, () => getProfile(shopId), 0);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const back = <BackLink href={`/tienda/cuenta/${shopId}`} label={t("Mi cuenta", "My account")} />;

  if (data === undefined) {
    return (
      <Screen>
        {back}
        {failed ? <LoadError /> : <Loading />}
      </Screen>
    );
  }
  if (data === null) {
    return (
      <Screen>
        {back}
        <NotFound>{t("No encontramos esa tienda.", "We couldn't find that shop.")}</NotFound>
      </Screen>
    );
  }

  const form = draft ?? data;
  async function save() {
    setBusy(true);
    setReceipt(null);
    setReceipt(await saveProfile(shopId, form));
    setBusy(false);
  }

  return (
    <Screen>
      {back}
      <h1 className="text-3xl font-bold text-balance">{t("Datos personales y de la tienda", "Personal and shop details")}</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-lg">
            <span className="font-medium">{t(f.es, f.en)}</span>
            {f.hintEs && <span className="text-base text-muted">{t(f.hintEs, f.hintEn ?? f.hintEs)}</span>}
            <input
              value={form[f.key]}
              inputMode={f.inputMode}
              autoComplete={f.autoComplete}
              onChange={(e) => {
                setDraft({ ...form, [f.key]: e.target.value });
                setReceipt(null);
              }}
              className="min-h-14 rounded-xl border-2 border-line bg-card px-4 text-lg focus:border-brand focus:outline-none"
            />
          </label>
        ))}
        <Button onClick={() => void save()} busy={busy}>
          {t("Guardar", "Save")}
        </Button>
      </form>
      {receipt && <ReceiptView receipt={receipt} />}
      <p className="text-muted text-pretty">
        {t(
          "Al abrir la cuenta, un socio autorizado revisa su DUI. Relay no comparte sus datos sin su permiso.",
          "When you open the account, a licensed partner checks your DUI. Relay doesn't share your details without your permission.",
        )}
      </p>
    </Screen>
  );
}
