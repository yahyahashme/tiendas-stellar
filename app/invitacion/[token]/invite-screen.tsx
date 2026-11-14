"use client";

import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { acceptInviteAction, getInvite, type InvitePreview } from "@/app/driver-actions";
import { Brand, HomeNav, StatusSlip } from "@/components/auth";
import { ButtonLink } from "@/components/kit/button";
import { Field, PasswordField } from "@/components/kit/field";
import { Form, FormHead, FormSubmit } from "@/components/kit/form";
import { Slip } from "@/components/kit/layout";
import { Receipt, ReceiptHeader, ReceiptRule } from "@/components/kit/paper";
import { Loading } from "@/components/kit/states";
import { blankOf } from "@/lib/form-errors";
import { useT } from "@/lib/i18n";

/** A driver opens the distributor's invite link (#131): name prefilled, sets a password, lands on their route. */
export default function InviteScreen() {
  const { token } = useParams<{ token: string }>();
  const { t, msg } = useT();
  const router = useRouter();
  const [invite, setInvite] = useState<InvitePreview | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void getInvite(token).then((found) => {
      if (!live) return;
      setInvite(found);
      if (found) setName(found.name);
    });
    return () => {
      live = false;
    };
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const reply = await acceptInviteAction(token, name, password);
    if (reply.ok) {
      router.push(`/ruta/${reply.driverId}`);
      return;
    }
    setError(reply.message);
    setBusy(false);
  }

  if (invite === undefined) {
    return (
      <Slip>
        <Brand />
        <Loading />
      </Slip>
    );
  }

  if (invite === null) {
    return (
      <Slip>
        <HomeNav />
        <StatusSlip title={t("Esta invitación ya no es válida", "This invite is no longer valid")} stamp={t("No válida", "Not valid")} tone="bad">
          {t("Pida otra a su distribuidora, o entre si ya creó su cuenta.", "Ask your distributor for a new one, or sign in if you already created your account.")}
        </StatusSlip>
        <ButtonLink href="/entrar">{t("Entrar", "Sign in")}</ButtonLink>
      </Slip>
    );
  }

  // A message about one blank goes under that blank; anything else goes above the button.
  const blank = blankOf(error);
  const under = (which: "name" | "password") => (error && blank === which ? msg(error) : undefined);

  return (
    <Slip>
      <Brand />
      {/* The invite, printed like the distributor's own slips. */}
      <Receipt>
        <ReceiptHeader from={invite.distributorName} number={t("lo invita como motorista", "invites you as a driver")} />
        <ReceiptRule />
        <p className="text-pretty">{t(`Su usuario será su teléfono que termina en ${invite.phoneEnd}.`, `You'll sign in with your phone number ending in ${invite.phoneEnd}.`)}</p>
      </Receipt>
      <Form onSubmit={submit} error={error}>
        <FormHead title={t("Su cuenta", "Your account")}>{t("Cree su cuenta para ver su ruta y registrar el efectivo.", "Create your account to see your route and record cash.")}</FormHead>
        <Field label={t("Su nombre", "Your name")} autoComplete="name" autoCapitalize="words" required value={name} onChange={(e) => setName(e.target.value)} error={under("name")} />
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
        <FormSubmit
          error={error && blank !== "name" && blank !== "password" ? msg(error) : undefined}
          note={busy ? t("Estamos creando su cuenta de dólares digitales. Toma unos segundos.", "We're creating your digital dollar account. It takes a few seconds.") : undefined}
          busy={busy}
        >
          {t("Crear mi cuenta", "Create my account")}
        </FormSubmit>
      </Form>
    </Slip>
  );
}
