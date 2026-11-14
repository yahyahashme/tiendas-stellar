"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type CurrentUser, getCurrentUser } from "@/app/auth-actions";
import { Logo } from "@/components/logo";
import { ButtonLink, Card, Label, LoadError, Loading, Screen } from "@/components/ui";
import { getDrivers, getInvoices, getShop } from "@/lib/api";
import { TAGLINE } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { leftToPay } from "@/lib/labels";
import type { Shop } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

async function loadHome() {
  const [invoices, drivers] = await Promise.all([getInvoices(), getDrivers()]);
  const shopIds = [...new Set(invoices.map((i) => i.shopId))];
  const shops = (await Promise.all(shopIds.map(getShop))).filter((s): s is Shop => s !== null);
  return { invoices, drivers, shops };
}

export default function Home() {
  const { data, failed } = usePolling("home", loadHome, 0);
  const { t } = useT();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);
  useEffect(() => {
    void getCurrentUser().then(setUser, () => setUser(null));
  }, []);

  return (
    <Screen>
      <header className="flex flex-col gap-1 pt-2">
        <h1>
          <Logo className="h-11 w-auto" />
        </h1>
        <p className="text-xl font-medium text-brand">{TAGLINE}</p>
        <p className="text-lg text-muted text-balance">
          {t(
            "La tienda le paga al distribuidor con dólares digitales, en efectivo o en 7 días sin intereses.",
            "The shop pays its distributor in digital dollars, in cash, or in 7 days with no interest.",
          )}
        </p>
      </header>

      {/* Sign-up / sign-in (#129). Hidden for the instant we don't know yet, so the buttons don't flicker. */}
      <section className={`flex flex-col gap-3 ${user === undefined ? "invisible" : ""}`}>
        {user ? (
          <ButtonLink href="/cuenta">{t("Mi cuenta", "My account")}</ButtonLink>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink href="/registro">{t("Crear cuenta", "Create account")}</ButtonLink>
            <ButtonLink href="/entrar" variant="secondary">
              {t("Entrar", "Sign in")}
            </ButtonLink>
          </div>
        )}
      </section>

      <h2 className="border-t border-line pt-5 text-xl font-semibold">{t("Probar la demo", "Try the demo")}</h2>

      {failed && <LoadError />}
      {!data ? (
        <Loading />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <Label>{t("Distribuidor", "Distributor")}</Label>
            <ButtonLink href="/distribuidor">Distribuidora El Sol</ButtonLink>
          </section>

          <section className="flex flex-col gap-2">
            <Label>{t("Motorista", "Driver")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {data.drivers.filter((driver) => (driver.distributorId ?? "distributor") === "distributor").map((driver) => (
                <ButtonLink key={driver.id} href={`/ruta/${driver.id}`} variant="secondary">
                  {driver.name}
                </ButtonLink>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <Label>{t("Tienda", "Shop")}</Label>
            {data.shops.map((shop) => {
              const unpaid = data.invoices.filter((i) => i.shopId === shop.id && i.status !== "paid");
              return (
                <Card key={shop.id} className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{shop.name}</h2>
                    <p className="text-muted">{shop.owner}</p>
                  </div>
                  {unpaid.length > 0 ? (
                    <ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
                      {unpaid.map((invoice) => (
                        <li key={invoice.id}>
                          <Link
                            href={`/tienda/${invoice.id}`}
                            className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-lg active:bg-brand-soft"
                          >
                            <span>{t("Factura", "Invoice")} {invoice.id}</span>
                            <span className="font-semibold tabular-nums">
                              {formatMoney(leftToPay(invoice))} <span aria-hidden className="text-brand">›</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">{t("No tiene facturas pendientes.", "No unpaid invoices.")}</p>
                  )}
                  <ButtonLink href={`/tienda/cuenta/${shop.id}`} variant="secondary">
                    {t("Mi cuenta", "My account")}
                  </ButtonLink>
                </Card>
              );
            })}
          </section>
        </>
      )}
    </Screen>
  );
}
