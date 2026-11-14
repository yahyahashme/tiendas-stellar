"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
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
 */
export function ShopInvite({ code, distributorName, phone }: { code: string; distributorName: string; phone?: string | null }) {
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
    <div className="flex flex-col items-center gap-3 rounded-xl bg-brand-soft p-3">
      <p className="text-center text-base">{t("La tienda escanea este código para crear su cuenta.", "The shop scans this code to make its account.")}</p>
      <div className="rounded-xl bg-white p-2">
        <QRCodeSVG value={url} size={220} level="M" title={t(`Código para unirse: ${code}`, `Code to join: ${code}`)} />
      </div>
      <p className="text-center">
        <span className="text-sm text-muted">{t("O con el código", "Or with the code")}</span>
        <span className="block font-mono text-2xl font-bold tracking-[0.2em]">{code}</span>
      </p>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center rounded-xl bg-brand px-4 text-base font-semibold text-white active:bg-brand-dark"
          >
            {t("Enviar por WhatsApp", "Send on WhatsApp")}
          </a>
        )}
        <button
          type="button"
          onClick={copy}
          className={`min-h-12 rounded-xl border-2 border-brand bg-card px-4 text-base font-semibold text-brand active:bg-brand-soft ${whatsapp ? "" : "sm:col-span-2"}`}
        >
          {copied ? t("Copiado", "Copied") : t("Copiar enlace", "Copy link")}
        </button>
      </div>
    </div>
  );
}
