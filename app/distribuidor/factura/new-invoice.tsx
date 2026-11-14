"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { createInvoiceAction, getInvoiceForm, type InvoiceForm } from "@/app/invoice-actions";
import { FormError, INPUT, TextField } from "@/components/form";
import { BackLink, Button, ButtonLink, Card, Loading, ReceiptView, Screen } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { Receipt } from "@/lib/types";

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

/** Search the distributor's own shops, then show the picked one with "Cambiar". */
function ShopPicker({ shops, value, onChange }: { shops: Shop[]; value: Shop | null; onChange: (shop: Shop | null) => void }) {
  const { t } = useT();
  const id = useId();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = fold(query.trim());
    return shops.filter((s) => !q || fold(`${s.name} ${s.owner}`).includes(q)).slice(0, 6);
  }, [shops, query]);

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-base font-semibold">{t("Tienda", "Shop")}</span>
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-brand bg-brand-soft px-3">
          <span className="flex min-w-0 flex-col py-2">
            <span className="text-lg font-semibold">{value.name}</span>
            {value.owner && <span className="text-sm text-muted">{value.owner}</span>}
          </span>
          <button type="button" onClick={() => onChange(null)} className="min-h-12 shrink-0 px-2 text-base font-semibold text-brand underline">
            {t("Cambiar", "Change")}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-semibold">
        {t("Tienda", "Shop")}
      </label>
      <input
        id={id}
        className={INPUT}
        placeholder={t("Buscar entre sus tiendas", "Search your shops")}
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length === 0 ? (
        <p className="text-muted">{t("No hay tiendas con ese nombre.", "No shops with that name.")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-card">
          {matches.map((shop) => (
            <li key={shop.id}>
              <button
                type="button"
                onClick={() => onChange(shop)}
                className="flex min-h-12 w-full flex-col px-4 py-2 text-left active:bg-brand-soft"
              >
                <span className="text-lg font-semibold">{shop.name}</span>
                {shop.owner && <span className="text-sm text-muted">{shop.owner}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Nueva factura" (#133): shop, driver, amount, due date, number, note. */
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
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<(Receipt & { invoiceId?: number }) | null>(null);
  const driverField = useId();
  const noteField = useId();

  function fill(found: InvoiceForm) {
    setForm(found);
    setInvoiceId(String(found.suggestedId));
    setDueDate(addDays(found.today, 7));
  }

  const repeatShop = params.get("tienda");
  const repeatDriver = params.get("motorista");
  useEffect(() => {
    let live = true;
    void getInvoiceForm().then((found) => {
      if (!live) return;
      if (!found) return setForm(null);
      fill(found);
      const picked = found.shops.find((s) => s.id === repeatShop) ?? (found.shops.length === 1 ? found.shops[0] : null);
      setShop(picked);
      const driver = found.drivers.find((d) => d.id === repeatDriver)?.id ?? picked?.driverId ?? (found.drivers.length === 1 ? found.drivers[0].id : "");
      setDriverId(driver);
    });
    return () => {
      live = false;
    };
  }, [repeatShop, repeatDriver]);

  function pickShop(next: Shop | null) {
    setShop(next);
    if (next?.driverId) setDriverId(next.driverId);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!shop) return setError("Elija una de sus tiendas.");
    setBusy(true);
    setError(null);
    const reply = await createInvoiceAction({ invoiceId: Number(invoiceId), shopId: shop.id, driverId, amount, dueDate, note });
    if (reply.ok) setDone(reply);
    else setError(reply.message);
    setBusy(false);
  }

  async function another() {
    setDone(null);
    setAmount("");
    setNote("");
    setForm(undefined);
    const found = await getInvoiceForm();
    if (found) fill(found);
    else setForm(null);
  }

  if (form === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  if (form === null) {
    return (
      <Screen>
        <BackLink href="/distribuidor" label={t("Panel", "Dashboard")} />
        <p className="text-lg">{t("Su distribuidora todavía no está aprobada para crear facturas.", "Your distributor isn't approved to create invoices yet.")}</p>
      </Screen>
    );
  }

  if (done?.ok) {
    return (
      <Screen>
        <BackLink href="/distribuidor" label={t("Panel", "Dashboard")} />
        <h1 className="text-3xl font-bold">{t("Factura creada", "Invoice created")}</h1>
        <ReceiptView receipt={done} />
        <Card className="flex flex-col gap-1">
          <p className="text-lg font-semibold">{shop?.name}</p>
          <p className="text-muted">{t(`Ya está en la ruta de ${form.drivers.find((d) => d.id === driverId)?.name ?? ""} y en la cuenta de la tienda.`, `It's already on ${form.drivers.find((d) => d.id === driverId)?.name ?? ""}'s route and in the shop's account.`)}</p>
        </Card>
        <Button onClick={another}>{t("Crear otra factura", "Create another invoice")}</Button>
        <ButtonLink href="/distribuidor" variant="secondary">
          {t("Ir al panel", "Go to the dashboard")}
        </ButtonLink>
      </Screen>
    );
  }

  const missing = form.shops.length === 0 ? "tiendas" : form.drivers.length === 0 ? "motoristas" : null;

  return (
    <Screen wide>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <BackLink href="/distribuidor" label={t("Panel", "Dashboard")} />
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t("Nueva factura", "New invoice")}</h1>
          <p className="text-lg text-muted">{form.distributorName}</p>
        </header>

        {missing ? (
          <Card className="flex flex-col gap-3">
            <p className="text-lg">
              {missing === "tiendas" ? t("Primero agregue una tienda.", "First add a shop.") : t("Primero agregue un motorista.", "First add a driver.")}
            </p>
            <ButtonLink href={missing === "tiendas" ? "/distribuidor/tiendas" : "/distribuidor/motoristas"}>
              {missing === "tiendas" ? t("Agregar sus tiendas", "Add your shops") : t("Agregar sus motoristas", "Add your drivers")}
            </ButtonLink>
          </Card>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-5">
            <Card className="grid gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-5">
                <ShopPicker shops={form.shops} value={shop} onChange={pickShop} />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={driverField} className="text-base font-semibold">
                    {t("Motorista", "Driver")}
                  </label>
                  <select id={driverField} required value={driverId} onChange={(e) => setDriverId(e.target.value)} className={INPUT}>
                    <option value="" disabled>
                      {t("Elija un motorista", "Choose a driver")}
                    </option>
                    {form.drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <TextField
                  label={t("Monto (USD)", "Amount (USD)")}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
                  <TextField label={t("Vence", "Due")} type="date" required min={form.today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  <TextField
                    label={t("Número", "Number")}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={noteField} className="text-base font-semibold">
                    {t("Nota o productos (opcional)", "Note or products (optional)")}
                  </label>
                  <textarea
                    id={noteField}
                    rows={2}
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("Por ejemplo: 3 cajas de agua, 2 de jugos", "For example: 3 boxes of water, 2 of juice")}
                    className={`${INPUT} py-3`}
                  />
                </div>
              </div>
            </Card>
            {error && <FormError>{msg(error)}</FormError>}
            <div className="flex flex-col gap-2 lg:mx-auto lg:w-96">
              <Button type="submit" busy={busy}>
                {t("Crear factura", "Create invoice")}
              </Button>
              {busy && <p className="text-center text-muted">{t("Registrando la factura. Toma unos segundos.", "Recording the invoice. It takes a few seconds.")}</p>}
            </div>
            <p className="text-center text-sm text-muted">
              {t("¿Muchas facturas a la vez?", "Many invoices at once?")}{" "}
              <Link href="/distribuidor#importar" className="text-brand underline">
                {t("Importe un archivo CSV", "Import a CSV file")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </Screen>
  );
}
