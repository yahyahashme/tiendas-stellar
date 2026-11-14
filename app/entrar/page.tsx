"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { signInAction } from "@/app/auth-actions";
import { AltLink, HomeNav } from "@/components/auth";
import { Field, PasswordField } from "@/components/kit/field";
import { Form, FormHead, FormSubmit } from "@/components/kit/form";
import { Slip } from "@/components/kit/layout";
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
    <Slip>
      <HomeNav />
      <Form onSubmit={submit} error={error}>
        <FormHead title={t("Entrar", "Sign in")} />
        <Field
          label={t("Teléfono o correo", "Phone or email")}
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
        <FormSubmit error={error ? msg(error) : undefined} busy={busy}>
          {t("Entrar", "Sign in")}
        </FormSubmit>
      </Form>
      <AltLink question={t("¿No tiene cuenta?", "Don't have an account?")} href="/registro">
        {t("Crear cuenta", "Create account")}
      </AltLink>
    </Slip>
  );
}
