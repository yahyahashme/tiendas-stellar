"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { ActionLink, TextButton } from "@/components/kit/button";
import { Paper } from "@/components/kit/paper";
import { useT } from "@/lib/i18n";
import { chatLink } from "@/lib/whatsapp";

export const claimUrl = (code: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window === "undefined" ? "" : window.location.origin)}/unirse/${code}`;

/** The invite goes to a Salvadoran shop owner, so it's always Spanish. */
const claimMessage = (distributor: string, code: string, url: string) =>
  `Hola, ${distributor} lo agregó en Relay para que pague sus facturas desde el teléfono. Cree su cuenta aquí: ${url} (código ${code})`;

/**
 * A shop's claim code (#132): the QR for the driver to show at the next
 * delivery, the code to read out loud, the link, and WhatsApp when there's a phone.
 * The code and its QR are facts, so they sit on paper; sending and copying are actions under it.
 * `size="lg"` is for the driver's screen (56 px targets).
 */
export function ShopInvite({ code, distributorName, phone, size = "md" }: { code: string; distributorName: string; phone?: string | null; size?: "md" | "lg" }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const url = claimUrl(code);
  let whatsapp: string | null = null;
  if (phone) {
    try {
      whatsapp = chatLink(phone, claimMessage(distributorName, code, url));
    } catch {
      whatsapp = null;
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <Paper as="div" className="flex flex-col items-center gap-2 px-3 py-4 text-center text-ink">
        <p className="text-balance">{t("La tienda escanea este código para crear su cuenta.", "The shop scans this code to make its account.")}</p>
        <QRCodeSVG
          value={url}
          size={220}
          level="M"
          fgColor="currentColor"
          bgColor="transparent"
          title={t(`Código para unirse: ${code}`, `Code to join: ${code}`)}
          className="h-auto w-[min(100%,13.75rem)]"
        />
        <p className="flex flex-col">
          <span className="text-label text-muted">{t("O con el código", "Or with the code")}</span>
          <span className="font-mono text-[1.5rem] font-semibold tracking-[0.2em]">{code}</span>
        </p>
      </Paper>
      {whatsapp && <ActionLink href={whatsapp} external size={size} title={t("Enviar por WhatsApp", "Send on WhatsApp")} />}
      <TextButton onClick={copy} size={size}>
        {copied ? t("Copiado", "Copied") : t("Copiar enlace", "Copy link")}
      </TextButton>
    </div>
  );
}
