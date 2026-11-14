"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getShopInvite } from "@/app/shop-actions";
import { Brand, HomeNav, StatusSlip } from "@/components/auth";
import { ButtonLink } from "@/components/kit/button";
import { Slip } from "@/components/kit/layout";
import { Receipt, ReceiptHeader, ReceiptRule } from "@/components/kit/paper";
import { Loading } from "@/components/kit/states";
import { ShopSignUp } from "@/components/shop-signup";
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
        <StatusSlip title={t("Este código ya no es válido", "This code is no longer valid")} stamp={t("No válido", "Not valid")} tone="bad">
          {t("Pida otro a su distribuidora, o entre si ya creó su cuenta.", "Ask your distributor for another one, or sign in if you already made your account.")}
        </StatusSlip>
        <ButtonLink href="/entrar">{t("Entrar", "Sign in")}</ButtonLink>
      </Slip>
    );
  }

  return (
    <Slip>
      <Brand />
      {step <= 2 && (
        // The invite, printed like the distributor's own slips: the shop knows that name from its receipts.
        <Receipt>
          <ReceiptHeader from={invite.distributorName} number={t("lo agregó en Relay", "added you on Relay")} />
          <ReceiptRule />
          <p className="text-pretty">{t(`Sus facturas de ${invite.distributorName} ya estarán en su cuenta.`, `Your invoices from ${invite.distributorName} will already be in your account.`)}</p>
        </Receipt>
      )}
      <ShopSignUp
        code={code}
        distributorName={invite.distributorName}
        onStep={setStep}
        intro={t("Cree su cuenta para pagar sus facturas desde el teléfono.", "Make your account to pay your invoices from your phone.")}
      />
    </Slip>
  );
}
