"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { addShopAction, getMyShops, linkShopAction, type MyShops, searchShopsAction } from "@/app/shop-actions";
import { FormError, TextField } from "@/components/form";
import { ShopInvite } from "@/components/shop-invite";
import { BackLink, Button, Card, Chip, Label, Loading, Screen } from "@/components/ui";
import { formatMoney, formatPhone } from "@/lib/format";
import { useT } from "@/lib/i18n";

type Match = Awaited<ReturnType<typeof searchShopsAction>>[number];

const STATUS: Record<MyShops["shops"][number]["status"], { label: [string, string]; tone: "paid" | "due" | "part" }> = {
  activa: { label: ["Activa", "Active"], tone: "paid" },
  invitada: { label: ["Invitada", "Invited"], tone: "due" },
  sin_cuenta: { label: ["Sin cuenta", "No account"], tone: "part" },
};

function DriverSelect({ drivers, value, onChange }: { drivers: MyShops["drivers"]; value: string; onChange: (id: string) => void }) {
  const { t } = useT();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-semibold">{t("Motorista que la visita", "Driver who visits it")}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-14 rounded-xl border-2 border-line bg-card px-3 text-lg focus:border-brand focus:outline-none"
      >
        <option value="">{t("Sin asignar", "Not assigned")}</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** The distributor's shops (#132): find them on Relay, or add one by name and invite it. */
export default function Shops() {
  const { t, msg } = useT();
  const [data, setData] = useState<MyShops | null | undefined>(undefined);
  const [mode, setMode] = useState<"buscar" | "nueva">("buscar");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [nickname, setNickname] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<{ shopId: string; code: string; phone: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => setData(await getMyShops()), []);
  useEffect(() => {
    let live = true;
    void getMyShops().then((found) => {
      if (live) setData(found);
    });
    return () => {
      live = false;
    };
  }, []);

  async function search(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMatches(await searchShopsAction(query));
  }

  async function link(shopId: string) {
    setBusy(true);
    setError(null);
    const reply = await linkShopAction(shopId, driverId || null);
    if (reply.ok) {
      setMatches((list) => list?.filter((m) => m.id !== shopId) ?? null);
      await load();
    } else {
      setError(reply.message);
    }
    setBusy(false);
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const reply = await addShopAction({ nickname, address, phone, driverId: driverId || null });
    if (reply.ok) {
      setFresh({ shopId: reply.shopId, code: reply.code, phone });
      setNickname("");
      setAddress("");
      setPhone("");
      await load();
    } else {
      setError(reply.message);
    }
    setBusy(false);
  }

  if (data === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  if (data === null) {
    return (
      <Screen>
        <BackLink href="/distribuidor" label={t("Panel", "Dashboard")} />
        <p className="text-lg">{t("Solo la distribuidora aprobada puede hacer esto.", "Only the approved distributor can do this.")}</p>
      </Screen>
    );
  }

  const tab = (value: "buscar" | "nueva", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => {
        setMode(value);
        setError(null);
      }}
      className={`min-h-12 flex-1 rounded-lg px-3 text-base font-semibold ${mode === value ? "bg-card text-brand shadow-sm" : "text-muted"}`}
    >
      {label}
    </button>
  );

  return (
    <Screen>
      <BackLink href="/distribuidor" label={t("Panel", "Dashboard")} />
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t("Tiendas", "Shops")}</h1>
        <p className="text-lg text-muted">{data.distributorName}</p>
      </header>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("Agregar tienda", "Add shop")}</h2>
        <div role="tablist" className="flex gap-1 rounded-xl bg-paper p-1">
          {tab("buscar", t("Buscar en Relay", "Find on Relay"))}
          {tab("nueva", t("Agregar sin cuenta", "Add without an account"))}
        </div>

        {data.drivers.length > 0 && <DriverSelect drivers={data.drivers} value={driverId} onChange={setDriverId} />}

        {mode === "buscar" ? (
          <>
            <form onSubmit={search} className="flex flex-col gap-3">
              <TextField
                label={t("Nombre de la tienda o teléfono", "Shop name or phone")}
                autoComplete="off"
                required
                minLength={2}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setMatches(null);
                }}
              />
              <Button type="submit" variant="secondary">
                {t("Buscar", "Search")}
              </Button>
            </form>
            {matches !== null &&
              (matches.length === 0 ? (
                <p className="text-muted">{t("No encontramos esa tienda en Relay. Agréguela sin cuenta y la invitamos.", "We didn't find that shop on Relay. Add it without an account and we'll invite it.")}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
                  {matches.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="flex min-w-0 flex-col">
                        <span className="text-lg font-semibold">{m.name}</span>
                        <span className="text-sm text-muted">{[m.ownerName, m.address].filter(Boolean).join(" · ")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => link(m.id)}
                        disabled={busy}
                        className="min-h-12 shrink-0 rounded-xl bg-brand px-4 text-base font-semibold text-white active:bg-brand-dark disabled:bg-line"
                      >
                        {t("Agregar", "Add")}
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
          </>
        ) : (
          <form onSubmit={add} className="flex flex-col gap-4">
            <TextField
              label={t("Cómo la llama usted", "What you call it")}
              hint={t("Cualquier nombre que le sirva, por ejemplo «Tienda de Doña Marta, frente a la iglesia». Solo usted lo ve.", "Any name that works for you, for example “Marta's shop, across from the church”. Only you see it.")}
              autoComplete="off"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <TextField label={t("Dirección (si la sabe)", "Address (if you know it)")} autoComplete="off" value={address} onChange={(e) => setAddress(e.target.value)} />
            <TextField
              label={t("Teléfono (si lo sabe)", "Phone (if you know it)")}
              hint={t("Para enviarle la invitación por WhatsApp.", "To send the invitation on WhatsApp.")}
              inputMode="tel"
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button type="submit" busy={busy}>
              {t("Agregar tienda", "Add shop")}
            </Button>
            {busy && <p className="text-center text-muted">{t("Estamos creando su cuenta de dólares digitales. Toma unos segundos.", "We're creating your digital dollar account. It takes a few seconds.")}</p>}
          </form>
        )}
        {error && <FormError>{msg(error)}</FormError>}
        {fresh && (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-ok">{t("Tienda agregada. Ya puede hacerle facturas.", "Shop added. You can invoice it now.")}</p>
            <ShopInvite code={fresh.code} distributorName={data.distributorName} phone={fresh.phone} />
          </div>
        )}
      </Card>

      <section className="flex flex-col gap-2">
        <Label>{t("Sus tiendas", "Your shops")}</Label>
        {data.shops.length === 0 ? (
          <Card>
            <p className="text-center text-lg text-muted">{t("Todavía no tiene tiendas.", "You don't have any shops yet.")}</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.shops.map((shop) => (
              <li key={shop.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-lg font-semibold">{shop.nickname ?? shop.name}</span>
                      {shop.status === "activa" && (
                        <span className="text-sm text-muted">
                          {shop.nickname && shop.nickname !== shop.name ? `${t(`En Relay: ${shop.name}`, `On Relay: ${shop.name}`)} · ` : ""}
                          {shop.ownerName}
                        </span>
                      )}
                      {shop.phone && <span className="text-sm text-muted tabular-nums">{formatPhone(shop.phone)}</span>}
                    </div>
                    <Chip tone={STATUS[shop.status].tone}>{t(...STATUS[shop.status].label)}</Chip>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-base">
                    <div>
                      <dt className="text-sm text-muted">{t("Límite", "Limit")}</dt>
                      <dd className="font-semibold tabular-nums">{formatMoney(shop.creditLimit)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted">{t("Debe", "Owes")}</dt>
                      <dd className="font-semibold tabular-nums">{formatMoney(shop.creditOwed)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-sm text-muted">{t("Motorista", "Driver")}</dt>
                      <dd className="truncate font-semibold">{shop.driverName ?? "—"}</dd>
                    </div>
                  </dl>
                  {shop.inviteCode && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpen(open === shop.id ? null : shop.id)}
                        className="min-h-12 self-start rounded-xl border-2 border-brand px-4 text-base font-semibold text-brand active:bg-brand-soft"
                      >
                        {open === shop.id ? t("Ocultar invitación", "Hide invitation") : t("Ver invitación", "See invitation")}
                      </button>
                      {open === shop.id && <ShopInvite code={shop.inviteCode} distributorName={data.distributorName} phone={shop.phone} />}
                    </>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}
