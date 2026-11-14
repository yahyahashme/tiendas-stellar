"use client";

import { useEffect, useState } from "react";
import { type CurrentUser, getCurrentUser } from "@/app/auth-actions";
import { ActionLink, ActionList, ActionRow } from "@/components/kit/button";
import { NavLink } from "@/components/kit/layout";
import { Money } from "@/components/kit/money";
import { Failure, Loading } from "@/components/kit/states";
import { getDrivers, getInvoices, getShop } from "@/lib/api";
import { plural } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { leftToPay } from "@/lib/labels";
import type { Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

// The parts of the home page that need the browser: who is signed in, and the demo's shops and drivers.
// Everything else on the page is drawn on the server (app/page.tsx).

/** "Entrar", or "Mi cuenta" once we know someone is signed in (#129). Same place either way. */
export function AccountLink() {
  const { t } = useT();
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    void getCurrentUser().then(setUser, () => setUser(null));
  }, []);
  return user ? <NavLink href="/cuenta">{t("Mi cuenta", "My account")}</NavLink> : <NavLink href="/entrar">{t("Entrar", "Sign in")}</NavLink>;
}

/** Loads once. A load that fails says so and offers "Reintentar". */
function useDemo<Data>(key: string, load: () => Promise<Data>) {
  const { data, failed, reload } = usePolling(key, load, 0);
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    await reload();
    setRetrying(false);
  };
  return { data, failed, retry, retrying };
}

async function loadShops() {
  const invoices = await getInvoices();
  const shopIds = [...new Set(invoices.map((i) => i.shopId))];
  const shops = (await Promise.all(shopIds.map(getShop))).filter((s): s is Shop => s !== null);
  return { invoices, shops };
}

/** The demo's shops. Each row unfolds to that shop's unpaid invoices and its "Mi cuenta". */
export function ShopLinks() {
  const { t } = useT();
  const { data, failed, retry, retrying } = useDemo("home-shops", loadShops);
  const [open, setOpen] = useState<string | null>(null);

  if (!data) {
    return failed ? (
      <Failure onRetry={retry} busy={retrying}>
        {t("No pudimos cargar las tiendas. Revise su conexión.", "We couldn't load the shops. Check your connection.")}
      </Failure>
    ) : (
      <Loading lines={4} torn={false} />
    );
  }
  if (data.shops.length === 0) return <p className="text-muted">{t("Todavía no hay facturas.", "No invoices yet.")}</p>;
  return (
    <ActionList>
      {data.shops.map((shop) => {
        const unpaid = data.invoices.filter((i) => i.shopId === shop.id && i.status !== "paid");
        const count = t(plural(unpaid.length, "factura por pagar", "facturas por pagar"), plural(unpaid.length, "invoice to pay", "invoices to pay"));
        return (
          <ActionRow key={shop.id} title={shop.name} hint={unpaid.length > 0 ? `${shop.owner} · ${count}` : shop.owner} open={open === shop.id} onClick={() => setOpen(open === shop.id ? null : shop.id)}>
            <ActionList>
              {unpaid.map((invoice) => (
                <ActionLink key={invoice.id} href={`/tienda/${invoice.id}`} title={`${t("Factura", "Invoice")} ${invoice.id}`} figure={<Money value={leftToPay(invoice)} />} />
              ))}
              {unpaid.length === 0 && <p className="text-muted">{t("No tiene facturas pendientes.", "No unpaid invoices.")}</p>}
              <ActionLink href={`/tienda/cuenta/${shop.id}`} title={t("Mi cuenta", "My account")} />
            </ActionList>
          </ActionRow>
        );
      })}
    </ActionList>
  );
}

/** The demo's drivers, each one a way into their route sheet. */
export function DriverLinks() {
  const { t } = useT();
  const { data, failed, retry, retrying } = useDemo("home-drivers", getDrivers);

  if (!data) {
    return failed ? (
      <Failure onRetry={retry} busy={retrying}>
        {t("No pudimos cargar los motoristas. Revise su conexión.", "We couldn't load the drivers. Check your connection.")}
      </Failure>
    ) : (
      <Loading lines={2} torn={false} />
    );
  }
  return (
    <ActionList>
      {data
        .filter((driver) => (driver.distributorId ?? "distributor") === "distributor")
        .map((driver) => (
          <ActionLink key={driver.id} href={`/ruta/${driver.id}`} title={driver.name} hint={t("Ruta de hoy", "Today's route")} />
        ))}
    </ActionList>
  );
}
