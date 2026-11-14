"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getShopSuppliers, removeSupplierAction, type ShopSuppliers } from "@/app/shop-actions";
import { TapShield, useQuietOnArrival } from "@/components/tap-shield";
import { OptionLink, OptionList, Stamp, ThumbBar, Ticket, TicketRow, TicketRule, reveal } from "@/components/ticket";
import { BackLink, Button, Chip, LoadError, Loading, NotFound, ReceiptView, Screen } from "@/components/ui";
import { getBalance, getInvoices, getShop, getShopHistory, getSuppliers, repay } from "@/lib/api";
import { dueOn, formatDay, formatMoney, plural } from "@/lib/format";
import { type Lang, useT } from "@/lib/i18n";
import { leftToPay } from "@/lib/labels";
import type { Invoice, Receipt } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";
import { AccountSections } from "./account-sections";

/** The line under an unpaid invoice: what the shop most needs to know about it. */
function invoiceNote(invoice: Invoice, now: number, lang: Lang): string {
  const en = lang === "en";
  if (invoice.cashClaim !== undefined) return `${en ? "Cash to confirm" : "Efectivo por confirmar"}: ${formatMoney(invoice.cashClaim)}`;
  if (invoice.status === "part_paid") {
    return en
      ? `Paid ${formatMoney(invoice.paid)} of ${formatMoney(invoice.amount)}`
      : `Pagado ${formatMoney(invoice.paid)} de ${formatMoney(invoice.amount)}`;
  }
  return dueOn(invoice.dueDate, now, lang);
}

/** "Distribuidora El Sol lo agregó" (#132): who sells to this shop on Relay; the owner can remove one. */
function Suppliers({ shopId }: { shopId: string }) {
  const { lang, t, msg } = useT();
  const [data, setData] = useState<ShopSuppliers | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => setData(await getShopSuppliers(shopId)), [shopId]);
  useEffect(() => {
    let live = true;
    void getShopSuppliers(shopId).then((found) => {
      if (live) setData(found);
    });
    return () => {
      live = false;
    };
  }, [shopId]);

  if (!data || data.suppliers.length === 0) return null;

  async function remove(distributorId: string) {
    setBusy(distributorId);
    setError(null);
    const reply = await removeSupplierAction(shopId, distributorId);
    if (reply.ok) await load();
    else setError(reply.message);
    setBusy(null);
  }

  return (
    <section className="flex flex-col gap-2 px-1">
      <h2 className="text-lg font-semibold">{t("Proveedores", "Suppliers")}</h2>
      <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-card">
        {data.suppliers.map((s) => (
          <li key={s.distributorId} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex min-w-0 flex-col">
              <span className="text-lg font-semibold">{t(`${s.name} lo agregó`, `${s.name} added you`)}</span>
              <span className="text-sm text-muted">{formatDay(s.addedAt, lang)}</span>
            </span>
            {data.isOwner && (
              <button
                type="button"
                onClick={() => remove(s.distributorId)}
                disabled={busy !== null}
                className="min-h-12 shrink-0 rounded-xl border-2 border-line px-4 text-base font-semibold text-bad active:bg-paper disabled:text-muted"
              >
                {busy === s.distributorId ? t("Quitando...", "Removing...") : t("Quitar", "Remove")}
              </button>
            )}
          </li>
        ))}
      </ul>
      {data.isOwner && (
        <p className="text-sm text-muted">
          {t(
            "Si quita una distribuidora, sus facturas anteriores siguen en su historial.",
            "If you remove a distributor, its past invoices stay in your history.",
          )}
        </p>
      )}
      {error && <p className="text-bad">{msg(error)}</p>}
    </section>
  );
}

