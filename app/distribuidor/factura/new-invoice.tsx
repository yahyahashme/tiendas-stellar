"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { createInvoiceAction, getInvoiceForm, type InvoiceForm } from "@/app/invoice-actions";
import { CsvImport } from "@/components/csv-import";
import { DistributorShell, NewInvoiceHere } from "@/components/distributor-shell";
import { ActionLink, ActionList, ActionRow, Button, ButtonLink } from "@/components/kit/button";
import { AreaField, Field, INPUT, MoneyField, SelectField } from "@/components/kit/field";
import { Money } from "@/components/kit/money";
import { Receipt, ReceiptFoot, ReceiptHeader, ReceiptLine, ReceiptLines, ReceiptRule, ReceiptTotal } from "@/components/kit/paper";
import { Stamp } from "@/components/kit/stamp";
import { Answer, Empty, Failure, Loading } from "@/components/kit/states";
import { HOLD_MS, TapShield, useQuietOnArrival, useSameSpotGuard, useTapShield } from "@/components/tap-shield";
import { getDistributorView } from "@/lib/api";
import { formatDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { parseAmount } from "@/lib/labels";
import type { Invoice, Receipt as Outcome } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** YYYY-MM-DD plus some days. */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type Shop = InvoiceForm["shops"][number];

/** Stable, so it runs once, when the element appears. */
function takeFocus(element: HTMLElement | null) {
  element?.focus();
}

const HEADING = "text-title font-bold";
const LABEL = "text-label font-semibold uppercase tracking-[0.08em] text-muted";
/** A choice in a list of choices: a blue-ruled row. */
const CHOICE = "flex min-h-13 w-full flex-col justify-center px-3.5 py-1.5 text-left text-brand -outline-offset-3 hover:bg-brand/6 active:bg-brand/10";

/** The frame of the page: the distributor's shell, with "Nueva factura" marked as the place you are in. */
function Frame({ name, demo = false, children }: { name?: string; demo?: boolean; children: ReactNode }) {
  return (
    <DistributorShell current="factura" name={name} demo={demo} action={(place) => <NewInvoiceHere place={place} />}>
      {children}
    </DistributorShell>
  );
}

/** The page before its screen has loaded. */
export function NewInvoiceLoading() {
  const { t } = useT();
  return (
    <Frame>
      <div className="flex max-w-[34rem] flex-col gap-4">
        <h1 className={HEADING}>{t("Nueva factura", "New invoice")}</h1>
        <Loading lines={6} torn={false} />
      </div>
    </Frame>
  );
}

/** Search the distributor's own shops, then show the picked one with "Cambiar". */
function ShopPicker({ shops, value, onChange }: { shops: Shop[]; value: Shop | null; onChange: (shop: Shop | null) => void }) {
  const { t } = useT();
  const id = useId();
  const [query, setQuery] = useState("");
  // "Cambiar" puts the search box where the button was: it takes the focus, so the keyboard carries on from there.
  const [changing, setChanging] = useState(false);
  // And picking a shop takes the search box away: the focus goes to "Cambiar", the next thing in its place.
  const [picked, setPicked] = useState(false);
  const pick = (shop: Shop) => {
    setPicked(true);
    onChange(shop);
  };
  const matches = useMemo(() => {
    const q = fold(query.trim());
    return shops.filter((s) => !q || fold(`${s.name} ${s.owner}`).includes(q)).slice(0, 6);
  }, [shops, query]);

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <span id={id} className="text-[1.0625rem] font-bold">
          {t("Tienda", "Shop")}
        </span>
        <div role="group" aria-labelledby={id} className="flex min-h-13 items-center justify-between gap-3 rounded-control border-[1.5px] border-muted bg-paper pl-3.5">
          <span className="flex min-w-0 flex-col py-1 leading-tight">
            <span className="truncate text-[1.125rem]">{value.name}</span>
            {value.owner && <span className="truncate text-label text-muted">{value.owner}</span>}
          </span>
          <button
            type="button"
            autoFocus={picked}
            onClick={() => {
              setQuery("");
              setChanging(true);
              setPicked(false);
              onChange(null);
            }}
            className="min-h-12 shrink-0 rounded-control px-3.5 font-bold text-brand underline decoration-2 underline-offset-4 -outline-offset-3"
          >
            {t("Cambiar", "Change")}
          </button>
        </div>
      </div>
    );
  }
  // Enter in the search box picks the first shop found; it never sends the form half filled.
  const pickFirst = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (matches.length > 0) pick(matches[0]);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[1.0625rem] font-bold">
        {t("Tienda", "Shop")}
      </label>
      <input
        id={id}
        className={INPUT}
        placeholder={t("Buscar entre sus tiendas", "Search your shops")}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={changing}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={pickFirst}
      />
      {matches.length === 0 ? (
        <p className="text-muted">{t("No hay tiendas con ese nombre.", "No shops with that name.")}</p>
      ) : (
        <ul aria-label={t("Tiendas encontradas", "Shops found")} className="flex flex-col divide-y divide-brand/25 rounded-control border-[1.5px] border-brand">
          {matches.map((shop) => (
            <li key={shop.id}>
              <button type="button" onClick={() => pick(shop)} className={`${CHOICE} rounded-[8px]`}>
                <span className="text-[1.0625rem] font-bold">{shop.name}</span>
                {shop.owner && <span className="text-label text-muted">{shop.owner}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Arroz 5 lb x 12  $54.00" prints with a dotted leader, as on the shop's slip; anything else prints as written. */
const PRICED = /^(.*\S)\s+\$\s?(\d[\d,]*(?:\.\d{1,2})?)$/;

/** What the shop will see: the same slip as on its phone, filling in as the form is written. */
function Preview({
  from,
  number,
  shop,
  driver,
  note,
  amount,
  dueDate,
  created,
}: {
  from: string;
  number: string;
  shop: string | undefined;
  driver: string | undefined;
  note: string;
  amount: number | null;
  dueDate: string;
  created: boolean;
}) {
  const { lang, t } = useT();
  const blank = (
    <span className="text-muted">
      <span aria-hidden>—</span>
      <span className="sr-only">{t("sin llenar", "not filled in")}</span>
    </span>
  );
  const lines = note
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const due = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? `${t("Vence", "Due")} ${formatDay(`${dueDate}T06:00:00Z`, lang)}` : undefined;
  return (
    <Receipt>
      <ReceiptHeader as="h2" from={from} number={`${t("Factura n.º", "Invoice no.")} ${number || "—"}`} />
      <ReceiptRule />
      <ReceiptLines>
        <ReceiptLine label={t("Cliente", "Customer")}>{shop ?? blank}</ReceiptLine>
        <ReceiptLine label={t("Motorista", "Driver")}>{driver ?? blank}</ReceiptLine>
      </ReceiptLines>
      {lines.length > 0 && (
        <ul className="flex flex-col gap-1.5 font-mono text-base font-medium">
          {lines.map((line, i) => {
            const priced = PRICED.exec(line);
            return priced ? (
              <li key={i} className="flex items-end">
                <span className="min-w-0">{priced[1]}</span>
                <span aria-hidden className="leader" />
                <Money value={Number(priced[2].replaceAll(",", ""))} className="shrink-0" />
              </li>
            ) : (
              <li key={i} className="wrap-anywhere">
                {line}
              </li>
            );
          })}
        </ul>
      )}
      <ReceiptTotal label="Total" value={amount ?? 0} note={due} />
      {created && (
        <ReceiptFoot
          stamp={<Stamp tone="confirm">{t("Creada", "Created")}</Stamp>}
        >
          {t("Ya está en el teléfono de la tienda.", "It's on the shop's phone now.")}
        </ReceiptFoot>
      )}
    </Receipt>
  );
}

/** The two panes: what you write on the left, the slip it makes on the right. One column without the room. */
function Panes({ left, slip }: { left: ReactNode; slip: ReactNode }) {
  const { t } = useT();
  return (
    <div className="@container/panes max-w-[62rem]">
      <div className="flex flex-col gap-4 @min-[44rem]/panes:grid @min-[44rem]/panes:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] @min-[44rem]/panes:items-start @min-[44rem]/panes:gap-x-[clamp(1.5rem,4cqi,3rem)]">
        <div className="@container/form flex min-w-0 flex-col gap-4">{left}</div>
        <aside aria-label={t("Recibo", "Receipt")} className="hidden min-w-0 flex-col gap-1.5 @min-[44rem]/panes:sticky @min-[44rem]/panes:top-[calc(var(--band-h)+1rem)] @min-[44rem]/panes:flex">
          <p className={LABEL}>{t("Así la ve la tienda", "What the shop sees")}</p>
          {slip}
          <p className="pt-1 text-label text-muted text-pretty">
            {t("La tienda la paga desde su teléfono: con dólares digitales, en 7 días o en efectivo.", "The shop pays it from its phone: in digital dollars, in 7 days or in cash.")}
          </p>
        </aside>
      </div>
    </div>
  );
}

/** The demo has no form of its own (its invoices come from the panel), but a file of invoices can still be tried here. */
function DemoImport() {
  const { t } = useT();
  const { data, reload } = usePolling("factura-demo", () => getDistributorView(1), 0);
  if (!data?.scope.isDemo) return null;
  const name = (list: { id: string; name: string }[]) => (id: string) => list.find((item) => item.id === id)?.name ?? id;
  return (
    <section id="importar" className="flex scroll-mt-[calc(var(--band-h)+0.75rem)] flex-col gap-2">
      <h2 className="text-lead leading-tight font-bold">{t("Demo: varias facturas a la vez", "Demo: several invoices at once")}</h2>
      <CsvImport shopName={name(data.shops)} driverName={name(data.drivers)} onCreated={reload} />
    </section>
  );
}

/** "Nueva factura" (#133): shop, driver, amount, due date, number, note, and the slip they make. */
export default function NewInvoice() {
  const { t, msg } = useT();
  const params = useSearchParams();
  const [form, setForm] = useState<InvoiceForm | null | undefined>(undefined);
  const [shop, setShop] = useState<Shop | null>(null);
  const [driverId, setDriverId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  // After the invoice is made the screen is another screen: taps stay blocked until they stop.
  const [held, setHeld] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<(Outcome & { invoiceId?: number }) | null>(null);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const { noteTap, settle } = useTapShield();
  const { watch, typed, stray } = useSameSpotGuard();
  // The distributor's recent invoices, for "Repetir". Read once, and only after the form is on screen: in live mode
  // this is a server action, Next runs those one at a time, and a read sent first would keep the form waiting.
  const formShown = form !== undefined && form !== null;
  const recent = usePolling(formShown ? "factura-recent" : "factura-recent-later", () => (formShown ? getDistributorView(1) : Promise.resolve(undefined)), 0);
  // Picking a shop folds the list of shops away and the button comes up the page: it stays inert for a beat.
  const shopJustPicked = useQuietOnArrival(shop !== null);
  const anotherArriving = useQuietOnArrival(done?.ok === true && !held);

  function fill(found: InvoiceForm) {
    setForm(found);
    setInvoiceId(String(found.suggestedId));
    setDueDate(addDays(found.today, 7));
  }

  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const repeatShop = params.get("tienda");
  const repeatDriver = params.get("motorista");
  useEffect(() => {
    let live = true;
    getInvoiceForm().then(
      (found) => {
        if (!live) return;
        setFailed(false);
        if (!found) return setForm(null);
        fill(found);
        const picked = found.shops.find((s) => s.id === repeatShop) ?? (found.shops.length === 1 ? found.shops[0] : null);
        setShop(picked);
        const driver = found.drivers.find((d) => d.id === repeatDriver)?.id ?? picked?.driverId ?? (found.drivers.length === 1 ? found.drivers[0].id : "");
        setDriverId(driver);
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [repeatShop, repeatDriver, attempt]);

  function pickShop(next: Shop | null) {
    setShop(next);
    if (next?.driverId) setDriverId(next.driverId);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (running.current) return; // Enter twice, or two taps before the screen has redrawn: one invoice
    if (!shop) return setError("Elija una de sus tiendas.");
    running.current = true;
    setBusy(true);
    setError(null);
    let reply: Outcome & { invoiceId?: number };
    try {
      reply = await createInvoiceAction({ invoiceId: Number(invoiceId), shopId: shop.id, driverId, amount, dueDate, note });
    } catch {
      reply = { ok: false, message: "No se pudo completar. Intente de nuevo." };
    }
    if (reply.ok) {
      setDone(reply);
      setHeld(true);
    } else setError(reply.message);
    setBusy(false);
    if (reply.ok) {
      await settle(HOLD_MS);
      setHeld(false);
    }
    running.current = false;
  }

  async function another() {
    setDone(null);
    setAmount("");
    setNote("");
    setForm(undefined);
    try {
      const found = await getInvoiceForm();
      if (found) fill(found);
      else setForm(null);
    } catch {
      setFailed(true);
    }
  }

  /** After a file of invoices is created, the next free number has moved on. */
  async function numbersMoved() {
    const found = await getInvoiceForm().catch(() => null);
    if (!found) return;
    setForm(found);
    setInvoiceId(String(found.suggestedId));
  }

  if (form === undefined && failed) {
    return (
      <Frame>
        <div className="flex max-w-[34rem] flex-col gap-4">
          <h1 className={HEADING}>{t("Nueva factura", "New invoice")}</h1>
          <Failure
            onRetry={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          />
        </div>
      </Frame>
    );
  }
  if (form === undefined) return <NewInvoiceLoading />;
  if (form === null) {
    return (
      <Frame demo>
        <div className="flex max-w-[48rem] flex-col gap-4">
          <h1 className={HEADING}>{t("Nueva factura", "New invoice")}</h1>
          <Empty action={<ActionLink href="/distribuidor" title={t("Ir al panel", "Go to the dashboard")} />}>
            {t("Su distribuidora todavía no está aprobada para crear facturas.", "Your distributor isn't approved to create invoices yet.")}
          </Empty>
          <DemoImport />
        </div>
      </Frame>
    );
  }

  const driverName = form.drivers.find((d) => d.id === driverId)?.name;
  const slip = (
    <Preview from={form.distributorName} number={invoiceId} shop={shop?.name} driver={driverName} note={note} amount={parseAmount(amount)} dueDate={dueDate} created={done?.ok === true} />
  );

  if (done?.ok) {
    return (
      <Frame name={form.distributorName}>
        {held && <TapShield onTap={noteTap} />}
        <Panes
          slip={slip}
          left={
            <>
              {/* The form is gone: the keyboard and the screen reader carry on from the news. */}
              <h1 ref={takeFocus} tabIndex={-1} className={`${HEADING} outline-none`}>
                {t("Factura creada", "Invoice created")}
              </h1>
              <div className="rounded-paper bg-paper px-4 py-3">
                <Answer receipt={done} />
                <p className="text-pretty">
                  <strong>{shop?.name}</strong>
                  {". "}
                  {t(`Ya está en la ruta de ${driverName ?? ""} y en la cuenta de la tienda.`, `It's already on ${driverName ?? ""}'s route and in the shop's account.`)}
                </p>
              </div>
              {/* On a phone the slip it made comes first, then what to do next. */}
              <div className="@min-[44rem]/panes:hidden">{slip}</div>
              <Button onClick={another} arriving={anotherArriving} disabled={held}>
                {t("Crear otra factura", "Create another invoice")}
              </Button>
              <ActionLink href="/distribuidor" title={t("Ir al panel", "Go to the dashboard")} />
            </>
          }
        />
      </Frame>
    );
  }

  const missing = form.shops.length === 0 ? "tiendas" : form.drivers.length === 0 ? "motoristas" : null;
  if (missing) {
    return (
      <Frame name={form.distributorName}>
        <div className="flex max-w-[34rem] flex-col gap-4">
          <h1 className={HEADING}>{t("Nueva factura", "New invoice")}</h1>
          <Empty
            action={
              <ButtonLink href={missing === "tiendas" ? "/distribuidor/tiendas" : "/distribuidor/motoristas"}>
                {missing === "tiendas" ? t("Agregar sus tiendas", "Add your shops") : t("Agregar sus motoristas", "Add your drivers")}
              </ButtonLink>
            }
          >
            {missing === "tiendas" ? t("Primero agregue una tienda.", "First add a shop.") : t("Primero agregue un motorista.", "First add a driver.")}
          </Empty>
        </div>
      </Frame>
    );
  }

  // "Repetir": the newest invoice of each shop, to fill the form with the same shop, driver and amount.
  const again: Invoice[] = [];
  for (const invoice of recent.data?.invoices ?? []) {
    if (again.length === 4) break;
    if (again.some((seen) => seen.shopId === invoice.shopId)) continue;
    if (form.shops.some((s) => s.id === invoice.shopId) && form.drivers.some((d) => d.id === invoice.driverId)) again.push(invoice);
  }
  function repeat(invoice: Invoice) {
    setShop(form?.shops.find((s) => s.id === invoice.shopId) ?? null);
    setDriverId(invoice.driverId);
    setAmount(invoice.amount.toFixed(2));
    setError(null);
    setRepeatOpen(false);
  }
  const known = { shops: form.shops.map((s) => ({ id: s.id, name: s.name })), drivers: form.drivers };
  const nameOf = (list: { id: string; name: string }[]) => (id: string) => list.find((item) => item.id === id)?.name ?? id;

  return (
    <Frame name={form.distributorName}>
      {busy && <TapShield onTap={noteTap} />}
      <Panes
        slip={slip}
        left={
          <>
            <h1 className={HEADING}>{t("Nueva factura", "New invoice")}</h1>

            <ActionList>
              <ActionRow
                title={t("Repetir", "Repeat")}
                hint={
                  !recent.data && !recent.failed
                    ? t("Cargando...", "Loading...")
                    : again.length > 0
                      ? t("Llenar con la última factura de una tienda.", "Fill in from a shop's last invoice.")
                      : t("Todavía no hay facturas para repetir.", "There are no invoices to repeat yet.")
                }
                open={repeatOpen && again.length > 0}
                disabled={again.length === 0 || busy}
                onClick={() => setRepeatOpen((now) => !now)}
              >
                <ul className="flex flex-col divide-y divide-brand/25 border-t border-brand/25">
                  {again.map((invoice) => (
                    <li key={invoice.id}>
                      <button type="button" onClick={() => repeat(invoice)} className={`${CHOICE} -mx-2 w-[calc(100%+1rem)] rounded-[6px] px-2`}>
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-[1.0625rem] font-bold">{nameOf(known.shops)(invoice.shopId)}</span>
                          <Money value={invoice.amount} className="shrink-0 font-semibold text-ink" />
                        </span>
                        <span className="text-label text-muted">{nameOf(form.drivers)(invoice.driverId)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </ActionRow>
              <div id="importar" className="scroll-mt-[calc(var(--band-h)+0.75rem)]">
                <CsvImport shopName={nameOf(known.shops)} driverName={nameOf(form.drivers)} onCreated={numbersMoved} known={known} />
              </div>
            </ActionList>

            <form onSubmit={submit} onPointerDownCapture={watch} onInputCapture={typed} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 @min-[30rem]/form:grid-cols-2">
                <div className="@min-[30rem]/form:col-span-2">
                  <ShopPicker shops={form.shops} value={shop} onChange={pickShop} />
                </div>
                <SelectField label={t("Motorista", "Driver")} required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  <option value="" disabled>
                    {t("Elija un motorista", "Choose a driver")}
                  </option>
                  {form.drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </SelectField>
                <MoneyField label={t("Monto (USD)", "Amount (USD)")} placeholder="0.00" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Field label={t("Vence", "Due")} type="date" required min={form.today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Field
                  label={t("Número", "Number")}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  className="font-mono font-medium"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value.replace(/\D/g, ""))}
                />
                <div className="@min-[30rem]/form:col-span-2">
                  <AreaField
                    label={t("Nota o productos (opcional)", "Note or products (optional)")}
                    rows={2}
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("Por ejemplo: 3 cajas de agua, 2 de jugos", "For example: 3 boxes of water, 2 of juice")}
                  />
                </div>
              </div>

              {/* A phone has no room beside the form: the slip unfolds here, above the button. */}
              <div className="@min-[44rem]/panes:hidden">
                <ActionRow title={t("Ver recibo", "See receipt")} hint={t("Así la ve la tienda.", "What the shop sees.")} open={slipOpen} onClick={() => setSlipOpen((now) => !now)}>
                  <div className="-mx-2">{slip}</div>
                </ActionRow>
              </div>

              {/* One place for the news, always there: above the button on a phone, beside it with more room. Nothing it says moves the button. */}
              <div className="flex flex-col gap-3 @min-[30rem]/form:flex-row-reverse @min-[30rem]/form:items-center @min-[30rem]/form:gap-4">
                <p role={error ? "alert" : "status"} className={`min-h-[2lh] flex-1 text-pretty ${error ? "font-semibold text-bad" : "text-muted"}`}>
                  {error
                    ? msg(error)
                    : busy
                      ? t("Registrando la factura. Toma unos segundos.", "Recording the invoice. It takes a few seconds.")
                      : t("La tienda la recibe en su teléfono y el motorista en su ruta.", "The shop gets it on its phone and the driver on the route.")}
                </p>
                <div className="@min-[30rem]/form:w-60 @min-[30rem]/form:shrink-0">
                  <Button
                    type="submit"
                    busy={busy}
                    arriving={shopJustPicked}
                    onClick={(event) => {
                      // A tap that lands here because the page moved (a list closed, a panel folded) was not meant to create an invoice.
                      if (stray(event)) event.preventDefault();
                    }}
                  >
                    {t("Crear factura", "Create invoice")}
                  </Button>
                </div>
              </div>
            </form>
          </>
        }
      />
    </Frame>
  );
}
