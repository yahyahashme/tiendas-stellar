"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { checkOwnerAction, saveTrustedContactsAction, signUpShopAction } from "@/app/shop-signup-actions";
import { getShopSuppliers } from "@/app/shop-actions";
import { ActionLink, ActionList, ActionRow, ButtonLink, TextButton } from "@/components/kit/button";
import { Field, PasswordField } from "@/components/kit/field";
import { Choice, Choices, Form, FormHead, FormSubmit } from "@/components/kit/form";
import { Money } from "@/components/kit/money";
import { Paper, Receipt, ReceiptFoot, ReceiptHeader, ReceiptRule, ReceiptTotal } from "@/components/kit/paper";
import { Stamp } from "@/components/kit/stamp";
import { Loading } from "@/components/kit/states";
import { getInvoices } from "@/lib/api";
import { type Blank, blankOf } from "@/lib/form-errors";
import { formatDay } from "@/lib/format";
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

/** The step each blank is on. A message about a blank that isn't on screen goes above the button. */
const STEP_OF: Partial<Record<Blank, number>> = { name: 1, contact: 1, password: 1, shopName: 2, address: 2, kind: 2 };

type Contact = { name: string; phone: string };

/**
 * A shop owner's sign-up (#134), one screen per step: 1 the owner, 2 the shop,
 * 3 security, 4 done. With `code` it claims a distributor's invite (#132) at the
 * end of step 2, so the shop keeps the invoices already made.
 */
