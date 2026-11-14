"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { ActionLink, ActionList, ActionRow, Button, Held } from "@/components/kit/button";
import { Split, TopNav } from "@/components/kit/layout";
import { Manifest, ManifestRow, StopSlip } from "@/components/kit/manifest";
import { Money, MoneyText, moneyWidth } from "@/components/kit/money";
import { Paper, ReceiptLine, ReceiptLines, ReceiptRule } from "@/components/kit/paper";
import { Stamp, type StampTone } from "@/components/kit/stamp";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { ShopInvite } from "@/components/shop-invite";
import { ARRIVE_MS, HOLD_MS, TapShield, useQuietOnArrival, useSameSpotGuard, useTapShield } from "@/components/tap-shield";
import { claimCash, getDrivers, getInvoiceNotes, getInvoices, getRouteInvites, getShop } from "@/lib/api";
import { formatAmount, formatDay, isPastDue } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { leftToPay, methodLabel } from "@/lib/labels";
import { SAME_SPOT_MS, SAME_SPOT_PX, type Tap } from "@/lib/taps";
import type { Invoice, Receipt as Outcome, Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

/** Where the QR sends the shop. Local and preview builds have no NEXT_PUBLIC_SITE_URL. */
function invoiceUrl(invoiceId: number) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  return `${siteUrl}/tienda/${invoiceId}`;
}

/** The open stop is named in the address (?parada=1001), so the phone's Back button returns to the sheet. */
const STOP = "parada";

/** One line of the sheet. The number is the stop's place on the route and stays with it when it is paid. */
type Stop = { invoice: Invoice; number: number; name: string; left: number; paid: boolean };

type Words = (es: string, en: string) => string;

/** The stamp on a stop, or none while there is nothing to say: an unstamped line is a stop still to visit. */
function stopMark(stop: Stop, now: number, t: Words): { tone: StampTone; text: string } | null {
  const { invoice } = stop;
  if (stop.paid) return invoice.method === "credit" ? { tone: "credit", text: t("En crédito", "On credit") } : { tone: "ok", text: t("Pagada", "Paid") };
  if (invoice.cashClaim !== undefined) return { tone: "warn", text: t("Por confirmar", "To confirm") };
  if (invoice.status === "part_paid") return { tone: "confirm", text: t("Parcial", "Part paid") };
  if (isPastDue(invoice.dueDate, now)) return { tone: "bad", text: t("Vencida", "Overdue") };
  return null;
}

/**
 * True for a beat each time `key` changes to something: a stop opens, or another one is picked. "Recibí efectivo"
 * comes on screen with the stop, maybe right where its row was tapped, so it stays inert for that beat.
 */
function useQuietOnOpen(key: string | null): boolean {
  const [state, setState] = useState<{ key: string | null; quiet: boolean }>({ key: null, quiet: false });
  if (state.key !== key) setState({ key, quiet: key !== null });
  useEffect(() => {
    if (!state.quiet) return;
    const timer = setTimeout(() => setState((now) => ({ ...now, quiet: false })), ARRIVE_MS);
    return () => clearTimeout(timer);
  }, [state]);
  return state.quiet;
}

/** The screen before its stops arrive, and when they can't be found. `data-gloves`: every target here is 56 px or more. */
export function RouteFrame({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <div className="contents" data-gloves>
      <Split nav={<TopNav size="lg" back="/" backLabel={t("Inicio", "Home")} />} facts={children} actions={null} />
    </div>
  );
}

