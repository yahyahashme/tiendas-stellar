"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { signInAction } from "@/app/auth-actions";
import { FormError, PasswordField, TextField } from "@/components/form";
import { BackLink, Button, Screen } from "@/components/ui";
import { useT } from "@/lib/i18n";

export default function SignIn() {
  const { t, msg } = useT();
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const reply = await signInAction(contact, password);
    if (reply.ok) {
      router.push("/cuenta");
      return;
    }
    setError(reply.message);
    setBusy(false);
  }

  return (
    <Screen>
      <BackLink />
      <h1 className="text-3xl font-bold">{t("Entrar", "Sign in")}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label={t("Teléfono o correo", "Phone or email")}
          autoComplete="username"
          inputMode="email"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <PasswordField
          label={t("Contraseña", "Password")}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <FormError>{msg(error)}</FormError>}
        <Button type="submit" busy={busy}>
          {t("Entrar", "Sign in")}
        </Button>
      </form>
      <p className="text-center text-lg">
        {t("¿No tiene cuenta?", "Don't have an account?")}{" "}
        <Link href="/registro" className="font-semibold text-brand underline">
          {t("Crear cuenta", "Create account")}
        </Link>
      </p>
    </Screen>
  );
}
