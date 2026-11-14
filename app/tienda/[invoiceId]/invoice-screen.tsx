"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QUIET_MS, TapShield, useQuietOnArrival, useTapShield } from "@/components/tap-shield";
import { Option, OptionList, Stamp, ThumbBar, Ticket, TicketRow, TicketRule } from "@/components/ticket";
import { BackLink, Button, ButtonLink, Chip, LoadError, Loading, NotFound, ReceiptView, Screen } from "@/components/ui";
import { confirmCash, getDrivers, getInvoice, getInvoiceSource, getShop, payLater, payNow } from "@/lib/api";
import { dueOn, formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { invoiceStatus, leftToPay, methodLabel, parseAmount, partPayError } from "@/lib/labels";
import type { Invoice, Receipt, Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

type Action = "now" | "part" | "later" | "cash";
type Panel = "later" | "part" | "cash";

/**
 * True for a beat after `value` changes (not on its first value). The pay
 * buttons swap places when a cash amount arrives or a part payment lands, so
 * they stay inert for that beat: a tap aimed at the old button can't hit the new one.
 */
function useQuietAfterChange(value: boolean | null): boolean {
  const [seen, setSeen] = useState<{ value: boolean; quiet: boolean } | null>(null);
  if (value !== null && seen?.value !== value) setSeen({ value, quiet: seen !== null });
  useEffect(() => {
    if (!seen?.quiet) return;
    const timer = setTimeout(() => setSeen((now) => now && { ...now, quiet: false }), QUIET_MS);
    return () => clearTimeout(timer);
  }, [seen]);
  return seen?.quiet ?? false;
}

/** Why "Pagar en 7 días" is greyed out, or null if the shop can use it. */
function creditBlocked(shop: Shop | null, invoice: Invoice, t: (es: string, en: string) => string): string | null {
  if (!shop || shop.creditLimit <= 0) return t("Su tienda aún no tiene crédito", "Your shop doesn't have credit yet");
  if (shop.overdue) return t("Tiene un pago vencido", "You have an overdue payment");
  const owedAfter = Math.round((shop.creditOwed + leftToPay(invoice)) * 100);
  if (owedAfter > Math.round(shop.creditLimit * 100)) return t("Supera su límite de crédito", "It's over your credit limit");
  return null;
}

export default function InvoiceScreen() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const id = Number(invoiceId);
  const { data, failed, stale, reload } = usePolling(`invoice-${invoiceId}`, async () => {
    const [invoice, drivers] = await Promise.all([getInvoice(id), getDrivers()]);
    const shop = invoice ? await getShop(invoice.shopId) : null;
    return { invoice, shop, drivers, now: Date.now() };
  });
  const [source, setSource] = useState<{ distributorName: string; note: string | null } | null>(null);
  useEffect(() => {
    let live = true;
    void getInvoiceSource(id).then((found) => live && setSource(found), () => {});
    return () => {
      live = false;
    };
  }, [id]);
  const [busy, setBusy] = useState<Action | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  // Which option is unfolded (one at a time). undefined = the shop hasn't picked yet,
  // so a cash amount the driver registered opens its own panel.
  const [choice, setChoice] = useState<Panel | null | undefined>(undefined);
  const [partText, setPartText] = useState("");
  const [partError, setPartError] = useState<string | null>(null);
  const [landed, setLanded] = useState(false); // the stamp has played; don't replay it on Back
  const { noteTap, settle } = useTapShield();
  const claimJustChanged = useQuietAfterChange(data?.invoice ? data.invoice.cashClaim !== undefined : null);
  // The pay buttons wait for today's numbers, then one beat more: a double tap on the screen before can't pay.
  const arriving = useQuietOnArrival(Boolean(data?.invoice) && !stale);
  const { lang, t, msg } = useT();

  async function run(action: Action, write: () => Promise<Receipt>) {
    setBusy(action);
    setReceipt(null);
    const result = await write();
    if (result.ok) {
      await reload(); // show the receipt and the new status together
      setChoice(undefined);
      setPartText("");
    }
    setReceipt(result);
    // The bar comes back where the panel's button was: hold everything until the taps stop, so a repeat tap can't pay the rest.
    if (result.ok && action !== "now") await settle();
    setBusy(null);
  }

  if (!data) {
    return (
      <Screen>
        <BackLink />
        {failed ? <LoadError /> : <Loading />}
      </Screen>
    );
  }

  const { invoice, shop, drivers, now } = data;
  if (!invoice) {
    return (
      <Screen>
        <BackLink />
        <NotFound>{t(`No encontramos la factura ${invoiceId}.`, `We couldn't find invoice ${invoiceId}.`)}</NotFound>
      </Screen>
    );
  }

  const status = invoiceStatus(invoice, lang);
  const left = leftToPay(invoice);
  const isPaid = invoice.status === "paid";
  const blocked = creditBlocked(shop, invoice, t);
  const driver = drivers.find((d) => d.id === invoice.driverId);

  const settled = isPaid && (busy !== null || receipt?.ok === true); // paid on this visit: let the stamp land
  const locked = busy !== null || claimJustChanged;
  const unready = stale || arriving;
  const hasClaim = invoice.cashClaim !== undefined;
  const partAmount = parseAmount(partText);
  const partOk = partAmount !== null && partPayError(partText, left, invoice.cashClaim) === null;

  let panel: Panel | null = choice === undefined ? (hasClaim ? "cash" : null) : choice;
  if (panel === "later" && blocked !== null) panel = null;
  const toggle = (next: Panel) => setChoice(panel === next ? null : next);
  // A panel with its own button takes over from the bottom bar, so there is one main button at a time.
  const panelHasButton = panel === "later" || panel === "part" || (panel === "cash" && hasClaim);

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <BackLink />
        {shop && !isPaid && (
          <Link href={`/tienda/cuenta/${shop.id}`} className="-mr-1 inline-flex min-h-12 items-center px-1 text-base font-medium text-brand">
            {t("Mi cuenta", "My account")}
          </Link>
        )}
      </div>

      {failed && <LoadError />}
      <p role="status" className="sr-only">
        {busy !== null ? t("Procesando...", "Processing...") : ""}
      </p>
      {busy !== null && <TapShield onTap={noteTap} />}

      <Ticket>
        <header>
          <h1 className="text-2xl font-bold text-balance">{shop?.name ?? t("Tienda", "Shop")}</h1>
          <p className="text-muted">
            {t("Factura", "Invoice")} {invoice.id}
            {source?.distributorName ? ` · ${source.distributorName}` : ""}
          </p>
          {source?.note && <p className="mt-2 text-base whitespace-pre-line">{source.note}</p>}
        </header>
        <TicketRule />
        {invoice.status === "part_paid" && (
          <div className="flex flex-col gap-1 text-lg">
            <TicketRow label="Total">{formatMoney(invoice.amount)}</TicketRow>
            <TicketRow label={t("Pagado", "Paid")}>−{formatMoney(invoice.paid)}</TicketRow>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="flex items-baseline justify-between gap-3 text-muted">
            <span>{invoice.status === "part_paid" ? t("Falta", "Left to pay") : "Total"}</span>
            <span>
              {isPaid
                ? `${t("Pagada", "Paid")}${invoice.method ? ` · ${methodLabel(invoice.method, lang)}` : ""}`
                : dueOn(invoice.dueDate, now, lang)}
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
            <p className={`text-5xl font-bold tracking-tight tabular-nums ${isPaid ? "-mr-6" : ""}`}>{formatMoney(isPaid ? invoice.amount : left)}</p>
            {isPaid ? (
              <Stamp tone={status.tone === "credit" ? "credit" : "paid"} fresh={settled && !landed} onLanded={() => setLanded(true)}>
                {status.label}
              </Stamp>
            ) : (
              <Chip tone={status.tone}>{status.label}</Chip>
            )}
          </div>
        </div>
      </Ticket>

      {receipt && (
        <div className="unfold">
          <ReceiptView receipt={receipt} />
        </div>
      )}

      {!isPaid && (
        <>
          <OptionList>
            <Option
              title={t("Pagar en 7 días", "Pay in 7 days")}
              hint={blocked ?? t("Sin intereses", "No interest")}
              open={blocked === null ? panel === "later" : undefined}
              onClick={() => toggle("later")}
              disabled={locked || blocked !== null}
            >
              <p className="text-lg">
                {t("Hoy no paga nada. Paga ", "You pay nothing today. You pay ")}
                <strong>{formatMoney(left)}</strong>
                {t(" en 7 días.", " in 7 days.")}
              </p>
              <Button onClick={() => run("later", () => payLater(id))} busy={busy === "later"} disabled={locked || unready}>
                {t("Confirmo", "Confirm")}
              </Button>
            </Option>
            <Option title={t("Pagar otro monto", "Pay another amount")} open={panel === "part"} onClick={() => toggle("part")} disabled={locked}>
              <label className="flex flex-col gap-1 text-lg">
                {t("¿Cuánto paga ahora?", "How much are you paying now?")}{" "}
                <span className="text-base text-muted">
                  {t("Falta", "Left to pay:")} {formatMoney(left)}
                </span>
                <span className="text-base text-muted">
                  {t(
                    "Si paga la mitad o más ahora, la comisión baja y su límite puede subir con solo $10 a crédito.",
                    "If you pay half or more now, the fee is lower and your limit can grow with just $10 on credit.",
                  )}
                </span>
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  autoFocus
                  value={partText}
                  aria-invalid={partError !== null}
                  onChange={(e) => {
                    setPartText(e.target.value);
                    setPartError(null);
                  }}
                  className="min-h-14 scroll-mb-28 rounded-xl border-2 border-line bg-card px-3 text-2xl font-semibold tabular-nums placeholder:font-normal placeholder:text-muted focus:border-brand focus:outline-none aria-invalid:border-bad"
                />
              </label>
              {partError && (
                <p className="font-medium text-bad" role="alert">
                  {msg(partError)}
                </p>
              )}
              <Button
                onClick={() => {
                  const error = partPayError(partText, left, invoice.cashClaim);
                  if (error || partAmount === null) return setPartError(error ?? "Monto inválido.");
                  void run("part", () => payNow(id, partAmount));
                }}
                busy={busy === "part"}
                disabled={locked || unready || partText.trim() === ""}
                hint={
                  partOk
                    ? t(`${formatMoney(partAmount)} con dólares digitales`, `${formatMoney(partAmount)} in digital dollars`)
                    : t("Con dólares digitales", "In digital dollars")
                }
              >
                {t("Pagar este monto", "Pay this amount")}
              </Button>
            </Option>
            <Option
              title={t("Pagué en efectivo", "I paid in cash")}
              hint={hasClaim ? t("Efectivo por confirmar", "Cash to confirm") : undefined}
              open={panel === "cash"}
              onClick={() => toggle("cash")}
              disabled={locked}
            >
              {invoice.cashClaim !== undefined ? (
                <>
                  <p className="text-lg">
                    {driver?.name ?? t("El motorista", "The driver")} {t("registró", "registered")}{" "}
                    <strong>{formatMoney(invoice.cashClaim)}</strong> {t("en efectivo.", "in cash.")}
                  </p>
                  <Button onClick={() => run("cash", () => confirmCash(id, invoice.cashClaim ?? 0))} busy={busy === "cash"} disabled={locked || unready}>
                    {t("Confirmo", "Confirm")}
                  </Button>
                </>
              ) : (
                <p className="text-lg">{t("El motorista aún no registró el efectivo.", "The driver hasn't registered the cash yet.")}</p>
              )}
            </Option>
          </OptionList>

          {!panelHasButton && (
            <ThumbBar>
              <Button
                onClick={() => run("now", () => payNow(id))}
                busy={busy === "now"}
                disabled={locked || stale}
                arriving={arriving}
                hint={t(`${formatMoney(left)} con dólares digitales`, `${formatMoney(left)} in digital dollars`)}
              >
                {t("Pagar ahora", "Pay now")}
              </Button>
            </ThumbBar>
          )}
        </>
      )}

      {shop && isPaid && (
        <ButtonLink href={`/tienda/cuenta/${shop.id}`} variant="secondary">
          {t("Mi cuenta", "My account")}
        </ButtonLink>
      )}
    </Screen>
  );
}
