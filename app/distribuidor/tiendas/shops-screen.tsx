"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { addShopAction, getMyShops, linkShopAction, type MyShops, searchShopsAction } from "@/app/shop-actions";
import { DistributorShell, NewInvoiceAction } from "@/components/distributor-shell";
import { ActionLink, Button, TextButton } from "@/components/kit/button";
import { Field, SelectField } from "@/components/kit/field";
import { Ledger, LedgerCard, type LedgerColumn, RowButton, RowLink } from "@/components/kit/ledger";
import { Money } from "@/components/kit/money";
import { Stamp, type StampTone } from "@/components/kit/stamp";
import { Empty, Failure, Loading } from "@/components/kit/states";
import { ShopInvite } from "@/components/shop-invite";
import { HOLD_MS, TapShield, useMovedGuard, useTapShield } from "@/components/tap-shield";
import { formatPhone } from "@/lib/format";
import { useT } from "@/lib/i18n";

type Match = Awaited<ReturnType<typeof searchShopsAction>>[number];
type MyShop = MyShops["shops"][number];
type Mode = "buscar" | "nueva";

const STATUS: Record<MyShop["status"], { label: [string, string]; tone: StampTone }> = {
  activa: { label: ["Activa", "Active"], tone: "ok" },
  invitada: { label: ["Invitada", "Invited"], tone: "confirm" },
  sin_cuenta: { label: ["Sin cuenta", "No account"], tone: "ink" },
};

const HEADING = "text-lead leading-tight font-bold";
const SECTION = "flex scroll-mt-[calc(var(--band-h)+0.75rem)] flex-col gap-2";
/** The news of a form and its button: the news above the button on a phone, beside it with more room. Its place is always there. */
const ROW = "flex flex-col gap-3 @min-[40rem]:col-span-2 @min-[40rem]:flex-row-reverse @min-[40rem]:items-center @min-[40rem]:gap-4";
const NEWS = "min-h-[2lh] flex-1 text-pretty";

/** Brings the invitation into view when it appears (on a phone it can open below the screen). */
function reveal(panel: HTMLElement | null) {
  panel?.scrollIntoView({ block: "nearest" });
}

