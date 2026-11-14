"use client";

import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { acceptInviteAction, getInvite, type InvitePreview } from "@/app/driver-actions";
import { FormError, PasswordField, TextField } from "@/components/form";
import { BackLink, Button, ButtonLink, Card, Loading, Screen } from "@/components/ui";
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
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (invite === null) {
    return (
      <Screen>
        <BackLink />
        <h1 className="text-3xl font-bold">{t("Esta invitación ya no es válida", "This invite is no longer valid")}</h1>
        <p className="text-lg">{t("Pida otra a su distribuidora, o entre si ya creó su cuenta.", "Ask your distributor for a new one, or sign in if you already created your account.")}</p>
        <ButtonLink href="/entrar">{t("Entrar", "Sign in")}</ButtonLink>
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="flex flex-col gap-1 pt-2">
        <h1 className="text-3xl font-bold text-balance">{t(`${invite.distributorName} lo invita como motorista`, `${invite.distributorName} invites you as a driver`)}</h1>
        <p className="text-lg text-muted">{t("Cree su cuenta para ver su ruta y registrar el efectivo.", "Create your account to see your route and record cash.")}</p>
      </header>
      <Card>
        <p className="text-base">{t(`Su usuario será su teléfono que termina en ${invite.phoneEnd}.`, `You'll sign in with your phone number ending in ${invite.phoneEnd}.`)}</p>
      </Card>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField label={t("Su nombre", "Your name")} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
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
          {t("Crear mi cuenta", "Create my account")}
        </Button>
        {busy && <p className="text-center text-muted">{t("Estamos creando su cuenta de dólares digitales. Toma unos segundos.", "We're creating your digital dollar account. It takes a few seconds.")}</p>}
      </form>
    </Screen>
  );
}
