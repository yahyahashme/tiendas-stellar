"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { signUpDistributorAction } from "@/app/distributor-actions";
import { TextButton } from "@/components/kit/button";
import { Field, PasswordField } from "@/components/kit/field";
import { Choice, Choices, Form, FormHead, FormSubmit } from "@/components/kit/form";
import { type Blank, blankOf } from "@/lib/form-errors";
import { useT } from "@/lib/i18n";
import { SELLS, sellLabel } from "@/lib/sells";

/** The step each blank is on. A message about a blank that isn't on screen goes above the button. */
const STEP_OF: Partial<Record<Blank, 1 | 2>> = { businessName: 1, nit: 1, address: 1, sells: 1, approx: 1, name: 2, contact: 2, password: 2 };

/**
 * Distributor sign-up (#130), one slip at every size: "Su empresa", then "Su cuenta".
 * `intro` is one sentence under the first step's name.
 */
export function DistributorForm({ intro }: { intro?: ReactNode }) {
  const { lang, t, msg } = useT();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState("");
  const [nit, setNit] = useState("");
  const [address, setAddress] = useState("");
  const [sells, setSells] = useState<string[]>([]);
  const [shopsApprox, setShopsApprox] = useState("");
  const [driversApprox, setDriversApprox] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Each step starts at its top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const toggle = (item: string) => setSells((list) => (list.includes(item) ? list.filter((s) => s !== item) : [...list, item]));

  /** Step 1's own checks, so the phone flow catches them before step 2. */
  function businessProblem(): string | null {
    if (businessName.trim().length < 2) return "Escriba el nombre de la empresa.";
    if (nit.replace(/\D/g, "").length !== 14) return "El NIT debe tener 14 dígitos.";
    if (address.trim().length < 5) return "Escriba la dirección de la empresa.";
    if (sells.length === 0) return "Elija qué vende.";
    return null;
  }

  function next() {
    const problem = businessProblem();
    setError(problem);
    if (!problem) setStep(2);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 1) return next(); // the keyboard's Enter on the first step is "Siguiente"
    const problem = businessProblem();
    if (problem) {
      setError(problem);
      setStep(1);
      return;
    }
    setBusy(true);
    setError(null);
    const reply = await signUpDistributorAction({
      name,
      contact,
      password,
      details: { businessName, nit, address, sells, shopsApprox, driversApprox },
    });
    if (reply.ok) {
      router.push("/distribuidor/espera");
      return;
    }
    setError(reply.message);
    setBusy(false);
  }

  // A message about one blank goes under that blank; anything else goes above the button.
  const blank = blankOf(error);
  const onScreen = blank !== undefined && STEP_OF[blank] === step;
  const under = (which: Blank) => (error && onScreen && blank === which ? msg(error) : undefined);
  const aboveButton = error && !onScreen ? msg(error) : undefined;

  return (
    // The first step runs its own checks, in its own words ("El NIT debe tener 14 dígitos.").
    <Form onSubmit={submit} noValidate={step === 1} error={error}>
      <FormHead step={t(`Crear cuenta · Paso ${step} de 2`, `Create account · Step ${step} of 2`)} at={step} title={step === 1 ? t("Su empresa", "Your business") : t("Su cuenta", "Your account")}>
        {step === 1 && intro}
      </FormHead>

      {step === 1 ? (
        <div key="empresa" className="contents">
          <Field
            label={t("Nombre de la empresa", "Business name")}
            autoComplete="organization"
            autoCapitalize="words"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            error={under("businessName")}
          />
          <Field
            label={t("NIT", "Tax ID (NIT)")}
            hint={t("14 dígitos, con o sin guiones.", "14 digits, with or without dashes.")}
            inputMode="numeric"
            autoComplete="off"
            required
            value={nit}
            onChange={(e) => setNit(e.target.value)}
            error={under("nit")}
          />
          <Field label={t("Dirección", "Address")} autoComplete="street-address" required value={address} onChange={(e) => setAddress(e.target.value)} error={under("address")} />
          <Choices label={t("¿Qué vende?", "What do you sell?")} error={under("sells")}>
            {SELLS.map((item) => (
              <Choice key={item} chosen={sells.includes(item)} onClick={() => toggle(item)}>
                {sellLabel(item, lang)}
              </Choice>
            ))}
          </Choices>
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 items-end gap-3">
              <Field label={t("Tiendas (aprox.)", "Shops (approx.)")} inputMode="numeric" autoComplete="off" value={shopsApprox} onChange={(e) => setShopsApprox(e.target.value)} />
              <Field label={t("Motoristas (aprox.)", "Drivers (approx.)")} inputMode="numeric" autoComplete="off" value={driversApprox} onChange={(e) => setDriversApprox(e.target.value)} />
            </div>
            {under("approx") && (
              <p role="alert" className="font-semibold text-bad">
                {under("approx")}
              </p>
            )}
          </div>
          <FormSubmit error={aboveButton}>{t("Siguiente", "Next")}</FormSubmit>
        </div>
      ) : (
        <div key="cuenta" className="contents">
          <Field
            label={t("Nombre de la persona de contacto", "Contact person's name")}
            autoComplete="name"
            autoCapitalize="words"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={under("name")}
          />
          <Field
            label={t("Teléfono o correo", "Phone or email")}
            hint={t("Teléfono de El Salvador (8 dígitos) o correo.", "A Salvadoran phone number (8 digits) or an email.")}
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
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
          <p className="text-muted text-pretty">
            {t("En el producto real, un socio con licencia verifica la empresa antes de aprobarla.", "In the real product, a licensed partner checks the business before approving it.")}
          </p>
          <FormSubmit
            error={aboveButton}
            note={busy ? t("Estamos creando su cuenta de dólares digitales. Toma unos segundos.", "We're creating your digital dollar account. It takes a few seconds.") : undefined}
            busy={busy}
          >
            {t("Crear cuenta", "Create account")}
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
        </div>
      )}
    </Form>
  );
}