export default function RouteScreen() {
  const { driverId } = useParams<{ driverId: string }>();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data, failed, stale, reload } = usePolling(`route-${driverId}`, async () => {
    const [drivers, invoices] = await Promise.all([getDrivers(), getInvoices()]);
    const stops = invoices.filter((i) => i.driverId === driverId);
    const shopIds = [...new Set(stops.map((i) => i.shopId))];
    const [shops, invites, notes] = await Promise.all([
      Promise.all(shopIds.map(getShop)).then((list) => list.filter((s): s is Shop => s !== null)),
      getRouteInvites(driverId, shopIds),
      getInvoiceNotes(stops.filter((i) => i.status !== "paid").map((i) => i.id)),
    ]);
    return { driver: drivers.find((d) => d.id === driverId) ?? null, stops, shops, invites, notes, now: Date.now() };
  });
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  // After "Recibí efectivo" the button is gone: taps stay blocked until they stop.
  const [held, setHeld] = useState(false);
  const [outcome, setOutcome] = useState<{ invoiceId: number; receipt: Outcome } | null>(null);
  const [inviting, setInviting] = useState<number | null>(null);
  // The stop on show stays on show: a payment that arrives never swaps another stop, and its button, under the thumb.
  const [kept, setKept] = useState<{ route: string; id: number | null } | null>(null);
  const [armed, setArmed] = useState<number | null>(null); // the stop on show was seen unpaid: its stamp may land
  const [landed, setLanded] = useState<number | null>(null); // and it has; don't replay it
  const pushed = useRef(false); // the open stop is one step of history above the sheet
  const moved = useRef(false); // a tap just opened a stop
  const shifted = useRef(0); // when a panel last opened or closed under the button
  const lastStray = useRef<Tap | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const { noteTap, settle } = useTapShield();
  const { watch, typed, stray } = useSameSpotGuard();
  const { lang, t, msg } = useT();

  const stops: Stop[] = (data?.stops ?? []).map((invoice, index) => ({
    invoice,
    number: index + 1,
    name: data?.shops.find((s) => s.id === invoice.shopId)?.name ?? invoice.shopId,
    left: leftToPay(invoice),
    paid: invoice.status === "paid",
  }));
  const pending = stops.filter((stop) => !stop.paid);
  const done = stops.filter((stop) => stop.paid);
  const next = pending[0] ?? null;

  const wanted = Number(params.get(STOP));
  const openId = stops.find((stop) => stop.invoice.id === wanted)?.invoice.id ?? null;
  if (data?.driver) {
    // With no stop open, the one beside the sheet (tablet, phone held sideways) is the next stop as it was
    // when the route loaded, then whichever was opened last.
    if (kept?.route !== driverId) setKept({ route: driverId, id: openId ?? next?.invoice.id ?? stops[0]?.invoice.id ?? null });
    else if (openId !== null && kept.id !== openId) setKept({ route: driverId, id: openId });
  }
  const shown = stops.find((stop) => stop.invoice.id === (openId ?? (kept?.route === driverId ? kept.id : null))) ?? null;
  const shownId = shown?.invoice.id ?? null;
  if (shown && !shown.paid && armed !== shown.invoice.id) setArmed(shown.invoice.id);

  const canClaim = shown !== null && !shown.paid && shown.invoice.cashClaim === undefined;
  // "Recibí efectivo" waits for today's numbers, then one beat more; and one beat each time a stop opens.
  const arrivingData = useQuietOnArrival(data !== undefined && !stale);
  const arrivingStop = useQuietOnOpen(canClaim ? `${openId ?? "sheet"}:${shownId}` : null);

  // A stop opened by a tap. On a phone it takes the whole screen (the sheet is hidden), so it starts at the
  // top; the keyboard and screen readers move to its name.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    if (sheet.current && sheet.current.offsetParent === null) window.scrollTo(0, 0);
    head.current?.focus({ preventScroll: true });
  }, [openId, shownId]);

  const hrefFor = (id: number | null) => {
    const query = new URLSearchParams(params.toString());
    if (id === null) query.delete(STOP);
    else query.set(STOP, String(id));
    const text = query.toString();
    return text ? `${pathname}?${text}` : pathname;
  };
  // With a modifier key the link opens in a new tab, as links do.
  const plain = (event: MouseEvent) => !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

  /** Opens a stop without leaving the page, so it is instant on a patchy connection and the data stays. */
  function go(id: number) {
    if (id === openId) return;
    moved.current = true;
    setInviting(null);
    setOutcome(null);
    if (openId === null) {
      pushed.current = true;
      window.history.pushState(null, "", hrefFor(id));
    } else {
      window.history.replaceState(null, "", hrefFor(id)); // from stop to stop: Back still returns to the sheet
    }
  }

  function openStop(event: MouseEvent<HTMLAnchorElement>, id: number) {
    if (!plain(event)) return;
    event.preventDefault();
    go(id);
  }

  function backToSheet(event: MouseEvent<HTMLAnchorElement>) {
    if (!plain(event)) return;
    event.preventDefault();
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", hrefFor(null));
    }
  }

  /**
   * Was this tap on "Recibí efectivo" meant for something else? useSameSpotGuard lets a second tap on the same
   * button through, because the shield takes it. Here the first one started nothing, so taps that keep landing
   * where a stray one landed are stray too, until they pause; and so is a tap in the beat after a panel moved.
   */
  function strayTap(event: MouseEvent<HTMLElement>): boolean {
    if (event.detail === 0) return false; // the keyboard
    const here: Tap = { x: event.clientX, y: event.clientY, at: Date.now() };
    const last = lastStray.current;
    const again = last !== null && here.at - last.at <= SAME_SPOT_MS && Math.hypot(here.x - last.x, here.y - last.y) <= SAME_SPOT_PX;
    const isStray = stray(event) || again || here.at - shifted.current < ARRIVE_MS;
    lastStray.current = isStray ? here : null;
    return isStray;
  }

  async function receivedCash(invoiceId: number, amount: number) {
    if (running.current) return; // two taps in the same instant, before the screen has redrawn: one record
    running.current = true;
    setBusy(true);
    setOutcome(null);
    const receipt = await claimCash(invoiceId, amount);
    if (receipt.ok) await reload(); // the button gives way to "Efectivo registrado" with the new numbers
    setOutcome({ invoiceId, receipt });
    // The button is gone, or an error has appeared: hold everything until the taps have stopped, so taps
    // repeated every second or two can't open the invitation or anything else.
    setHeld(true);
    setBusy(false);
    await settle(HOLD_MS);
    setHeld(false);
    running.current = false;
  }

  if (!data) return <RouteFrame>{failed ? <Failure size="lg" onRetry={reload} /> : <Loading torn={false} lines={5} />}</RouteFrame>;

  const { driver, now } = data;
  if (!driver) {
    return (
      <RouteFrame>
        <Empty action={<ActionLink size="lg" href="/" title={t("Volver al inicio", "Back to the start")} />}>
          {t("No encontramos a ese motorista.", "We couldn't find that driver.")}
        </Empty>
      </RouteFrame>
    );
  }

  const invoiceWord = t("Factura", "Invoice");
  const toCollect = Math.round(pending.reduce((sum, stop) => sum + stop.left, 0) * 100) / 100;
  const locked = busy || held;
  const failure = outcome !== null && outcome.invoiceId === shownId && !outcome.receipt.ok ? msg(outcome.receipt.message) : null;

  const row = (stop: Stop, pinned: boolean) => {
    const { invoice } = stop;
    const mark = stopMark(stop, now, t);
    const amount = stop.paid ? invoice.amount : stop.left;
    return (
      <ManifestRow
        key={invoice.id}
        number={stop.number}
        name={stop.name}
        detail={`${invoiceWord} ${invoice.id}`}
        amount={<Money value={amount} />}
        amountChars={moneyWidth(amount)}
        stamp={
          mark && (
            <Stamp small tone={mark.tone}>
              {mark.text}
            </Stamp>
          )
        }
        label={pinned ? t("Siguiente parada", "Next stop") : undefined}
        href={hrefFor(invoice.id)}
        onOpen={(event) => openStop(event, invoice.id)}
        openLabel={`${pinned ? `${t("Siguiente parada", "Next stop")}. ` : ""}${t("Abrir parada", "Open stop")} ${stop.number}: ${stop.name}, ${formatAmount(amount)}, ${invoiceWord.toLowerCase()} ${invoice.id}${mark ? `, ${mark.text.toLowerCase()}` : ""}`}
        next={pinned}
        done={stop.paid}
        current={shownId === invoice.id}
      />
    );
  };

  // ---------- the sheet: every stop, the next one first, the paid ones last ----------

  const theSheet = (
    <div ref={sheet} className={`flex-col gap-3 ${openId === null ? "flex" : "hidden @min-[40rem]/split:flex"}`}>
      <Paper className="flex flex-col gap-2 px-4 py-3">
        <header className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h1 className="text-lead font-bold uppercase tracking-[0.06em]">{t("Hoja de ruta", "Route sheet")}</h1>
          <p className="font-mono text-label font-medium uppercase tracking-[0.04em] text-muted">
            {driver.name} · {formatDay(new Date(now).toISOString(), lang)}
          </p>
        </header>
        <ReceiptRule />
        <ReceiptLines>
          <ReceiptLine label={t(`Por cobrar (${pending.length} de ${stops.length})`, `To collect (${pending.length} of ${stops.length})`)} className="sideways:hidden">
            <Money value={toCollect} />
          </ReceiptLine>
          <ReceiptLine label={t("Efectivo en mano", "Cash on hand")} strong>
            <Money value={driver.cashHeld} />
          </ReceiptLine>
        </ReceiptLines>
      </Paper>

      {stops.length === 0 ? (
        <Empty action={<ActionLink size="lg" href="/" title={t("Volver al inicio", "Back to the start")} />}>{t("Hoy no tiene paradas.", "You have no stops today.")}</Empty>
      ) : next ? (
        <Manifest label={t("Paradas por cobrar", "Stops to collect")}>{pending.map((stop, index) => row(stop, index === 0))}</Manifest>
      ) : (
        <Paper className="flex min-h-24 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4">
          <p className="text-lead">{t("No queda nada por cobrar.", "Nothing left to collect.")}</p>
          <Stamp tone="ok" className="mr-2 ml-auto">
            {t("Ruta completa", "Route complete")}
          </Stamp>
        </Paper>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mt-1 border-b border-counter-rule pb-1 text-label font-semibold uppercase tracking-[0.1em] text-muted">
            {t("Completadas", "Completed")} ({done.length})
          </h2>
          <Manifest label={t("Paradas completadas", "Completed stops")}>{done.map((stop) => row(stop, false))}</Manifest>
        </>
      )}
    </div>
  );

  // ---------- the open stop: its slip with the code, then the actions ----------

  let theStop: ReactNode = null;
  if (shown) {
    const { invoice } = shown;
    const claim = invoice.cashClaim;
    const mark = stopMark(shown, now, t);
    const inviteCode: string | undefined = data.invites.codes[invoice.shopId];
    const explorerUrl = outcome !== null && outcome.invoiceId === invoice.id && outcome.receipt.ok ? outcome.receipt.explorerUrl : undefined;
    const after = shown.paid ? next : null;
    const noteLines = (data.notes[invoice.id] ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    theStop = (
      <div className={openId === null ? "hidden @min-[40rem]/split:contents" : "contents"}>
        {/* On a phone the sheet above is hidden while a stop is open: take back the gap it leaves. */}
        <div className={openId === null ? "" : "-mt-4 @min-[40rem]/split:mt-0"}>
          <StopSlip
            label={`${t("Parada", "Stop")} ${shown.number}: ${shown.name}`}
            number={shown.number}
            name={shown.name}
            headRef={head}
            value={shown.paid ? invoice.amount : shown.left}
            detail={`${invoiceWord} ${invoice.id}`}
            valueNote={
              invoice.status === "part_paid" && (
                <>
                  {t("resto de", "rest of")} <Money value={invoice.amount} />
                </>
              )
            }
            code={
              <QRCodeSVG
                value={invoiceUrl(invoice.id)}
                size={512}
                level="M"
                fgColor="currentColor"
                bgColor="transparent"
                title={`${invoiceWord} ${invoice.id}`}
                className="block h-auto w-full"
              />
            }
            stamp={
              shown.paid &&
              mark && (
                <Stamp
                  tone={mark.tone}
                  fresh={armed === invoice.id && landed !== invoice.id}
                  onLanded={() => setLanded(invoice.id)}
                  className="text-[clamp(0.875rem,10cqi,2rem)]!"
                >
                  {mark.text}
                </Stamp>
              )
            }
          >
            {failure ? (
              <p role="alert" className="font-semibold text-bad text-balance">
                <MoneyText>{failure}</MoneyText>
              </p>
            ) : shown.paid ? (
              <p className="font-mono font-medium uppercase tracking-[0.04em] text-muted">
                {t("Pagada", "Paid")}
                {invoice.method ? ` · ${methodLabel(invoice.method, lang)}` : ""}
              </p>
            ) : (
              <p className="text-muted text-balance">
                {claim !== undefined
                  ? t("La tienda escanea este código y toca «Confirmo».", "The shop scans this code and taps “Confirm”.")
                  : t("La tienda escanea este código para pagar.", "The shop scans this code to pay.")}
              </p>
            )}
          </StopSlip>
        </div>

        {/* One box, always the same height: the button, or the words that hold its place once it has done its work. */}
        <div data-cash className="flex flex-col">
          {shown.paid ? (
            <Held size="lg" hint={t("No queda nada por cobrar", "Nothing left to collect")}>
              {t("Parada completa", "Stop complete")}
            </Held>
          ) : claim !== undefined ? (
            <Held
              size="lg"
              hint={
                <>
                  <Money value={claim} /> {t("por confirmar", "to confirm")}
                </>
              }
            >
              {t("Efectivo registrado", "Cash recorded")}
            </Held>
          ) : (
            <Button
              size="lg"
              onClick={(event) => {
                if (!strayTap(event)) void receivedCash(invoice.id, shown.left);
              }}
              busy={busy}
              disabled={locked || stale}
              arriving={arrivingData || arrivingStop}
              hint={
                stale ? (
                  t("Cargando...", "Loading...")
                ) : (
                  <>
                    <Money value={shown.left} /> {t("en efectivo", "in cash")}
                  </>
                )
              }
            >
              {t("Recibí efectivo", "I received cash")}
            </Button>
          )}
        </div>

        {(inviteCode || after || explorerUrl) && (
          <ActionList>
            {inviteCode && (
              <ActionRow
                size="lg"
                title={t("Invitar a Relay", "Invite to Relay")}
                open={inviting === invoice.id}
                onClick={() => {
                  shifted.current = Date.now(); // the panel can scroll the button to where this tap landed
                  setInviting(inviting === invoice.id ? null : invoice.id);
                }}
                disabled={locked}
              >
                <ShopInvite code={inviteCode} distributorName={data.invites.distributorName} size="lg" />
              </ActionRow>
            )}
            {after && (
              <ActionRow
                size="lg"
                title={t("Siguiente parada", "Next stop")}
                hint={`${after.number} · ${after.name}`}
                figure={<Money value={after.left} />}
                onClick={() => go(after.invoice.id)}
                disabled={locked}
              />
            )}
            {explorerUrl && <ActionLink size="lg" href={explorerUrl} external title={t("Ver detalles", "See details")} />}
          </ActionList>
        )}

        {noteLines.length > 0 && (
          <Paper className="flex flex-col gap-1.5 px-4 py-3">
            <h3 className="text-label font-bold uppercase tracking-[0.12em]">{t("En esta factura", "On this invoice")}</h3>
            <ul className="flex flex-col gap-1 font-mono text-base font-medium">
              {noteLines.map((line, index) => (
                <li key={index} className="wrap-anywhere">
                  {line}
                </li>
              ))}
            </ul>
          </Paper>
        )}
      </div>
    );
  }

  // In the row that is always there, so news never pushes a button down. Sideways the slip has no line
  // under its code, so what went wrong with "Recibí efectivo" is said here, ahead of a refresh that failed.
  const NEWS = "min-w-0 flex-1 text-right text-label leading-tight font-semibold text-bad text-balance";
  const news = (
    <>
      {failed && (
        <p role="alert" className={`${NEWS} ${failure ? "sideways:hidden" : ""}`}>
          {t("No se pudo cargar. Reintentando...", "Couldn't load. Trying again...")}
        </p>
      )}
      {failure && (
        <p role="alert" className={`hidden sideways:block ${NEWS}`}>
          <MoneyText>{failure}</MoneyText>
        </p>
      )}
    </>
  );
  const home = (
    <TopNav size="lg" back="/" backLabel={t("Inicio", "Home")}>
      {news}
    </TopNav>
  );

  return (
    <div className="contents" data-gloves onPointerDownCapture={watch} onInputCapture={typed}>
      <p role="status" className="sr-only">
        {busy ? t("Procesando...", "Processing...") : outcome?.receipt.ok ? msg(outcome.receipt.message) : ""}
      </p>
      {locked && <TapShield onTap={noteTap} />}
      <Split
        nav={
          openId === null ? (
            home
          ) : (
            <>
              {/* On a phone the open stop is a screen of its own: the way back is to the sheet. */}
              <div className="@min-[40rem]/split:hidden">
                <TopNav size="lg" back={hrefFor(null)} backLabel={t("Hoja de ruta", "Route sheet")} onBack={backToSheet}>
                  {news}
                </TopNav>
              </div>
              <div className="hidden @min-[40rem]/split:block">{home}</div>
            </>
          )
        }
        facts={theSheet}
        actions={theStop}
      />
    </div>
  );
}
