"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ActionLink, Button } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Answer, Empty, Failure, Loading } from "@/components/kit/states";
import { getProfile, saveProfile } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { Profile, Receipt } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";
import { AccountPage } from "../account-page";

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
  const { data, failed, reload } = usePolling(`profile-${shopId}`, () => getProfile(shopId), 0);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  if (data === undefined) return <AccountPage shopId={shopId}>{failed ? <Failure onRetry={reload} /> : <Loading torn={false} lines={5} />}</AccountPage>;
  if (data === null) {
    return (
      <AccountPage shopId={shopId}>
        <Empty action={<ActionLink href="/" title={t("Volver al inicio", "Back to the start")} />}>{t("No encontramos esa tienda.", "We couldn't find that shop.")}</Empty>
      </AccountPage>
    );
  }

  const form = draft ?? data;
  async function save() {
    if (busy) return;
    setBusy(true);
    setReceipt(null);
    setReceipt(await saveProfile(shopId, form));
    setBusy(false);
  }

  return (
    <AccountPage shopId={shopId}>
      <h1 className="text-title font-bold text-balance">{t("Datos personales y de la tienda", "Personal and shop details")}</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {FIELDS.map((f) => (
          <Field
            key={f.key}
            label={t(f.es, f.en)}
            hint={f.hintEs ? t(f.hintEs, f.hintEn ?? f.hintEs) : undefined}
            value={form[f.key]}
            inputMode={f.inputMode}
            autoComplete={f.autoComplete}
            onChange={(e) => {
              setDraft({ ...form, [f.key]: e.target.value });
              setReceipt(null);
            }}
          />
        ))}
        {/* The answer has its own line above the button, always there: "Datos guardados." never moves the button. */}
        <div className="flex flex-col gap-1">
          <div className="min-h-11">{receipt && <Answer receipt={receipt} />}</div>
          <Button type="submit" busy={busy}>
            {t("Guardar", "Save")}
          </Button>
        </div>
      </form>
      <p className="text-label text-muted text-pretty">
        {t(
          "Al abrir la cuenta, un socio autorizado revisa su DUI. Relay no comparte sus datos sin su permiso.",
          "When you open the account, a licensed partner checks your DUI. Relay doesn't share your details without your permission.",
        )}
      </p>
    </AccountPage>
  );
}