export function ShopSignUp({
  code,
  distributorName,
  onStep,
  intro,
}: {
  code?: string;
  distributorName?: string;
  /** The page hides its own intro once the owner is past it. */
  onStep?: (step: number) => void;
  /** One sentence under the first step's name. */
  intro?: ReactNode;
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

  // A message about one blank goes under that blank; anything else goes above the button.
  const blank = blankOf(error);
  const onScreen = blank !== undefined && STEP_OF[blank] === step;
  const under = (which: Blank) => (error && onScreen && blank === which ? msg(error) : undefined);
  const aboveButton = error && !onScreen ? msg(error) : undefined;
  const stepOf = t(`Crear cuenta · Paso ${step} de 4`, `Create account · Step ${step} of 4`);
  const creating = busy ? t("Estamos creando su cuenta de dólares digitales. Toma unos segundos.", "We're creating your digital dollar account. It takes a few seconds.") : undefined;

  if (step === 1) {
    return (
      <Form onSubmit={owner} error={error}>
        <FormHead step={stepOf} at={step} title={t("Sus datos", "About you")}>
          {intro}
        </FormHead>
        <Field label={t("Su nombre", "Your name")} autoComplete="name" autoCapitalize="words" required value={name} onChange={(e) => setName(e.target.value)} error={under("name")} />
        <Field
          label={t("Teléfono", "Phone")}
          hint={t("Teléfono de El Salvador (8 dígitos). Con él entra a su cuenta.", "A Salvadoran phone number (8 digits). You sign in with it.")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={under("contact")}
        />
        <PasswordField
          label={t("Contraseña", "Password")}
          hint={t("Al menos 8 caracteres.", "At least 8 characters.")}
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={under("password")}
        />
        <FormSubmit error={aboveButton} busy={busy}>
          {t("Siguiente", "Next")}
        </FormSubmit>
      </Form>
    );
  }

  if (step === 2) {
    return (
      <Form onSubmit={shop} error={error}>
        <FormHead step={stepOf} at={step} title={t("Su tienda", "Your shop")} />
        <Field
          label={t("Nombre de su tienda", "Your shop's name")}
          hint={code ? t("El nombre que usted quiera. Su distribuidora puede seguir usando el suyo.", "Any name you like. Your distributor can keep using theirs.") : undefined}
          autoComplete="organization"
          autoCapitalize="words"
          required
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          error={under("shopName")}
        />
        <Field label={t("Dirección (opcional)", "Address (optional)")} autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} error={under("address")} />
        <Choices label={t("¿Qué tipo de tienda es?", "What kind of shop is it?")} error={under("kind")}>
          {KINDS.map(([es, en]) => (
            <Choice key={es} chosen={kind === es} onClick={() => setKind(es)}>
              {t(es, en)}
            </Choice>
          ))}
        </Choices>
        <p className="text-muted text-pretty">
          {t(
            "En el producto real, un socio con licencia revisa su DUI antes de mover dinero.",
            "In the real product, a licensed partner checks your ID before any money moves.",
          )}
        </p>
        <FormSubmit error={aboveButton} note={creating} busy={busy}>
          {t("Crear mi cuenta", "Create my account")}
        </FormSubmit>
        <TextButton
          onClick={() => {
            setError(null); // a message about this step doesn't follow to the one before
            setStep(1);
          }}
          disabled={busy}
        >
          {t("Atrás", "Back")}
        </TextButton>
      </Form>
    );
  }

  if (step === 3) {
    return (
      <Form onSubmit={security} error={error}>
        <FormHead step={stepOf} at={step} title={t("Seguridad", "Security")} />
        <Paper className="flex flex-col gap-1.5 px-4 py-4">
          <p className="text-label font-semibold uppercase tracking-[0.1em] text-muted">{t("Así funcionará · todavía no está activo", "How it will work · not active yet")}</p>
          <p className="text-lead font-bold">{t("Usar huella", "Use your fingerprint")}</p>
          <p className="text-muted text-pretty">
            {t(
              "Pronto entrará con la huella o la cara de su teléfono, sin contraseña. Por ahora, entre con su teléfono y contraseña.",
              "Soon you'll sign in with your phone's fingerprint or face, with no password. For now, sign in with your phone and password.",
            )}
          </p>
        </Paper>
        <section className="flex flex-col gap-3 pt-1">
          <h2 className="text-lead font-bold">{t("Contactos de confianza (opcional)", "Trusted contacts (optional)")}</h2>
          <p className="text-muted text-pretty">
            {t(
              "Hasta 3 personas que le ayudan a recuperar su cuenta si pierde el teléfono. Puede agregarlas ahora o después.",
              "Up to 3 people who help you get your account back if you lose your phone. You can add them now or later.",
            )}
          </p>
          {contacts.map((c, i) => (
            <div key={i} className="grid items-end gap-3 min-[27rem]:grid-cols-2">
              <Field label={t(`Nombre ${i + 1}`, `Name ${i + 1}`)} autoComplete="off" autoCapitalize="words" value={c.name} onChange={(e) => setContact(i, "name", e.target.value)} />
              <Field label={t(`Teléfono ${i + 1}`, `Phone ${i + 1}`)} type="tel" inputMode="tel" autoComplete="off" value={c.phone} onChange={(e) => setContact(i, "phone", e.target.value)} />
            </div>
          ))}
          {contacts.length < 3 && <ActionRow title={t("Agregar otro contacto", "Add another contact")} onClick={() => setContacts((list) => [...list, { name: "", phone: "" }])} disabled={busy} />}
        </section>
        <FormSubmit error={aboveButton} busy={busy}>
          {t("Guardar y seguir", "Save and continue")}
        </FormSubmit>
        <TextButton onClick={() => setStep(4)} disabled={busy}>
          {t("Más tarde", "Later")}
        </TextButton>
      </Form>
    );
  }

  // Step 4: done. The account is a slip with its stamp; the way on is under it, where nothing that loads later can move it.
  const from = distributorName || connected?.names[0];
  const hasCredit = done !== null && done.creditLimit > 0;
  return (
    <div className="flex flex-col gap-4">
      <FormHead step={stepOf} at={step} title={t("Su cuenta está lista", "Your account is ready")} />
      <Receipt>
        <ReceiptHeader from={shopName} number={t("Cuenta de tienda", "Shop account")} />
        {hasCredit ? (
          <ReceiptTotal label={t("Límite de crédito", "Credit limit")} value={done.creditLimit}>
            <p className="pt-1.5 text-muted text-pretty">{t("Ya puede usar «Pagar en 7 días», sin intereses.", "You can use “Pay in 7 days” now, with no interest.")}</p>
          </ReceiptTotal>
        ) : (
          <ReceiptRule />
        )}
        <ReceiptFoot stamp={<Stamp tone="ok">{t("Lista", "Ready")}</Stamp>} />
      </Receipt>
      {done && <ButtonLink href={`/tienda/cuenta/${done.shopId}`}>{t("Ir a Mi cuenta", "Go to My account")}</ButtonLink>}
      {code && from && (
        <section className="flex flex-col gap-2 pt-1">
          <h2 className="text-lead font-bold text-balance">{t(`${from} ya está conectada`, `${from} is already connected`)}</h2>
          {connected === null ? (
            <Loading lines={1} torn={false} />
          ) : connected.invoices.length === 0 ? (
            <p className="text-muted">{t("No tiene facturas por pagar.", "You have no invoices to pay.")}</p>
          ) : (
            <ActionList>
              {connected.invoices.map((invoice) => (
                <ActionLink
                  key={invoice.id}
                  href={`/tienda/${invoice.id}`}
                  title={t(`Factura ${invoice.id}`, `Invoice ${invoice.id}`)}
                  hint={t(`Vence el ${formatDay(invoice.dueDate)}`, `Due ${formatDay(invoice.dueDate, "en")}`)}
                  figure={<Money value={leftToPay(invoice)} />}
                />
              ))}
            </ActionList>
          )}
        </section>
      )}
    </div>
  );
}
