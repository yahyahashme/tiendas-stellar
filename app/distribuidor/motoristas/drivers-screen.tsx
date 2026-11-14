"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { getMyDrivers, type InviteView, inviteDriverAction, type MyDriver, removeDriverAction } from "@/app/driver-actions";
import { DistributorShell, NewInvoiceAction } from "@/components/distributor-shell";
import { ActionLink, ActionRow, Button, ButtonLink, TextButton } from "@/components/kit/button";
import { Field } from "@/components/kit/field";
import { Ledger, LedgerCard, type LedgerColumn, RowAction, RowButton } from "@/components/kit/ledger";
import { Money } from "@/components/kit/money";
import { Stamp } from "@/components/kit/stamp";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { HOLD_MS, TapShield, useMovedGuard, useSecondTap, useTapShield } from "@/components/tap-shield";
import { formatPhone } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { chatLink } from "@/lib/whatsapp";

const inviteUrl = (token: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window === "undefined" ? "" : window.location.origin)}/invitacion/${token}`;

/** The invite message goes to a Salvadoran driver, so it's always Spanish. */
const inviteMessage = (name: string, distributor: string, url: string) =>
  `Hola ${name}, ${distributor} lo invita a Relay para su ruta. Cree su cuenta aquí: ${url}`;

const HEADING = "text-lead leading-tight font-bold";
const SECTION = "flex scroll-mt-[calc(var(--band-h)+0.75rem)] flex-col gap-2";

/** Brings the invite into view when it appears (on a phone it can open below the screen). */
function reveal(panel: HTMLElement | null) {
  panel?.scrollIntoView({ block: "nearest" });
}

/** A pending invite: the link on paper, and under it the ways to send it. */
function InvitePanel({ invite, distributorName, onHide }: { invite: InviteView; distributorName: string; onHide: () => void }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(invite.token);
  let whatsapp: string | null = null;
  try {
    whatsapp = chatLink(invite.phone, inviteMessage(invite.name, distributorName, url));
  } catch {
    whatsapp = null;
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
    <section ref={reveal} aria-label={t(`Invitación para ${invite.name}`, `Invite for ${invite.name}`)} className="flex max-w-[48rem] scroll-mb-20 flex-col gap-2">
      <div className="flex flex-col gap-1 rounded-paper bg-paper px-4 py-3">
        <p>{t(`Invitación para ${invite.name}. Envíele este enlace:`, `Invite for ${invite.name}. Send them this link:`)}</p>
        <p className="font-mono font-medium break-all">{url}</p>
      </div>
      <div className="grid gap-2 @min-[40rem]:grid-cols-2">
        {whatsapp && (
          <ButtonLink external href={whatsapp}>
            {t("Enviar por WhatsApp", "Send on WhatsApp")}
          </ButtonLink>
        )}
        <ActionRow title={copied ? t("Copiado", "Copied") : t("Copiar enlace", "Copy link")} onClick={() => void copy()} />
      </div>
      <TextButton onClick={onHide}>{t("Ocultar enlace", "Hide link")}</TextButton>
    </section>
  );
}

/** The distributor's drivers (#131): invite by link, see who joined, remove. */
export default function DriversScreen() {
  const { t, msg } = useT();
  const [data, setData] = useState<{ distributorName: string; drivers: MyDriver[] } | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const inviting = useRef(false);
  const [error, setError] = useState<string | null>(null);
  // The invite on show: the one just made, or the one a row's "Ver enlace" asked for.
  const [shown, setShown] = useState<InviteView | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const secondTap = useSecondTap();
  const [removing, setRemoving] = useState<string | null>(null);
  const [held, setHeld] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const running = useRef(false);
  const { noteTap, settle } = useTapShield();
  // An invite opening or closing above the list moves every row: a tap on its way to one row must not land on the next.
  const { ref: listBlock, justMoved } = useMovedGuard<HTMLElement>();

  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => setData(await getMyDrivers()), []);
  useEffect(() => {
    let live = true;
    getMyDrivers().then(
      (found) => live && setData(found),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);
  async function retry() {
    setRetrying(true);
    try {
      await load();
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setRetrying(false);
  }

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (inviting.current) return;
    inviting.current = true;
    setBusy(true);
    setError(null);
    try {
      const reply = await inviteDriverAction(name, phone);
      if (reply.ok) {
        setShown(reply);
        setName("");
        setPhone("");
        await load();
      } else {
        setError(reply.message);
      }
    } catch {
      setError("No se pudo completar. Intente de nuevo.");
    }
    setBusy(false);
    inviting.current = false;
  }

  async function remove(driver: MyDriver) {
    if (running.current || justMoved()) return;
    if (confirming !== driver.id) {
      secondTap.asked();
      setConfirming(driver.id);
      setTimeout(() => setConfirming((c) => (c === driver.id ? null : c)), 4000);
      return;
    }
    // The second tap of a double tap is not a second thought: it has to come a beat after the first.
    if (secondTap.tooSoon()) return;
    running.current = true;
    setConfirming(null);
    setRemoving(driver.id);
    setRemoveError(null);
    try {
      const reply = await removeDriverAction(driver.id);
      if (!reply.ok) setRemoveError(reply.message);
      if (shown && (shown.token === driver.id || shown.token === driver.inviteToken)) setShown(null);
      await load();
    } catch {
      setRemoveError("No se pudo completar. Intente de nuevo.");
    }
    // The rows under the one removed have moved up: hold every tap until the taps have stopped.
    setHeld(true);
    setRemoving(null);
    await settle(HOLD_MS);
    setHeld(false);
    running.current = false;
  }

  const shell = (children: ReactNode, demo = false) => (
    <DistributorShell current="motoristas" name={data?.distributorName} demo={demo} action={demo ? undefined : (place) => <NewInvoiceAction place={place} />}>
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-bold">{t("Motoristas", "Drivers")}</h1>
        {children}
      </div>
    </DistributorShell>
  );

  if (data === undefined) return shell(failed ? <div className="max-w-[34rem]"><Failure onRetry={() => void retry()} busy={retrying} /></div> : <Loading lines={6} torn={false} />);
  if (data === null) {
    return shell(
      <div className="max-w-[34rem]">
        <Empty action={<ActionLink href="/distribuidor" title={t("Ir al panel", "Go to the dashboard")} />}>
          {t("Solo la distribuidora aprobada puede hacer esto.", "Only the approved distributor can do this.")}
        </Empty>
      </div>,
      true,
    );
  }

  const status = (driver: MyDriver) =>
    driver.status === "activo" ? (
      <Stamp small tone="ok">
        {t("Activo", "Active")}
      </Stamp>
    ) : (
      <Stamp small tone="confirm">
        {t("Invitado", "Invited")}
      </Stamp>
    );
  const invited = (driver: MyDriver) => driver.status === "invitado" && driver.inviteToken !== null && driver.phone !== null;
  const isShown = (driver: MyDriver) => shown !== null && shown.token === driver.inviteToken;
  const link = (driver: MyDriver) =>
    invited(driver) ? (
      <RowButton
        onClick={() => setShown(isShown(driver) ? null : { token: driver.inviteToken!, name: driver.name, phone: driver.phone! })}
        label={isShown(driver) ? t(`Ocultar enlace de ${driver.name}`, `Hide link for ${driver.name}`) : t(`Ver enlace de ${driver.name}`, `Show link for ${driver.name}`)}
      >
        {isShown(driver) ? t("Ocultar enlace", "Hide link") : t("Ver enlace", "Show link")}
      </RowButton>
    ) : (
      // As tall as the button, so every row of the table has one height.
      <span aria-hidden className="hidden h-11 @min-[40rem]:block" />
    );
  const cash = (driver: MyDriver) =>
    driver.status === "activo" ? (
      <Money value={driver.cashHeld} />
    ) : (
      <span className="font-sans text-muted">
        <span aria-hidden>—</span>
        <span className="sr-only">{t("todavía no tiene cuenta", "no account yet")}</span>
      </span>
    );
  const columns: LedgerColumn<MyDriver>[] = [
    { id: "driver", header: t("Motorista", "Driver"), grow: true, cell: (d) => d.name, title: (d) => d.name },
    { id: "phone", header: t("Teléfono", "Phone"), mono: true, secondary: 54, cell: (d) => (d.phone ? formatPhone(d.phone) : "—") },
    { id: "status", header: t("Estado", "Status"), cell: status },
    { id: "cash", header: t("Efectivo en mano", "Cash on hand"), figure: true, cell: cash },
    // One width whether it holds the button or nothing, so the columns never move sideways.
    { id: "link", header: <span className="sr-only">{t("Enlace", "Link")}</span>, end: true, className: "w-40 min-w-40 py-1", cell: link },
  ];

  return shell(
    <>
      {(removing !== null || held) && <TapShield onTap={noteTap} />}

      <section className={SECTION}>
        <h2 className={HEADING}>{t("Agregar motorista", "Add a driver")}</h2>
        <form onSubmit={invite} className="grid max-w-[48rem] grid-cols-1 gap-x-4 gap-y-3 @min-[44rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Field label={t("Nombre", "Name")} autoComplete="off" required value={name} onChange={(e) => setName(e.target.value)} />
          <Field label={t("Teléfono", "Phone")} inputMode="tel" autoComplete="off" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          {/* One place for the news, always there: above the button on a phone, under the row of blanks with more room. */}
          <p role={error ? "alert" : "status"} className={`min-h-[2lh] text-pretty @min-[44rem]:col-span-3 @min-[44rem]:row-start-2 @min-[44rem]:min-h-[1lh] ${error ? "font-semibold text-bad" : "text-muted"}`}>
            {error ? msg(error) : t("Teléfono de El Salvador (8 dígitos). Le damos un enlace para enviárselo.", "A Salvadoran phone number (8 digits). You get a link to send to them.")}
          </p>
          <div className="@min-[44rem]:col-start-3 @min-[44rem]:row-start-1 @min-[44rem]:mt-[calc(1.0625rem*1.5+0.375rem)] @min-[44rem]:min-w-52">
            <Button type="submit" busy={busy}>
              {t("Crear invitación", "Create invite")}
            </Button>
          </div>
        </form>
        {shown && <InvitePanel key={shown.token} invite={shown} distributorName={data.distributorName} onHide={() => setShown(null)} />}
      </section>

      <section ref={listBlock} className={SECTION}>
        <h2 className={HEADING}>{t("Sus motoristas", "Your drivers")}</h2>
        <Ledger
          label={t("Sus motoristas", "Your drivers")}
          columns={columns}
          rows={data.drivers}
          rowKey={(d) => d.id}
          rowName={(d) => d.name}
          card={(d) => <LedgerCard title={d.name} amount={d.status === "activo" ? <Money value={d.cashHeld} /> : null} stamp={status(d)} note={d.phone ? formatPhone(d.phone) : undefined} actions={link(d)} />}
          actions={(d) => (
            <RowAction onClick={() => void remove(d)} danger={confirming === d.id} label={confirming === d.id ? undefined : t(`Quitar a ${d.name}`, `Remove ${d.name}`)}>
              {removing === d.id ? t("Quitando...", "Removing...") : confirming === d.id ? t("Toque otra vez para quitar", "Tap again to remove") : t("Quitar", "Remove")}
            </RowAction>
          )}
          empty={<p className="text-lead text-balance">{t("Todavía no tiene motoristas. Agregue al primero con su nombre y su teléfono.", "No drivers yet. Add the first one with their name and phone.")}</p>}
        />
        {/* Its place is always there, so the news never moves a row. */}
        <p role="alert" className="min-h-[1lh] font-semibold text-bad">
          {removeError && msg(removeError)}
        </p>
      </section>
    </>,
  );
}
