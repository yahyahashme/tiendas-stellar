"use client";

import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { BackLink, Button, Card, Chip, Label, LoadError, Loading, NotFound, ReceiptView, Screen } from "@/components/ui";
import { claimCash, getDrivers, getInvoices, getInvoiceNotes, getRouteInvites, getShop } from "@/lib/api";
import { ShopInvite } from "@/components/shop-invite";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { invoiceStatus, leftToPay } from "@/lib/labels";
import type { Receipt, Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

/** Where the QR sends the shop. Local and preview builds have no NEXT_PUBLIC_SITE_URL. */
function invoiceUrl(invoiceId: number) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  return `${siteUrl}/tienda/${invoiceId}`;
}

export default function RouteScreen() {
  const { driverId } = useParams<{ driverId: string }>();
  const { data, failed, reload } = usePolling(`route-${driverId}`, async () => {
    const [drivers, invoices] = await Promise.all([getDrivers(), getInvoices()]);
    const stops = invoices.filter((i) => i.driverId === driverId);
    const shopIds = [...new Set(stops.map((i) => i.shopId))];
    const [shops, invites, notes] = await Promise.all([
      Promise.all(shopIds.map(getShop)).then((list) => list.filter((s): s is Shop => s !== null)),
      getRouteInvites(driverId, shopIds),
      getInvoiceNotes(stops.filter((i) => i.status !== "paid").map((i) => i.id)),
    ]);
    return { driver: drivers.find((d) => d.id === driverId) ?? null, stops, shops, invites, notes };
  });
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ invoiceId: number; receipt: Receipt } | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const { lang, t } = useT();

  if (!data) {
    return (
      <Screen>
        <BackLink />
        {failed ? <LoadError /> : <Loading />}
      </Screen>
    );
  }

  const { driver, stops, shops } = data;
  if (!driver) {
    return (
      <Screen>
        <BackLink />
        <NotFound>{t("No encontramos a ese motorista.", "We couldn't find that driver.")}</NotFound>
      </Screen>
    );
  }

  async function receivedCash(invoiceId: number, amount: number) {
    setBusy(true);
    setReceipt(null);
    const result = await claimCash(invoiceId, amount);
    if (result.ok) await reload();
    setReceipt({ invoiceId, receipt: result });
    setBusy(false);
  }

  const shopName = (shopId: string) => shops.find((s) => s.id === shopId)?.name ?? shopId;
  const pending = stops.filter((i) => i.status !== "paid").length;

  return (
    <Screen>
      <BackLink />
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t(`Ruta de ${driver.name}`, `${driver.name}'s route`)}</h1>
        <p className="text-muted">
          {t(
            `${stops.length} ${stops.length === 1 ? "parada" : "paradas"} hoy · ${pending} por cobrar`,
            `${stops.length} ${stops.length === 1 ? "stop" : "stops"} today · ${pending} to collect`,
          )}
        </p>
      </header>

      {failed && <LoadError />}

      <Card className="flex items-center justify-between gap-3">
        <Label>{t("Efectivo en mano", "Cash on hand")}</Label>
        <p className="text-2xl font-semibold tabular-nums">{formatMoney(driver.cashHeld)}</p>
      </Card>

      <ul className="flex flex-col gap-3">
        {stops.map((invoice) => {
          const status = invoiceStatus(invoice, lang);
          const isOpen = open === invoice.id;
          const left = leftToPay(invoice);
          return (
            <li key={invoice.id}>
              <section className={`flex flex-col rounded-2xl border bg-card ${isOpen ? "border-brand" : "border-line"}`}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : invoice.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-12 w-full flex-col gap-2 rounded-2xl p-4 text-left active:bg-brand-soft"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex flex-col">
                      <span className="text-lg font-semibold">{shopName(invoice.shopId)}</span>
                      <span className="text-sm text-muted">
                        {t("Factura", "Invoice")} {invoice.id}
                      </span>
                    </span>
                    <span className="text-lg font-semibold tabular-nums">{formatMoney(invoice.amount)}</span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <Chip tone={status.tone}>{status.label}</Chip>
                    {invoice.cashClaim !== undefined && <Chip tone="cash">{t("Efectivo por confirmar", "Cash to confirm")}</Chip>}
                  </span>
                </button>

                {isOpen && (
                  <div className="flex flex-col items-center gap-3 px-4 pb-4">
                    {data.notes[invoice.id] && (
                      <p className="w-full rounded-xl bg-paper px-3 py-2 text-base whitespace-pre-line">{data.notes[invoice.id]}</p>
                    )}
                    <div className="rounded-xl bg-white p-2">
                      <QRCodeSVG value={invoiceUrl(invoice.id)} size={280} level="M" title={`${t("Factura", "Invoice")} ${invoice.id}`} />
                    </div>
                    <p className="text-center text-muted">{t("La tienda escanea este código para pagar.", "The shop scans this code to pay.")}</p>
                    {receipt?.invoiceId === invoice.id && <ReceiptView receipt={receipt.receipt} />}
                    {data.invites.codes[invoice.shopId] && (
                      <div className="flex w-full flex-col gap-3 border-t border-line pt-3">
                        <button
                          type="button"
                          onClick={() => setInviting(inviting === invoice.shopId ? null : invoice.shopId)}
                          className="min-h-12 rounded-xl border-2 border-brand px-4 text-base font-semibold text-brand active:bg-brand-soft"
                        >
                          {inviting === invoice.shopId ? t("Ocultar invitación", "Hide invitation") : t("Invitar a Relay", "Invite to Relay")}
                        </button>
                        {inviting === invoice.shopId && (
                          <ShopInvite code={data.invites.codes[invoice.shopId]} distributorName={data.invites.distributorName} />
                        )}
                      </div>
                    )}
                    {invoice.status !== "paid" &&
                      (invoice.cashClaim === undefined ? (
                        <Button onClick={() => receivedCash(invoice.id, left)} busy={busy} hint={formatMoney(left)}>
                          {t("Recibí efectivo", "I received cash")}
                        </Button>
                      ) : (
                        <p className="text-center text-lg">
                          {t(
                            `Esperando que la tienda confirme ${formatMoney(invoice.cashClaim)}.`,
                            `Waiting for the shop to confirm ${formatMoney(invoice.cashClaim)}.`,
                          )}
                        </p>
                      ))}
                  </div>
                )}
              </section>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
