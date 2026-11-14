"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getShopInvite } from "@/app/shop-actions";
import { ShopSignUp } from "@/components/shop-signup";
import { BackLink, ButtonLink, Card, Loading, Screen } from "@/components/ui";
import { useT } from "@/lib/i18n";

/**
 * A shop owner opens a distributor's invite (#132): their own account, their
 * own shop name, and the invoices the distributor already made stay theirs.
 * The steps are the shop sign-up's (#134), with the invite claimed at the end of step 2.
 */
export default function ClaimScreen() {
  const { code } = useParams<{ code: string }>();
  const { t } = useT();
  const [step, setStep] = useState(1);
  const [invite, setInvite] = useState<{ distributorName: string } | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    void getShopInvite(code).then((found) => {
      if (live) setInvite(found);
    });
    return () => {
      live = false;
    };
  }, [code]);



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
        <h1 className="text-3xl font-bold">{t("Este código ya no es válido", "This code is no longer valid")}</h1>
        <p className="text-lg">{t("Pida otro a su distribuidora, o entre si ya creó su cuenta.", "Ask your distributor for another one, or sign in if you already made your account.")}</p>
        <ButtonLink href="/entrar">{t("Entrar", "Sign in")}</ButtonLink>
      </Screen>
    );
  }

  return (
    <Screen>
      {step <= 2 && (
        <>
          <header className="flex flex-col gap-1 pt-2">
            <h1 className="text-3xl font-bold text-balance">{t(`${invite.distributorName} lo agregó en Relay`, `${invite.distributorName} added you on Relay`)}</h1>
            <p className="text-lg text-muted">{t("Cree su cuenta para pagar sus facturas desde el teléfono.", "Make your account to pay your invoices from your phone.")}</p>
          </header>
          <Card>
            <p className="text-base">{t(`Sus facturas de ${invite.distributorName} ya estarán en su cuenta.`, `Your invoices from ${invite.distributorName} will already be in your account.`)}</p>
          </Card>
        </>
      )}
      <ShopSignUp code={code} distributorName={invite.distributorName} onStep={setStep} />
    </Screen>
  );
}
