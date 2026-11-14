"use client";

import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ActionLink, ActionList, ActionRow, Button, DetailLink, Held } from "@/components/kit/button";
import { MoneyField } from "@/components/kit/field";
import { NavLink, Split, TopNav } from "@/components/kit/layout";
import { Money, MoneyText } from "@/components/kit/money";
import { Paper, Receipt, ReceiptFold, ReceiptFoot, ReceiptHeader, ReceiptLine, ReceiptLines, ReceiptRule, ReceiptTotal } from "@/components/kit/paper";
import { Stamp } from "@/components/kit/stamp";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { ARRIVE_MS, HOLD_MS, QUIET_MS, TapShield, useQuietOnArrival, useSameSpotGuard, useTapShield } from "@/components/tap-shield";
import { confirmCash, getDrivers, getInvoice, getInvoiceSource, getShop, payLater, payNow } from "@/lib/api";
import { dueOn, formatDay, isPastDue, pricedLine } from "@/lib/format";
import { type Lang, useT } from "@/lib/i18n";
import { leftToPay, methodLabel, parseAmount, partPayError } from "@/lib/labels";
import type { Invoice, Receipt as Outcome, Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

type Action = "now" | "part" | "later" | "cash";
type Panel = "later" | "part" | "cash";
type Source = { distributorName: string; note: string | null };

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

/**
 * True for a beat each time a different panel opens. Opening one panel closes another, so the rows move,
 * and the new panel's button can land under the thumb: it stays inert for that beat.
 */
function useQuietOnOpen(panel: Panel | null): boolean {
  const [state, setState] = useState<{ panel: Panel | null; quiet: boolean }>({ panel: null, quiet: false });
  if (state.panel !== panel) setState({ panel, quiet: panel !== null });
  useEffect(() => {
    if (!state.quiet) return;
    const timer = setTimeout(() => setState((now) => ({ ...now, quiet: false })), ARRIVE_MS);
    return () => clearTimeout(timer);
  }, [state]);
  return state.quiet;
}

/** Why "Pagar en 7 días" is greyed out, or null if the shop can use it. */
function creditBlocked(shop: Shop | null, invoice: Invoice, t: (es: string, en: string) => string): string | null {
  if (!shop || shop.creditLimit <= 0) return t("Su tienda aún no tiene crédito", "Your shop doesn't have credit yet");
  if (shop.overdue) return t("Tiene un pago vencido", "You have an overdue payment");
  const owedAfter = Math.round((shop.creditOwed + leftToPay(invoice)) * 100);
  if (owedAfter > Math.round(shop.creditLimit * 100)) return t("Supera su límite de crédito", "It's over your credit limit");
  return null;
}

/** What the distributor wrote on the invoice (products or a note), one printed line each. */
function NoteLines({ lines }: { lines: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 font-mono text-base font-medium">
      {lines.map((line, i) => {
        const priced = pricedLine(line);
        return priced ? (
          <li key={i} className="flex items-end">
            <span className="min-w-0">{priced.name}</span>
            <span aria-hidden className="leader" />
            <Money value={priced.amount} className="shrink-0" />
          </li>
        ) : (
          <li key={i} className="wrap-anywhere">
            {line}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The shop's credit, beside the slip when there is room for it (tablet, laptop): what it may borrow,
 * what it owes and when. Facts, so paper. The Relay score stays on Mi cuenta: working it out needs
 * the whole payment history, a slow read that would hold up a payment tapped while it loads.
 */
function CreditFacts({ shop, lang }: { shop: Shop; lang: Lang }) {
  const { t } = useT();
  const available = Math.max(0, Math.round((shop.creditLimit - shop.creditOwed) * 100) / 100);
  return (
    <Paper className="hidden flex-col gap-2.5 px-4 py-4 @min-[40rem]/split:flex">
      <h2 className="flex items-center justify-between gap-3 text-label font-bold uppercase tracking-[0.12em]">
        {t("Su crédito", "Your credit")}
        {shop.overdue && (
          <Stamp small tone="bad">
            {t("Vencida", "Overdue")}
          </Stamp>
        )}
      </h2>
      {shop.creditLimit > 0 ? (
        <ReceiptLines>
          <ReceiptLine label={t("Límite", "Limit")}>
            <Money value={shop.creditLimit} />
          </ReceiptLine>
          <ReceiptLine label={t("Debe", "You owe")}>
            <Money value={shop.creditOwed} />
          </ReceiptLine>
          {shop.creditOwed > 0 && shop.creditDue && (
            <ReceiptLine label={shop.overdue ? t("Venció", "Was due") : t("Vence", "Due")}>{formatDay(shop.creditDue, lang)}</ReceiptLine>
          )}
          <ReceiptLine label={t("Disponible", "Available")} strong>
            <Money value={available} />
          </ReceiptLine>
        </ReceiptLines>
      ) : (
        <p className="text-muted">{t("Su tienda aún no tiene crédito.", "Your shop doesn't have credit yet.")}</p>
      )}
    </Paper>
  );
}

/** The screen before its numbers arrive, and when they can't be found. */
export function InvoiceFrame({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const { t } = useT();
  return (
    <Split
      nav={
        <TopNav back="/" backLabel={t("Inicio", "Home")}>
          {right}
        </TopNav>
      }
      facts={children}
      actions={null}
    />
  );
}

export default function InvoiceScreen() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const id = Number(invoiceId);
  // Who sent the invoice is asked once and arrives with the first numbers, so the slip is whole
  // when it prints and never grows a line under a thumb afterwards.
  const sourceOnce = useRef<{ id: number; found: Promise<Source | null> } | null>(null);
  const { data, failed, stale, reload } = usePolling(`invoice-${invoiceId}`, async () => {
    if (sourceOnce.current?.id !== id) sourceOnce.current = { id, found: getInvoiceSource(id).catch(() => null) };
    const [invoice, drivers, source] = await Promise.all([getInvoice(id), getDrivers(), sourceOnce.current.found]);
    const shop = invoice ? await getShop(invoice.shopId) : null;
    return { invoice, shop, drivers, source, now: Date.now() };
  });
  const [busy, setBusy] = useState<Action | null>(null);
  const running = useRef(false);
  // After a payment the screen has changed under the thumb: taps stay blocked until they stop.
  const [held, setHeld] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // Which option is unfolded (one at a time). undefined = the shop hasn't picked yet,
  // so a cash amount the driver registered opens its own panel.
  const [choice, setChoice] = useState<Panel | null | undefined>(undefined);
  const [partText, setPartText] = useState("");
  const [partError, setPartError] = useState<string | null>(null);
  const [landed, setLanded] = useState(false); // the stamp has played; don't replay it on Back
  const { noteTap, settle } = useTapShield();
  const { watch, typed, stray } = useSameSpotGuard();
  const { lang, t, msg } = useT();

  const invoice = data?.invoice ?? null;
  const shop = data?.shop ?? null;
  const isPaid = invoice?.status === "paid";
  const hasClaim = invoice !== null && invoice.cashClaim !== undefined;
  const blocked = invoice ? creditBlocked(shop, invoice, t) : null;

  let panel: Panel | null = !invoice || isPaid ? null : choice === undefined ? (hasClaim ? "cash" : null) : choice;
  if (panel === "later" && blocked !== null) panel = null;
  // A panel with its own button takes over from "Pagar ahora", so there is one live pay button at a time.
  // "Pagar ahora" keeps its place, greyed out: nothing below it moves.
  const panelHasButton = panel === "later" || panel === "part" || (panel === "cash" && hasClaim);

  const claimJustChanged = useQuietAfterChange(invoice ? hasClaim : null);
  // The pay buttons wait for today's numbers, then one beat more: a double tap on the screen before can't pay.
  const arriving = useQuietOnArrival(invoice !== null && !stale);
  // The same beat when "Pagar ahora" comes back after a panel closes, and for a panel's own button when it opens.
  const payNowArriving = useQuietOnArrival(invoice !== null && !stale && !panelHasButton);
  const panelArriving = useQuietOnOpen(panelHasButton ? panel : null);

  async function run(action: Action, write: () => Promise<Outcome>) {
    if (running.current) return; // two taps in the same instant, before the screen has redrawn: one payment
    running.current = true;
    setBusy(action);
    setOutcome(null);
    const result = await write();
    if (result.ok) {
      await reload(); // show the stamp and the new numbers together
      setChoice(undefined);
      setPartText("");
    }
    setOutcome(result);
    // The screen is not what it was: the buttons are gone or have moved (a panel closed, the slip grew a
    // line, a message pushed them down), and a link may sit where one of them was. Hold everything until
    // the taps have stopped, so taps repeated every second or two can't pay the rest or open anything.
    setHeld(true);
    setBusy(null);
    await settle(HOLD_MS);
    setHeld(false);
    running.current = false;
  }

  if (!data) return <InvoiceFrame>{failed ? <Failure onRetry={reload} /> : <Loading />}</InvoiceFrame>;
  if (!invoice) {
    return (
      <InvoiceFrame>
        <Empty action={<ActionLink href="/" title={t("Volver al inicio", "Back to the start")} />}>
          {t(`No encontramos la factura ${invoiceId}.`, `We couldn't find invoice ${invoiceId}.`)}
        </Empty>
      </InvoiceFrame>
    );
  }

  const { drivers, source, now } = data;
  const left = leftToPay(invoice);
  const partPaid = invoice.status === "part_paid";
  const pastDue = !isPaid && isPastDue(invoice.dueDate, now);
  const driver = drivers.find((d) => d.id === invoice.driverId);
  const noteLines = (source?.note ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const settled = isPaid && (busy !== null || held || outcome?.ok === true); // paid on this visit: let the stamp land
  const locked = busy !== null || held || claimJustChanged;
  const unready = stale || arriving;
  const partAmount = parseAmount(partText);
  const partOk = partAmount !== null && partPayError(partText, left, invoice.cashClaim) === null;
  const toggle = (next: Panel) => setChoice(panel === next ? null : next);
  const inDollars = t("con dólares digitales", "in digital dollars");

  const who = (
    <ReceiptLines>
      <ReceiptLine label={t("Cliente", "Customer")} shorten>
        {shop?.name ?? t("Tienda", "Shop")}
      </ReceiptLine>
      {driver && (
        // On a short phone a part-paid slip has one line more ("Pagado"), so this one steps aside for the pay options.
        <ReceiptLine label={t("Motorista", "Driver")} shorten className={partPaid ? "short:hidden" : ""}>
          {driver.name}
        </ReceiptLine>
      )}
    </ReceiptLines>
  );

  const slip = (
    <Receipt printIn>
      <ReceiptHeader as="h1" from={source?.distributorName || t("Factura", "Invoice")} number={`${source?.distributorName ? t("Factura n.º", "Invoice no.") : t("N.º", "No.")} ${invoice.id}`} />
      <ReceiptRule />
      {noteLines.length > 0 ? (
        <ReceiptFold count={noteLines.length} label={noteLines.length === 1 ? t("Ver nota", "See note") : undefined}>
          <div className="flex flex-col gap-1.5">
            {who}
            <NoteLines lines={noteLines} />
          </div>
        </ReceiptFold>
      ) : (
        who
      )}
      {partPaid && (
        <ReceiptLines>
          <ReceiptLine label={t("Pagado", "Paid")} strong>
            <Money value={invoice.paid} /> {t("de", "of")} <Money value={invoice.amount} />
          </ReceiptLine>
        </ReceiptLines>
      )}
      <ReceiptTotal
        label={partPaid ? t("Falta", "Left to pay") : "Total"}
        value={isPaid ? invoice.amount : left}
        note={
          isPaid ? (
            `${t("Pagada", "Paid")}${invoice.method ? ` · ${methodLabel(invoice.method, lang)}` : ""}`
          ) : pastDue ? (
            <span className="inline-flex items-center gap-2">
              <Stamp small tone="bad">
                {t("Vencida", "Overdue")}
              </Stamp>
              {formatDay(invoice.dueDate, lang)}
            </span>
          ) : (
            dueOn(invoice.dueDate, now, lang)
          )
        }
      />
      {outcome?.ok && (
        <p role="status" className="font-semibold text-pretty">
          <MoneyText>{msg(outcome.message)}</MoneyText>
        </p>
      )}
      {(isPaid || outcome?.explorerUrl) && (
        <ReceiptFoot
          stamp={
            isPaid && (
              <Stamp tone={invoice.method === "credit" ? "credit" : "ok"} fresh={settled && !landed} onLanded={() => setLanded(true)}>
                {invoice.method === "credit" ? t("En crédito", "On credit") : t("Pagada", "Paid")}
              </Stamp>
            )
          }
        >
          {outcome?.ok && outcome.explorerUrl && (
            <DetailLink href={outcome.explorerUrl} external>
              {t("Ver detalles", "See details")}
            </DetailLink>
          )}
        </ReceiptFoot>
      )}
    </Receipt>
  );

  const actions = isPaid ? (
    <>
      <Held hint={t("No queda nada por pagar", "Nothing left to pay")}>{t("Factura pagada", "Invoice paid")}</Held>
      {shop && (
        <ActionList>
          <ActionLink
            href={`/tienda/cuenta/${shop.id}`}
            title={t("Mi cuenta", "My account")}
            hint={shop.creditOwed > 0 ? t("Su crédito y lo que debe", "Your credit and what you owe") : t("Su crédito y sus pagos", "Your credit and your payments")}
            figure={shop.creditOwed > 0 ? <Money value={shop.creditOwed} /> : undefined}
          />
        </ActionList>
      )}
    </>
  ) : (
    <>
      {outcome && !outcome.ok && (
        <p role="alert" className="rounded-paper bg-paper px-4 py-3 font-semibold text-bad text-pretty">
          <MoneyText>{msg(outcome.message)}</MoneyText>
        </p>
      )}
      <Button
        onClick={(event) => {
          if (!stray(event)) void run("now", () => payNow(id));
        }}
        busy={busy === "now"}
        disabled={locked || stale || panelHasButton}
        arriving={payNowArriving}
        hint={
          <>
            <Money value={left} /> {inDollars}
          </>
        }
      >
        {t("Pagar ahora", "Pay now")}
      </Button>
      <ActionList>
        <ActionRow
          title={t("Pagar en 7 días", "Pay in 7 days")}
          hint={blocked ?? t("Sin intereses", "No interest")}
          open={blocked === null ? panel === "later" : undefined}
          onClick={() => toggle("later")}
          disabled={locked || blocked !== null}
        >
          <p className="text-lead">
            {t("Hoy no paga nada. Paga ", "You pay nothing today. You pay ")}
            <Money value={left} className="font-semibold" />
            {t(" en 7 días.", " in 7 days.")}
          </p>
          <Button
            onClick={(event) => {
              if (!stray(event)) void run("later", () => payLater(id));
            }}
            busy={busy === "later"}
            disabled={locked || unready}
            arriving={panelArriving}
          >
            {t("Confirmo", "Confirm")}
          </Button>
        </ActionRow>
        <ActionRow
          title={t("Pagué en efectivo", "I paid in cash")}
          hint={hasClaim ? t("Efectivo por confirmar", "Cash to confirm") : undefined}
          figure={invoice.cashClaim !== undefined ? <Money value={invoice.cashClaim} /> : undefined}
          open={panel === "cash"}
          onClick={() => toggle("cash")}
          disabled={locked}
        >
          {invoice.cashClaim !== undefined ? (
            <>
              <p className="text-lead">
                {driver?.name ?? t("El motorista", "The driver")} {t("registró", "registered")} <Money value={invoice.cashClaim} className="font-semibold" />{" "}
                {t("en efectivo.", "in cash.")}
              </p>
              <Button
                onClick={(event) => {
                  if (!stray(event)) void run("cash", () => confirmCash(id, invoice.cashClaim ?? 0));
                }}
                busy={busy === "cash"}
                disabled={locked || unready}
                arriving={panelArriving}
              >
                {t("Confirmo", "Confirm")}
              </Button>
            </>
          ) : (
            <p className="text-lead">{t("El motorista aún no registró el efectivo.", "The driver hasn't registered the cash yet.")}</p>
          )}
        </ActionRow>
        <ActionRow title={t("Pagar otro monto", "Pay another amount")} open={panel === "part"} onClick={() => toggle("part")} disabled={locked}>
          {/* Above the blank, so the blank and its button stay together when the keyboard comes up. */}
          <p className="text-label text-muted text-pretty">
            {t(
              "Si paga la mitad o más ahora, la comisión baja y su límite puede subir con solo $10 a crédito.",
              "If you pay half or more now, the fee is lower and your limit can grow with just $10 on credit.",
            )}
          </p>
          <MoneyField
            label={t("¿Cuánto paga ahora?", "How much are you paying now?")}
            hint={
              <>
                {t("Falta", "Left to pay:")} <Money value={left} />
              </>
            }
            error={partError ? <MoneyText>{msg(partError)}</MoneyText> : undefined}
            placeholder="0.00"
            autoFocus
            value={partText}
            onChange={(e) => {
              setPartText(e.target.value);
              setPartError(null);
            }}
          />
          <Button
            onClick={(event) => {
              if (stray(event)) return;
              const error = partPayError(partText, left, invoice.cashClaim);
              if (error || partAmount === null) return setPartError(error ?? "Monto inválido.");
              void run("part", () => payNow(id, partAmount));
            }}
            busy={busy === "part"}
            disabled={locked || unready || panelArriving || partText.trim() === ""}
            hint={
              partOk ? (
                <>
                  <Money value={partAmount} /> {inDollars}
                </>
              ) : (
                t("Con dólares digitales", "In digital dollars")
              )
            }
          >
            {t("Pagar este monto", "Pay this amount")}
          </Button>
        </ActionRow>
      </ActionList>
    </>
  );

  return (
    <div className="contents" onPointerDownCapture={watch} onInputCapture={typed}>
      <p role="status" className="sr-only">
        {busy !== null ? t("Procesando...", "Processing...") : ""}
      </p>
      {(busy !== null || held) && <TapShield onTap={noteTap} />}
      <Split
        nav={
          <TopNav back="/" backLabel={t("Inicio", "Home")}>
            {failed ? (
              // In the row that is always there, so a patchy connection never pushes the pay buttons down.
              <p role="alert" className="max-w-[60%] text-right text-label leading-tight font-semibold text-bad text-balance">
                {t("No se pudo cargar. Reintentando...", "Couldn't load. Trying again...")}
              </p>
            ) : (
              shop && !isPaid && <NavLink href={`/tienda/cuenta/${shop.id}`}>{t("Mi cuenta", "My account")}</NavLink>
            )}
          </TopNav>
        }
        facts={slip}
        actions={
          <>
            {actions}
            {shop && <CreditFacts shop={shop} lang={lang} />}
          </>
        }
      />
    </div>
  );
}
