"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { checkOwnerAction, saveTrustedContactsAction, signUpShopAction } from "@/app/shop-signup-actions";
import { getShopSuppliers } from "@/app/shop-actions";
import { FormError, PasswordField, TextField } from "@/components/form";
import { Button, ButtonLink, Card } from "@/components/ui";
import { getInvoices } from "@/lib/api";
import { formatDay, formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { leftToPay } from "@/lib/labels";
import type { Invoice } from "@/lib/types";

// The same list as lib/server/shops.ts SHOP_KINDS (the server checks it again).
const KINDS: [string, string][] = [
  ["Tienda", "Corner shop"],
  ["Mini súper", "Mini market"],
  ["Abarrotería", "Grocery"],
  ["Farmacia", "Pharmacy"],
  ["Otro", "Other"],
];

type Contact = { name: string; phone: string };

function Steps({ step }: { step: number }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-semibold text-muted">{t(`Paso ${step} de 4`, `Step ${step} of 4`)}</p>
      <div className="grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-1.5 rounded-full ${n <= step ? "bg-brand" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * A shop owner's sign-up (#134), one screen per step: 1 the owner, 2 the shop,
 * 3 security, 4 done. With `code` it claims a distributor's invite (#132) at the
 * end of step 2, so the shop keeps the invoices already made.
 */
export function ShopSignUp({
  code,
  distributorName,
  onStep,
}: {
  code?: string;
  distributorName?: string;
  /** The page hides its own intro once the owner is past it. */
  onStep?: (step: number) => void;
}) {
  const { t, msg } = useT();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [kind, setKind] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([{ name: "", phone: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ shopId: string; creditLimit: number } | null>(null);
  const [connected, setConnected] = useState<{ names: string[]; invoices: Invoice[] } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    onStep?.(step);
  }, [step, onStep]);

  // Step 4: who's connected already, and their invoices.
  useEffect(() => {
    if (step !== 4 || !done) return;
    let live = true;
    void Promise.all([getShopSuppliers(done.shopId), getInvoices()]).then(([suppliers, invoices]) => {
      if (!live) return;
      setConnected({
        names: suppliers?.suppliers.map((s) => s.name) ?? [],
        invoices: invoices.filter((i) => i.shopId === done.shopId && i.status !== "paid"),
      });
    });
    return () => {
      live = false;
    };
  }, [step, done]);

  async function owner(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const reply = await checkOwnerAction({ name, phone, password });
    setBusy(false);
    if (reply.ok) setStep(2);
    else setError(reply.message);
  }

  async function shop(event: FormEvent) {
    event.preventDefault();
    if (!kind) return setError("Elija qué tipo de tienda es.");
    setBusy(true);
    setError(null);
    const reply = await signUpShopAction({ name, phone, password, shopName, address, kind }, code);
    setBusy(false);
    if (!reply.ok) return setError(reply.message);
    setDone({ shopId: reply.shopId, creditLimit: reply.creditLimit });
    setStep(3);
  }

  async function security(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const reply = await saveTrustedContactsAction(contacts);
    setBusy(false);
    if (reply.ok) setStep(4);
    else setError(reply.message);
  }

  const setContact = (index: number, field: keyof Contact, value: string) =>
    setContacts((list) => list.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

  if (step === 1) {
    return (
      <form onSubmit={owner} className="flex flex-col gap-4">
        <Steps step={1} />
        <h2 className="text-2xl font-bold">{t("Sus datos", "About you")}</h2>
        <TextField label={t("Su nombre", "Your name")} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label={t("Teléfono", "Phone")}
          hint={t("Teléfono de El Salvador (8 dígitos). Con él entra a su cuenta.", "A Salvadoran phone number (8 digits). You sign in with it.")}
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <PasswordField
          label={t("Contraseña", "Password")}
          hint={t("Al menos 8 caracteres.", "At least 8 characters.")}
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <FormError>{msg(error)}</FormError>}
        <Button type="submit" busy={busy}>
          {t("Siguiente", "Next")}
        </Button>
      </form>
    );
  }

  if (step === 2) {
    return (
      <form onSubmit={shop} className="flex flex-col gap-4">
        <Steps step={2} />
        <h2 className="text-2xl font-bold">{t("Su tienda", "Your shop")}</h2>
        <TextField
          label={t("Nombre de su tienda", "Your shop's name")}
          hint={code ? t("El nombre que usted quiera. Su distribuidora puede seguir usando el suyo.", "Any name you like. Your distributor can keep using theirs.") : undefined}
          autoComplete="organization"
          required
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
        <TextField label={t("Dirección (opcional)", "Address (optional)")} autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-base font-semibold">{t("¿Qué tipo de tienda es?", "What kind of shop is it?")}</legend>
          <div className="flex flex-wrap gap-2">
            {KINDS.map(([es, en]) => (
              <button
                key={es}
                type="button"
                aria-pressed={kind === es}
                onClick={() => setKind(es)}
                className={`min-h-12 rounded-full border-2 px-4 text-base font-medium ${
                  kind === es ? "border-brand bg-brand text-white" : "border-line bg-card active:bg-brand-soft"
                }`}
              >
                {t(es, en)}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-muted">
          {t(
            "En el producto real, un socio con licencia revisa su DUI antes de mover dinero.",
            "In the real product, a licensed partner checks your ID before any money moves.",
          )}
        </p>
        {error && <FormError>{msg(error)}</FormError>}
        <Button type="submit" busy={busy}>
          {t("Crear mi cuenta", "Create my account")}
        </Button>
        {busy && (
          <p className="text-center text-muted">
            {t("Estamos creando su cuenta de dólares digitales. Toma unos segundos.", "We're creating your digital dollar account. It takes a few seconds.")}
          </p>
        )}
        <button type="button" onClick={() => setStep(1)} disabled={busy} className="min-h-12 text-base font-semibold text-brand underline">
          {t("Atrás", "Back")}
        </button>
      </form>
    );
  }

  if (step === 3) {
    return (
      <form onSubmit={security} className="flex flex-col gap-4">
        <Steps step={3} />
        <h2 className="text-2xl font-bold">{t("Seguridad", "Security")}</h2>
        <Card className="flex flex-col gap-2">
          <span className="self-start rounded-full bg-paper px-3 py-1 text-sm font-semibold text-muted">
            {t("Así funcionará · todavía no está activo", "How it will work · not active yet")}
          </span>
          <p className="text-lg font-semibold">{t("Usar huella", "Use your fingerprint")}</p>
          <p className="text-muted">
            {t(
              "Pronto entrará con la huella o la cara de su teléfono, sin contraseña. Por ahora, entre con su teléfono y contraseña.",
              "Soon you'll sign in with your phone's fingerprint or face, with no password. For now, sign in with your phone and password.",
            )}
          </p>
        </Card>
        <section className="flex flex-col gap-3">
          <h3 className="text-xl font-semibold">{t("Contactos de confianza (opcional)", "Trusted contacts (optional)")}</h3>
          <p className="text-muted">
            {t(
              "Hasta 3 personas que le ayudan a recuperar su cuenta si pierde el teléfono. Puede agregarlas ahora o después.",
              "Up to 3 people who help you get your account back if you lose your phone. You can add them now or later.",
            )}
          </p>
          {contacts.map((c, i) => (
            <div key={i} className="grid gap-3 rounded-2xl border border-line bg-card p-3 sm:grid-cols-2">
              <TextField label={t(`Nombre ${i + 1}`, `Name ${i + 1}`)} autoComplete="off" value={c.name} onChange={(e) => setContact(i, "name", e.target.value)} />
              <TextField label={t("Teléfono", "Phone")} inputMode="tel" autoComplete="off" value={c.phone} onChange={(e) => setContact(i, "phone", e.target.value)} />
            </div>
          ))}
          {contacts.length < 3 && (
            <button
              type="button"
              onClick={() => setContacts((list) => [...list, { name: "", phone: "" }])}
              className="min-h-12 self-start rounded-xl border-2 border-brand px-4 text-base font-semibold text-brand active:bg-brand-soft"
            >
              {t("Agregar otro contacto", "Add another contact")}
            </button>
          )}
        </section>
        {error && <FormError>{msg(error)}</FormError>}
        <Button type="submit" busy={busy}>
          {t("Guardar y seguir", "Save and continue")}
        </Button>
        <button type="button" onClick={() => setStep(4)} disabled={busy} className="min-h-12 text-base font-semibold text-brand underline">
          {t("Más tarde", "Later")}
        </button>
      </form>
    );
  }

  // Step 4: done.
  const from = distributorName || connected?.names[0];
  return (
    <div className="flex flex-col gap-4">
      <Steps step={4} />
      <h2 className="text-2xl font-bold">{t("Su cuenta está lista", "Your account is ready")}</h2>
      {done && done.creditLimit > 0 && (
        <Card className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">{t("Límite de crédito", "Credit limit")}</p>
          <p className="text-4xl font-bold tabular-nums">{formatMoney(done.creditLimit)}</p>
          <p className="text-muted">{t("Ya puede usar «Pagar en 7 días», sin intereses.", "You can use “Pay in 7 days” now, with no interest.")}</p>
        </Card>
      )}
      {code && from && (
        <Card className="flex flex-col gap-3">
          <p className="text-lg font-semibold">{t(`${from} ya está conectada`, `${from} is already connected`)}</p>
          {connected === null ? (
            <p className="text-muted">{t("Cargando...", "Loading...")}</p>
          ) : connected.invoices.length === 0 ? (
            <p className="text-muted">{t("No tiene facturas por pagar.", "You have no invoices to pay.")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
              {connected.invoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link href={`/tienda/${invoice.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 active:bg-brand-soft">
                    <span className="flex flex-col">
                      <span className="text-lg">{t(`Factura ${invoice.id}`, `Invoice ${invoice.id}`)}</span>
                      <span className="text-sm text-muted">{t(`Vence el ${formatDay(invoice.dueDate)}`, `Due ${formatDay(invoice.dueDate, "en")}`)}</span>
                    </span>
                    <span className="text-lg font-semibold tabular-nums">{formatMoney(leftToPay(invoice))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {done && <ButtonLink href={`/tienda/cuenta/${done.shopId}`}>{t("Ir a Mi cuenta", "Go to My account")}</ButtonLink>}
    </div>
  );
}