/** The distributor's shops (#132): find them on Relay, or add one by name and invite it. */
export default function ShopsScreen() {
  const { t, msg } = useT();
  const [data, setData] = useState<MyShops | null | undefined>(undefined);
  const [mode, setMode] = useState<Mode>("buscar");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [nickname, setNickname] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState<string | null>(null); // "add", or the id of the shop being linked
  const running = useRef(false);
  const [held, setHeld] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The invitation on show: the one of the shop just added (`fresh`), or the one a row's "Ver invitación" asked for.
  const [shown, setShown] = useState<{ shopId: string; code: string; phone?: string | null; fresh?: boolean } | null>(null);
  const { noteTap, settle } = useTapShield();
  // An invitation opening or closing above the list moves every row.
  const { ref: listBlock, justMoved } = useMovedGuard<HTMLElement>();

  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => setData(await getMyShops()), []);
  useEffect(() => {
    let live = true;
    getMyShops().then(
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

  async function search(event: FormEvent) {
    event.preventDefault();
    if (searching) return;
    setSearching(true);
    setError(null);
    try {
      setMatches(await searchShopsAction(query));
    } catch {
      setError("No se pudo completar. Intente de nuevo.");
    }
    setSearching(false);
  }

  async function link(shopId: string) {
    if (running.current) return;
    running.current = true;
    setBusy(shopId);
    setError(null);
    try {
      const reply = await linkShopAction(shopId, driverId || null);
      if (reply.ok) {
        setMatches((list) => list?.filter((m) => m.id !== shopId) ?? null);
        await load();
      } else {
        setError(reply.message);
      }
    } catch {
      setError("No se pudo completar. Intente de nuevo.");
    }
    // The shop left the list of results and the ones under it moved up: hold every tap until the taps have stopped.
    setHeld(true);
    setBusy(null);
    await settle(HOLD_MS);
    setHeld(false);
    running.current = false;
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    if (running.current) return;
    running.current = true;
    setBusy("add");
    setError(null);
    try {
      const reply = await addShopAction({ nickname, address, phone, driverId: driverId || null });
      if (reply.ok) {
        setShown({ shopId: reply.shopId, code: reply.code, phone, fresh: true });
        setNickname("");
        setAddress("");
        setPhone("");
        await load();
      } else {
        setError(reply.message);
      }
    } catch {
      setError("No se pudo completar. Intente de nuevo.");
    }
    setBusy(null);
    running.current = false;
  }

  const shell = (children: ReactNode, demo = false) => (
    <DistributorShell current="tiendas" name={data?.distributorName} demo={demo} action={demo ? undefined : (place) => <NewInvoiceAction place={place} />}>
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-bold">{t("Tiendas", "Shops")}</h1>
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

  // The place you are in is a paper tab (a fact); the other one is blue (an action), as in the navigation.
  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      id={`tab-${value}`}
      aria-selected={mode === value}
      aria-controls="agregar-tienda"
      tabIndex={mode === value ? 0 : -1}
      onClick={() => {
        setMode(value);
        setError(null);
      }}
      onKeyDown={(event) => {
        // Left and right move between the two tabs, as tabs do.
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        const other: Mode = value === "buscar" ? "nueva" : "buscar";
        setMode(other);
        setError(null);
        document.getElementById(`tab-${other}`)?.focus();
      }}
      className={`min-h-12 flex-1 rounded-t-paper px-3 py-1 text-center leading-tight font-bold text-balance -outline-offset-3 ${mode === value ? "bg-paper text-ink" : "text-brand hover:bg-brand/6"}`}
    >
      {label}
    </button>
  );
  const driverSelect = data.drivers.length > 0 && (
    <SelectField label={t("Motorista que la visita", "Driver who visits it")} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
      <option value="">{t("Sin asignar", "Not assigned")}</option>
      {data.drivers.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </SelectField>
  );

  const status = (shop: MyShop) => (
    <Stamp small tone={STATUS[shop.status].tone}>
      {t(...STATUS[shop.status].label)}
    </Stamp>
  );
  const onRelay = (shop: MyShop) =>
    shop.status === "activa" ? [shop.nickname && shop.nickname !== shop.name ? t(`En Relay: ${shop.name}`, `On Relay: ${shop.name}`) : "", shop.ownerName].filter(Boolean).join(" · ") : "";
  const isShown = (shop: MyShop) => shown?.shopId === shop.id;
  const invite = (shop: MyShop) =>
    shop.inviteCode ? (
      <RowButton
        onClick={() => {
          if (justMoved()) return;
          setShown(isShown(shop) ? null : { shopId: shop.id, code: shop.inviteCode!, phone: shop.phone });
        }}
        label={isShown(shop) ? t(`Ocultar invitación de ${shop.nickname ?? shop.name}`, `Hide invitation for ${shop.nickname ?? shop.name}`) : t(`Ver invitación de ${shop.nickname ?? shop.name}`, `See invitation for ${shop.nickname ?? shop.name}`)}
      >
        {isShown(shop) ? t("Ocultar invitación", "Hide invitation") : t("Ver invitación", "See invitation")}
      </RowButton>
    ) : (
      // As tall as the button, so every row of the table has one height.
      <span aria-hidden className="hidden h-11 @min-[40rem]:block" />
    );
  const columns: LedgerColumn<MyShop>[] = [
    {
      id: "shop",
      header: t("Tienda", "Shop"),
      grow: true,
      cell: (s) => (
        <>
          {s.nickname ?? s.name}
          {onRelay(s) && <span className="pl-2 text-label text-muted">{onRelay(s)}</span>}
        </>
      ),
      title: (s) => [s.nickname ?? s.name, onRelay(s)].filter(Boolean).join(" · "),
      total: "Total",
    },
    { id: "phone", header: t("Teléfono", "Phone"), mono: true, secondary: true, cell: (s) => (s.phone ? formatPhone(s.phone) : "—") },
    { id: "driver", header: t("Motorista", "Driver"), secondary: 54, cell: (s) => s.driverName ?? "—" },
    { id: "limit", header: t("Límite", "Limit"), figure: true, secondary: 54, cell: (s) => <Money value={s.creditLimit} /> },
    { id: "owed", header: t("Debe", "Owes"), figure: true, cell: (s) => <Money value={s.creditOwed} />, total: <Money value={Math.round(data.shops.reduce((sum, s) => sum + s.creditOwed, 0) * 100) / 100} /> },
    { id: "status", header: t("Estado", "Status"), cell: status },
    // One width whether it holds the button or nothing, so the columns never move sideways.
    { id: "invite", header: <span className="sr-only">{t("Invitación", "Invitation")}</span>, end: true, className: "w-48 min-w-48 py-1", cell: invite },
  ];

  return shell(
    <>
      {(busy !== null || held) && <TapShield onTap={noteTap} />}

      <section className={`${SECTION} max-w-[48rem]`}>
        <h2 className={HEADING}>{t("Agregar tienda", "Add shop")}</h2>
        <div role="tablist" aria-label={t("Cómo agregarla", "How to add it")} className="flex gap-1 border-b border-counter-rule">
          {tab("buscar", t("Buscar en Relay", "Find on Relay"))}
          {tab("nueva", t("Agregar sin cuenta", "Add without an account"))}
        </div>

        <div id="agregar-tienda" role="tabpanel" aria-labelledby={`tab-${mode}`} className="flex flex-col gap-2">
          {mode === "buscar" ? (
            <>
              <form onSubmit={search} className="grid grid-cols-1 gap-x-4 gap-y-3 pt-1 @min-[40rem]:grid-cols-2">
                {driverSelect}
                <Field
                  label={t("Nombre de la tienda o teléfono", "Shop name or phone")}
                  autoComplete="off"
                  enterKeyHint="search"
                  required
                  minLength={2}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setMatches(null);
                  }}
                />
                <div className={ROW}>
                  <p role={error ? "alert" : "status"} className={`${NEWS} ${error ? "font-semibold text-bad" : "text-muted"}`}>
                    {error ? msg(error) : t("Si la tienda ya usa Relay, la encuentra aquí.", "If the shop already uses Relay, you'll find it here.")}
                  </p>
                  <div className="@min-[40rem]:w-60 @min-[40rem]:shrink-0">
                    <Button type="submit" busy={searching}>
                      {t("Buscar", "Search")}
                    </Button>
                  </div>
                </div>
              </form>
              {matches !== null &&
                (matches.length === 0 ? (
                  <p className="rounded-paper bg-paper px-4 py-4 text-pretty">
                    {t("No encontramos esa tienda en Relay. Agréguela sin cuenta y la invitamos.", "We didn't find that shop on Relay. Add it without an account and we'll invite it.")}
                  </p>
                ) : (
                  <ul aria-label={t("Tiendas encontradas", "Shops found")} className="flex flex-col divide-y divide-paper-rule rounded-paper bg-paper">
                    {matches.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-2 pr-2 pl-4">
                        <span className="flex min-w-0 flex-col leading-snug">
                          <span className="text-[1.0625rem] font-bold">{m.name}</span>
                          <span className="text-label text-muted">{[m.ownerName, m.address].filter(Boolean).join(" · ")}</span>
                        </span>
                        <span className="shrink-0">
                          <RowButton onClick={() => void link(m.id)} disabled={busy !== null || held} busy={busy === m.id} label={t(`Agregar ${m.name}`, `Add ${m.name}`)}>
                            {t("Agregar", "Add")}
                          </RowButton>
                        </span>
                      </li>
                    ))}
                  </ul>
                ))}
            </>
          ) : (
            <form onSubmit={add} className="grid grid-cols-1 gap-x-4 gap-y-3 pt-1 @min-[40rem]:grid-cols-2">
              <div className="@min-[40rem]:col-span-2">
                <Field
                  label={t("Cómo la llama usted", "What you call it")}
                  hint={t("Cualquier nombre que le sirva, por ejemplo «Tienda de Doña Marta, frente a la iglesia». Solo usted lo ve.", "Any name that works for you, for example “Marta's shop, across from the church”. Only you see it.")}
                  autoComplete="off"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <Field label={t("Dirección (si la sabe)", "Address (if you know it)")} autoComplete="off" value={address} onChange={(e) => setAddress(e.target.value)} />
              <Field
                label={t("Teléfono (si lo sabe)", "Phone (if you know it)")}
                hint={t("Para enviarle la invitación por WhatsApp.", "To send the invitation on WhatsApp.")}
                inputMode="tel"
                autoComplete="off"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {driverSelect}
              <div className={ROW}>
                <p role={error ? "alert" : "status"} className={`${NEWS} ${error ? "font-semibold text-bad" : "text-muted"}`}>
                  {error
                    ? msg(error)
                    : busy === "add"
                      ? t("Estamos creando su cuenta de dólares digitales. Toma unos segundos.", "We're creating your digital dollar account. It takes a few seconds.")
                      : t("Le damos un código para que la tienda cree su cuenta.", "You get a code for the shop to make its account.")}
                </p>
                <div className="@min-[40rem]:w-60 @min-[40rem]:shrink-0">
                  <Button type="submit" busy={busy === "add"}>
                    {t("Agregar tienda", "Add shop")}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        {shown && (
          <div ref={reveal} className="flex max-w-[28rem] scroll-mb-20 flex-col gap-2 pt-2">
            {shown.fresh && (
              <p role="status" className="font-semibold text-ok">
                {t("Tienda agregada. Ya puede hacerle facturas.", "Shop added. You can invoice it now.")}
              </p>
            )}
            <ShopInvite code={shown.code} distributorName={data.distributorName} phone={shown.phone} />
            <TextButton onClick={() => setShown(null)}>{t("Ocultar invitación", "Hide invitation")}</TextButton>
          </div>
        )}
      </section>

      <section ref={listBlock} className={SECTION}>
        <h2 className={HEADING}>{t("Sus tiendas", "Your shops")}</h2>
        <Ledger
          label={t("Sus tiendas", "Your shops")}
          columns={columns}
          rows={data.shops}
          rowKey={(s) => s.id}
          rowName={(s) => s.nickname ?? s.name}
          card={(s) => <LedgerCard title={s.nickname ?? s.name} amount={<Money value={s.creditOwed} />} stamp={status(s)} note={onRelay(s) || undefined} actions={invite(s)} />}
          actions={(s) => (
            <RowLink href={`/distribuidor/tienda/${s.id}`} label={t(`Historial de ${s.nickname ?? s.name}`, `History of ${s.nickname ?? s.name}`)}>
              {t("Historial", "History")}
            </RowLink>
          )}
          empty={<p className="text-lead text-balance">{t("Todavía no tiene tiendas. Búsquela en Relay o agréguela sin cuenta.", "You don't have any shops yet. Find one on Relay or add it without an account.")}</p>}
        />
      </section>
    </>,
  );
}