export default function AccountScreen() {
  const { shopId } = useParams<{ shopId: string }>();
  const { data, failed, stale, reload } = usePolling(`account-${shopId}`, async () => {
    const [shop, invoices, balance, suppliers, history] = await Promise.all([
      getShop(shopId),
      getInvoices(),
      getBalance(shopId).catch(() => null), // a missing balance shouldn't hide the debt
      getSuppliers(shopId),
      getShopHistory(shopId).catch(() => null), // the score can wait; the debt can't
    ]);
    return { shop, balance, suppliers, history, unpaid: invoices.filter((i) => i.shopId === shopId && i.status !== "paid"), now: Date.now() };
  });
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  // The debt paid on this visit, so the slip can show it stamped and say how the limit moved.
  const [paid, setPaid] = useState<{ amount: number; limit: number; due?: string } | null>(null);
  const [landed, setLanded] = useState(false);
  // "Pagar deuda" pays with one tap, so it waits a beat after it comes on screen: a double tap on the screen before can't pay.
  const { lang, t } = useT();
  const arriving = useQuietOnArrival(Boolean(data?.shop && !stale && data.shop.creditOwed > 0));

  // Coming back to this screen is a new visit: the last visit's stamp and message don't carry over.
  if (stale && (paid !== null || receipt !== null)) {
    setPaid(null);
    setReceipt(null);
  }

  // Never show a debt from an earlier visit: wait for today's numbers.
  if (!data || stale) {
    return (
      <Screen>
        <BackLink />
        {failed ? <LoadError /> : <Loading />}
      </Screen>
    );
  }

  const { shop, balance, suppliers, history, unpaid, now } = data;
  if (!shop) {
    return (
      <Screen>
        <BackLink />
        <NotFound>{t("No encontramos esa tienda.", "We couldn't find that shop.")}</NotFound>
      </Screen>
    );
  }

  async function payDebt() {
    if (!shop || busy) return;
    const before = { amount: shop.creditOwed, limit: shop.creditLimit, due: shop.creditDue };
    setBusy(true);
    setReceipt(null);
    const result = await repay(shop.id, before.amount);
    if (result.ok) {
      setPaid(before);
      setLanded(false);
      await reload(); // show the message and the new numbers together
    }
    setReceipt(result);
    setBusy(false);
  }

  const owes = shop.creditOwed > 0;
  const justPaid = paid !== null && !owes;
  const hasCredit = shop.creditLimit > 0;
  const available = Math.max(0, Math.round((shop.creditLimit - shop.creditOwed) * 100) / 100);
  const limitMoved = justPaid ? Math.round((shop.creditLimit - paid.limit) * 100) / 100 : 0;
  const payments = shop.onTime + shop.late;
  // A "paid" message stops being true once the shop has taken new credit (a new due date); an error stays until the next try.
  const owesAgain = owes && paid !== null && shop.creditDue !== paid.due;
  const result = receipt && (!receipt.ok || !owesAgain) ? receipt : null;

  return (
    <Screen>
      <BackLink />

      {failed && <LoadError />}
      <p role="status" className="sr-only">
        {busy ? t("Procesando...", "Processing...") : ""}
      </p>
      {busy && <TapShield />}

      <Ticket>
        <header>
          <h1 className="text-2xl font-bold text-balance">{shop.name}</h1>
          <p className="text-muted">
            {t("Mi cuenta", "My account")} · {shop.owner}
          </p>
        </header>
        <TicketRule />
        <div className="flex flex-col gap-1">
          <p className="flex items-baseline justify-between gap-3 text-muted">
            <span>{justPaid ? t("Deuda", "Debt") : t("Debe", "You owe")}</span>
            {justPaid && <span>{t("Pagada hoy", "Paid today")}</span>}
            {owes && shop.creditDue && (
              <span className={shop.overdue ? "font-medium text-bad" : undefined}>
                {shop.overdue
                  ? t(`Venció el ${formatDay(shop.creditDue)}`, `Was due ${formatDay(shop.creditDue, "en")}`)
                  : t(`Vence el ${formatDay(shop.creditDue)}`, `Due ${formatDay(shop.creditDue, "en")}`)}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
            <p className={`text-5xl font-bold tracking-tight tabular-nums ${justPaid ? "-mr-6" : ""}`}>
              {formatMoney(justPaid ? paid.amount : shop.creditOwed)}
            </p>
            {justPaid && (
              <Stamp tone="paid" fresh={!landed} onLanded={() => setLanded(true)}>
                {t("Pagada", "Paid")}
              </Stamp>
            )}
            {shop.overdue && <Chip tone="overdue">{t("Vencido", "Overdue")}</Chip>}
          </div>
          {!owes && !justPaid && <p className="font-medium text-ok">{t("No tiene deudas pendientes.", "You have no debts to pay.")}</p>}
        </div>
        <TicketRule />
        <div className="flex flex-col gap-1 text-lg">
          <TicketRow label={t("Límite de crédito", "Credit limit")} strong>
            {formatMoney(shop.creditLimit)}
          </TicketRow>
          {limitMoved !== 0 && (
            <p className={`unfold -mt-1 text-right text-base font-medium ${limitMoved > 0 ? "text-ok" : "text-bad"}`}>
              {limitMoved > 0 ? t("Subió", "Up") : t("Bajó", "Down")} {formatMoney(Math.abs(limitMoved))}
            </p>
          )}
          {shop.overdue ? (
            <>
              {/* No sum here: with a late debt the shop can't use what's left, so a dollar figure would mislead. */}
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{t("Disponible", "Available")}</span>
                <span className="text-2xl font-bold text-bad">{t("En pausa", "On hold")}</span>
              </p>
              <p className="text-base">{t("Pague su deuda para reactivarlo.", "Pay your debt to turn it back on.")}</p>
            </>
          ) : (
            <>
              {owes && (
                <>
                  <TicketRow label={t("Menos lo que debe", "Minus what you owe")}>{formatMoney(shop.creditOwed)}</TicketRow>
                  <hr className="ml-auto w-28 border-0 border-t-2 border-ink" />
                </>
              )}
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{t("Disponible", "Available")}</span>
                <span className="text-2xl font-bold tabular-nums">{formatMoney(available)}</span>
              </p>
            </>
          )}
        </div>
      </Ticket>

      {result && (
        <div ref={reveal} className="unfold scroll-mb-28">
          <ReceiptView receipt={result} />
        </div>
      )}

      {unpaid.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-lg font-semibold">{t("Facturas por pagar", "Invoices to pay")}</h2>
          <OptionList>
            {unpaid.map((invoice) => (
              <OptionLink key={invoice.id} href={`/tienda/${invoice.id}`} title={`${t("Factura", "Invoice")} ${invoice.id}`} hint={invoiceNote(invoice, now, lang)}>
                <span className="sr-only">{t("Falta ", "Left to pay: ")}</span>
                {formatMoney(leftToPay(invoice))}
              </OptionLink>
            ))}
          </OptionList>
        </section>
      )}

      <AccountSections shop={shop} balance={balance} suppliers={suppliers} history={history} now={now} />

      <section id="credito" className="flex scroll-mt-4 flex-col gap-1 px-1">
        <h2 className="text-lg font-semibold">{t("Cómo sube su límite", "How your limit grows")}</h2>
        {hasCredit ? (
          <>
            <TicketRow label={t("Si paga su deuda a tiempo", "If you pay your debt on time")}>
              <span className="font-semibold text-ok">+$25</span>
            </TicketRow>
            <TicketRow label={t("Si paga de 2 a 7 días tarde", "If you pay 2 to 7 days late")}>
              <span className="font-semibold text-bad">−$25</span>
            </TicketRow>
            <TicketRow label={t("Si paga 8 días tarde o más", "If you pay 8 or more days late")}>
              <span className="font-semibold text-bad">−$50</span>
            </TicketRow>
            <p className="text-muted">
              {t(
                "Un día tarde todavía cuenta a tiempo. Sube como máximo una vez por período de crédito, y solo si compró $40 o más con ",
                "One day late still counts as on time. It goes up at most once per credit period, and only if you bought $40 or more with ",
              )}
              <span className="whitespace-nowrap">{t("«Pagar en 7 días»", "“Pay in 7 days”")}</span>
              {t(
                " ($10 si pagó la mitad al recibir). Si paga 8 días tarde o más, no sube durante 4 períodos. El límite máximo es $500.",
                " ($10 if you paid half on delivery). If you pay 8 or more days late, it doesn't grow for 4 periods. The highest limit is $500.",
              )}
            </p>
            <p className="text-muted">{t("Sin intereses: paga lo mismo que compró.", "No interest: you pay the same as you bought.")}</p>
          </>
        ) : (
          <p className="text-muted">{t("Su tienda no tiene crédito por ahora.", "Your shop doesn't have credit for now.")}</p>
        )}
        {payments > 0 && (
          <p className="mt-2">
            {t(
              `Lleva ${plural(shop.onTime, "pago", "pagos")} a tiempo y ${shop.late} tarde.`,
              `${plural(shop.onTime, "payment", "payments")} on time and ${shop.late} late so far.`,
            )}
          </p>
        )}
      </section>

      <Suppliers shopId={shop.id} />

      {(owes || busy) && (
        <ThumbBar>
          <Button
            onClick={payDebt}
            busy={busy}
            arriving={arriving}
            hint={t(
              `${formatMoney(owes ? shop.creditOwed : (paid?.amount ?? 0))} con dólares digitales`,
              `${formatMoney(owes ? shop.creditOwed : (paid?.amount ?? 0))} in digital dollars`,
            )}
          >
            {t("Pagar deuda", "Pay debt")}
          </Button>
        </ThumbBar>
      )}
      {justPaid && !busy && (
        <ThumbBar>
          {/* Stays where the button was, so a repeat tap lands on nothing instead of on an invoice row. */}
          <p className="flex min-h-14 flex-col items-center justify-center rounded-xl bg-line px-5 py-2 text-center text-lg font-semibold text-muted">
            {t("Deuda pagada", "Debt paid")}
            <span className="text-sm font-normal">
              {t(`${formatMoney(paid.amount)} con dólares digitales`, `${formatMoney(paid.amount)} in digital dollars`)}
            </span>
          </p>
        </ThumbBar>
      )}
    </Screen>
  );
}
