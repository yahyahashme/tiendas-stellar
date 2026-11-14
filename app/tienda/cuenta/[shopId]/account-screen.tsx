"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";
import { ActionLink, Button, DetailLink, Held } from "@/components/kit/button";
import { Split, TopNav } from "@/components/kit/layout";
import { Money, MoneyText } from "@/components/kit/money";
import { Receipt, ReceiptFoot, ReceiptHeader, ReceiptLine, ReceiptLines, ReceiptTotal } from "@/components/kit/paper";
import { Stamp } from "@/components/kit/stamp";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { HOLD_MS, TapShield, useMovedGuard, useQuietOnArrival, useSameSpotGuard, useTapShield } from "@/components/tap-shield";
import { getBalance, getInvoices, getShop, getShopHistory, getSuppliers, repay } from "@/lib/api";
import { creditScore } from "@/lib/credit";
import { formatDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { MARK } from "@/lib/stamps";
import type { Receipt as Outcome } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";
import { AccountSections, InvoicesToPay } from "./account-sections";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The screen before its numbers arrive, and when they can't be found. */
export function AccountFrame({ children }: { children: ReactNode }) {
  const { t } = useT();
  return <Split pin="facts" nav={<TopNav back="/" backLabel={t("Inicio", "Home")} />} facts={children} actions={null} />;
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
  const running = useRef(false);
  // After a payment the screen has changed under the thumb: taps stay blocked until they stop.
  const [held, setHeld] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // The debt paid on this visit, so the slip can show it stamped and say how the limit moved.
  const [paid, setPaid] = useState<{ amount: number; limit: number; due?: string } | null>(null);
  const [landed, setLanded] = useState(false); // the stamp has played; don't replay it
  const { noteTap, settle } = useTapShield();
  const { watch, typed, stray } = useSameSpotGuard();
  // A refresh can add a line to the slip (the score arrives, the limit moves), and on a phone the button sits
  // right under the slip: for a beat after it has changed place, it ignores taps.
  const { ref: payPlace, justMoved } = useMovedGuard<HTMLDivElement>();
  const { lang, t, msg } = useT();
  // "Pagar deuda" pays with one tap, so it waits a beat after it comes on screen: a double tap on the screen before can't pay.
  const arriving = useQuietOnArrival(Boolean(data?.shop && !stale && data.shop.creditOwed > 0));

  // Coming back to this screen is a new visit: the last visit's stamp and message don't carry over.
  if (stale && (paid !== null || outcome !== null)) {
    setPaid(null);
    setOutcome(null);
  }

  // Never show a debt from an earlier visit: wait for today's numbers.
  if (!data || stale) return <AccountFrame>{failed ? <Failure onRetry={reload} /> : <Loading lines={6} />}</AccountFrame>;

  const { shop, balance, suppliers, history, unpaid, now } = data;
  if (!shop) {
    return (
      <AccountFrame>
        <Empty action={<ActionLink href="/" title={t("Volver al inicio", "Back to the start")} />}>{t("No encontramos esa tienda.", "We couldn't find that shop.")}</Empty>
      </AccountFrame>
    );
  }

  async function payDebt() {
    if (!shop || running.current) return; // two taps in the same instant, before the screen has redrawn: one payment
    running.current = true;
    const before = { amount: shop.creditOwed, limit: shop.creditLimit, due: shop.creditDue };
    setBusy(true);
    setOutcome(null);
    const result = await repay(shop.id, before.amount);
    if (result.ok) {
      setPaid(before);
      setLanded(false);
      await reload(); // show the message and the new numbers together
    }
    setOutcome(result);
    // The screen is not what it was: the button is gone and the slip has new lines. Hold everything until
    // the taps have stopped, so taps repeated every second or two can't open an invoice or anything else.
    setHeld(true);
    setBusy(false);
    await settle(HOLD_MS);
    setHeld(false);
    running.current = false;
  }

  const owes = shop.creditOwed > 0;
  const justPaid = paid !== null && !owes;
  const hasCredit = shop.creditLimit > 0;
  const available = Math.max(0, Math.round((shop.creditLimit - shop.creditOwed) * 100) / 100);
  const limitMoved = justPaid ? Math.round((shop.creditLimit - paid.limit) * 100) / 100 : 0;
  // A "paid" message stops being true once the shop has taken new credit (a new due date); an error stays until the next try.
  const owesAgain = owes && paid !== null && shop.creditDue !== paid.due;
  const result = outcome && (!outcome.ok || !owesAgain) ? outcome : null;
  const score = history ? creditScore(shop, history.rows, suppliers.length, now) : null;
  const dueSoon = owes && !shop.overdue && shop.creditDue !== undefined && Date.parse(shop.creditDue) - now <= 2 * DAY_MS;
  const mark = justPaid ? "paid" : shop.overdue ? "overdue" : dueSoon ? "soon" : owes ? "credit" : null;
  const inDollars = t("con dólares digitales", "in digital dollars");

  const slip = (
    <Receipt>
      <ReceiptHeader as="h1" from={shop.name} number={t("Mi cuenta", "My account")} date={shop.owner} />
      <ReceiptTotal
        label={justPaid ? t("Deuda", "Debt") : t("Debe", "You owe")}
        value={justPaid ? paid.amount : shop.creditOwed}
        note={
          justPaid ? (
            t("Pagada hoy", "Paid today")
          ) : owes && shop.creditDue ? (
            shop.overdue ? (
              <span className="font-semibold text-bad">{t(`Venció el ${formatDay(shop.creditDue)}`, `Was due ${formatDay(shop.creditDue, "en")}`)}</span>
            ) : (
              t(`Vence el ${formatDay(shop.creditDue)}`, `Due ${formatDay(shop.creditDue, "en")}`)
            )
          ) : undefined
        }
      />
      <ReceiptLines>
        <ReceiptLine label={t("Límite", "Limit")}>
          <Money value={shop.creditLimit} />
        </ReceiptLine>
        {limitMoved !== 0 && (
          <ReceiptLine label={limitMoved > 0 ? t("Su límite subió", "Your limit went up") : t("Su límite bajó", "Your limit went down")}>
            <span className={`font-semibold ${limitMoved > 0 ? "text-ok" : "text-bad"}`}>
              {limitMoved > 0 && "+"}
              <Money value={limitMoved} />
            </span>
          </ReceiptLine>
        )}
        <ReceiptLine label={t("Disponible", "Available")} strong>
          {/* No sum with a late debt: the shop can't use what's left, so a dollar figure would mislead. */}
          {shop.overdue ? <span className="text-bad">{t("En pausa", "On hold")}</span> : <Money value={available} />}
        </ReceiptLine>
        {score && (
          <ReceiptLine label={t("Puntaje Relay", "Relay score")}>
            {score.score} {t("de 100", "of 100")}
          </ReceiptLine>
        )}
        <ReceiptLine label={t("Saldo", "Balance")}>{balance === null ? "—" : <Money value={balance} />}</ReceiptLine>
      </ReceiptLines>
      {result?.ok && (
        <p role="status" className="font-semibold text-pretty">
          <MoneyText>{msg(result.message)}</MoneyText>
        </p>
      )}
      {/* The foot is always there, and a payment that failed says so here, inside the paper: no message ever pushes the button. */}
      <ReceiptFoot
        stamp={
          mark && (
            <Stamp tone={MARK[mark].tone} fresh={mark === "paid" && !landed} onLanded={() => setLanded(true)}>
              {MARK[mark][lang]}
            </Stamp>
          )
        }
      >
        {result && !result.ok ? (
          <p role="alert" className="font-semibold text-bad text-pretty">
            <MoneyText>{msg(result.message)}</MoneyText>
          </p>
        ) : justPaid ? (
          result?.explorerUrl && (
            <DetailLink href={result.explorerUrl} external>
              {t("Ver detalles", "See details")}
            </DetailLink>
          )
        ) : shop.overdue ? (
          <p className="font-semibold text-ink text-balance">{t("Pague su deuda para reactivarlo.", "Pay your debt to turn it back on.")}</p>
        ) : owes ? (
          <p>{t("Sin intereses", "No interest")}</p>
        ) : hasCredit ? (
          <p className="font-semibold text-ok">{t("No tiene deudas pendientes.", "You have no debts to pay.")}</p>
        ) : (
          <p className="text-pretty">{t("Su tienda no tiene crédito por ahora.", "Your shop doesn't have credit for now.")}</p>
        )}
      </ReceiptFoot>
    </Receipt>
  );

  return (
    <div className="contents" onPointerDownCapture={watch} onInputCapture={typed}>
      <p role="status" className="sr-only">
        {busy ? t("Procesando...", "Processing...") : ""}
      </p>
      {(busy || held) && <TapShield onTap={noteTap} />}
      <Split
        pin="facts"
        nav={
          <TopNav back="/" backLabel={t("Inicio", "Home")}>
            {failed && (
              // In the row that is always there, so a patchy connection never pushes the button down.
              <p role="alert" className="max-w-[60%] text-right text-label leading-tight font-semibold text-bad text-balance">
                {t("No se pudo cargar. Reintentando...", "Couldn't load. Trying again...")}
              </p>
            )}
          </TopNav>
        }
        facts={<div id="estado-de-cuenta">{slip}</div>}
        actions={
          <>
            <div ref={payPlace} className="empty:hidden">
              {owes || busy ? (
                <Button
                  onClick={(event) => {
                    if (!stray(event) && !justMoved()) void payDebt();
                  }}
                  busy={busy}
                  disabled={held}
                  arriving={arriving}
                  hint={
                    <>
                      <Money value={owes ? shop.creditOwed : (paid?.amount ?? 0)} /> {inDollars}
                    </>
                  }
                >
                  {t("Pagar deuda", "Pay debt")}
                </Button>
              ) : (
                justPaid && (
                  // Stays where the button was, the same size, so a repeat tap lands on nothing instead of on an invoice row.
                  <Held
                    hint={
                      <>
                        <Money value={paid.amount} /> {inDollars}
                      </>
                    }
                  >
                    {t("Deuda pagada", "Debt paid")}
                  </Held>
                )
              )}
            </div>
            <InvoicesToPay unpaid={unpaid} now={now} />
            <AccountSections shop={shop} suppliers={suppliers} score={score} now={now} />
          </>
        }
      />
    </div>
  );
}
