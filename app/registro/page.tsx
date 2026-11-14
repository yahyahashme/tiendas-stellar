"use client";

import Link from "next/link";
import { useState } from "react";
import { ShopSignUp } from "@/components/shop-signup";
import { BackLink, Card, Screen } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { DistributorForm } from "./distributor-form";

type Choice = "tienda" | "distribuidora" | "motorista";

const CHOICES: { role: Choice; title: [string, string]; hint: [string, string] }[] = [
  { role: "tienda", title: ["Tienda", "Shop"], hint: ["Compro a distribuidores", "I buy from distributors"] },
  { role: "distribuidora", title: ["Distribuidora", "Distributor"], hint: ["Vendo y entrego a tiendas", "I sell and deliver to shops"] },
  { role: "motorista", title: ["Motorista", "Driver"], hint: ["Entrego para una distribuidora", "I deliver for a distributor"] },
];

export default function SignUp() {
  const { t } = useT();
  const [role, setRole] = useState<Choice | null>(null);
  const [shopStep, setShopStep] = useState(1); // past step 1, the chooser and "¿Ya tiene cuenta?" go away



  return (
    <Screen wide={role === "distribuidora"}>
      <BackLink />
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t("Crear cuenta", "Create account")}</h1>
        <p className="text-lg text-muted">{t("Es gratis. Las tiendas nunca pagan comisiones.", "It's free. Shops never pay fees.")}</p>
      </header>

      {shopStep === 1 && (
        <section className="flex max-w-md flex-col gap-2" aria-labelledby="who">
          <h2 id="who" className="text-xl font-semibold">
            {t("¿Qué es usted?", "What are you?")}
          </h2>
          <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="who">
            {CHOICES.map((choice) => (
              <button
                key={choice.role}
                type="button"
                role="radio"
                aria-checked={role === choice.role}
                onClick={() => {
                  setRole(choice.role);
                }}
                className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2 text-left transition-colors duration-150 ${
                  role === choice.role ? "border-brand bg-brand-soft" : "border-line bg-card active:bg-brand-soft"
                }`}
              >
                <span className="flex flex-col">
                  <span className="text-lg font-semibold">{t(...choice.title)}</span>
                  <span className="text-muted">{t(...choice.hint)}</span>
                </span>
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    role === choice.role ? "border-brand bg-brand text-white" : "border-line"
                  }`}
                >
                  {role === choice.role && (
                    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                    </svg>
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {role === "motorista" && (
        <Card className="flex flex-col gap-2">
          <p className="text-lg">{t("Los motoristas se registran con la invitación de su distribuidora.", "Drivers sign up with their distributor's invite.")}</p>
          <p className="text-muted">{t("Pídale el enlace a su distribuidora y ábralo en este teléfono.", "Ask your distributor for the link and open it on this phone.")}</p>
        </Card>
      )}

      {role === "distribuidora" && <DistributorForm />}

      {role === "tienda" && <ShopSignUp onStep={setShopStep} />}

      {shopStep === 1 && (
        <p className="text-center text-lg">
          {t("¿Ya tiene cuenta?", "Already have an account?")}{" "}
          <Link href="/entrar" className="font-semibold text-brand underline">
            {t("Entrar", "Sign in")}
          </Link>
        </p>
      )}
    </Screen>
  );
}
