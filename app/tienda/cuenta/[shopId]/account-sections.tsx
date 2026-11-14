"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { OptionLink, OptionList } from "@/components/ticket";
import { formatMoney, plural } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { CreditScoreCard } from "@/components/credit-score-card";
import { creditScore } from "@/lib/credit";
import type { Shop, ShopHistory, Supplier } from "@/lib/types";

// Mi cuenta's list of sections under the paper slip (#127). Money, credit, suppliers and details
// show real data; add/withdraw/receipts and everything under Seguridad open explainers.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-lg font-semibold">{title}</h2>
      <OptionList>{children}</OptionList>
    </section>
  );
}

/** A row that isn't a link: a label on the left, a value on the right. */
function Row({ label, hint, children }: { label: string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
      <span className="flex flex-col">
        <span className="text-lg font-semibold">{label}</span>
        {hint && <span className="text-sm text-muted">{hint}</span>}
      </span>
      {children !== undefined && <span className="text-lg font-semibold tabular-nums">{children}</span>}
    </div>
  );
}

// WhatsApp reminders on/off: kept on this phone until accounts (#129) store it.
const NOTIFY_KEY = "relay-whatsapp-off";
const notifyListeners = new Set<() => void>();
function readNotifyOff(shopId: string): boolean {
  try {
    return (window.localStorage.getItem(NOTIFY_KEY) ?? "").split(",").includes(shopId);
  } catch {
    return false;
  }
}
function writeNotifyOff(shopId: string, off: boolean) {
  try {
    const ids = new Set((window.localStorage.getItem(NOTIFY_KEY) ?? "").split(",").filter(Boolean));
    if (off) ids.add(shopId);
    else ids.delete(shopId);
    window.localStorage.setItem(NOTIFY_KEY, [...ids].join(","));
  } catch {
    // private mode: the switch still moves, it just isn't remembered
  }
  notifyListeners.forEach((l) => l());
}
let notifyFallback: Record<string, boolean> = {};

function useWhatsAppOn(shopId: string): [boolean, (on: boolean) => void] {
  const off = useSyncExternalStore(
    (l) => {
      notifyListeners.add(l);
      return () => notifyListeners.delete(l);
    },
    () => notifyFallback[shopId] ?? readNotifyOff(shopId),
    () => false,
  );
  return [
    !off,
    (on) => {
      notifyFallback = { ...notifyFallback, [shopId]: !on };
      writeNotifyOff(shopId, !on);
    },
  ];
}

export function AccountSections({
  shop,
  balance,
  suppliers,
  history,
  now,
}: {
  shop: Shop;
  balance: number | null;
  suppliers: Supplier[];
  history: ShopHistory | null;
  now: number;
}) {
  const { t } = useT();
  const base = `/tienda/cuenta/${shop.id}`;
  const info = (topic: string) => `${base}/info/${topic}`;
  const [whatsApp, setWhatsApp] = useWhatsAppOn(shop.id);
  const available = Math.max(0, Math.round((shop.creditLimit - shop.creditOwed) * 100) / 100);

  return (
    <>
      <Section title={t("Dinero", "Money")}>
        <Row label={t("Saldo", "Balance")} hint={t("En dólares digitales", "In digital dollars")}>
          {balance === null ? "—" : formatMoney(balance)}
        </Row>
        <OptionLink href={info("agregar")} title={t("Agregar dinero", "Add money")} hint={t("Con efectivo o desde su banco", "With cash or from your bank")} />
        <OptionLink href={info("retirar")} title={t("Retirar", "Withdraw")} hint={t("A su banco o en efectivo", "To your bank or in cash")} />
        <OptionLink href={`${base}/historial`} title={t("Historial y recibos", "History and receipts")} hint={t("Cada pago, con su recibo", "Every payment, with its receipt")} />
      </Section>

      <Section title={t("Crédito", "Credit")}>
        <OptionLink
          href="#credito"
          title={t("Pagar en 7 días", "Pay in 7 days")}
          hint={
            shop.creditLimit > 0
              ? t(`Límite ${formatMoney(shop.creditLimit)} · disponible ${formatMoney(available)}`, `Limit ${formatMoney(shop.creditLimit)} · available ${formatMoney(available)}`)
              : t("Su tienda no tiene crédito por ahora", "Your shop doesn't have credit for now")
          }
        />
      </Section>

      {history && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-lg font-semibold">{t("Su puntaje Relay", "Your Relay score")}</h2>
          <CreditScoreCard
            score={creditScore(shop, history.rows, suppliers.length, now)}
            shareFrom={{ shopId: shop.id, shopName: shop.name, now }}
          />
        </section>
      )}

      <Section title={t("Proveedores", "Suppliers")}>
        {suppliers.length === 0 ? (
          <Row label={t("Todavía no tiene proveedores en Relay", "No suppliers on Relay yet")} />
        ) : (
          suppliers.map((s) => (
            <Row
              key={s.id}
              label={s.name}
              hint={
                s.unpaid > 0
                  ? t(`${plural(s.invoices, "factura", "facturas")} · ${s.unpaid} por pagar`, `${plural(s.invoices, "invoice", "invoices")} · ${s.unpaid} to pay`)
                  : t(`${plural(s.invoices, "factura", "facturas")} · todo pagado`, `${plural(s.invoices, "invoice", "invoices")} · all paid`)
              }
            />
          ))
        )}
      </Section>

      <Section title={t("Datos personales y de la tienda", "Personal and shop details")}>
        <OptionLink href={`${base}/datos`} title={shop.owner || t("Sus datos", "Your details")} hint={t("Nombre, tienda, dirección, teléfono, DUI", "Name, shop, address, phone, DUI")} />
      </Section>

      <Section title={t("Seguridad", "Security")}>
        <OptionLink href={info("contrasena")} title={t("Cambiar contraseña", "Change password")} hint={t("Y cómo entrar sin su teléfono", "And how to sign in without your phone")} />
        <OptionLink href={info("llaves")} title={t("Llaves de acceso", "Passkeys")} hint={t("Entrar con su huella o su cara", "Sign in with your fingerprint or face")} />
        <OptionLink href={info("dispositivos")} title={t("Dispositivos", "Devices")} hint={t("Dónde está abierta su cuenta", "Where your account is open")} />
        <OptionLink href={info("contactos")} title={t("Contactos de confianza", "Trusted contacts")} hint={t("Si no puede entrar, o si fallece", "If you can't get in, or if you die")} />
      </Section>

      <Section title={t("Notificaciones", "Notifications")}>
        <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 py-2">
          <span className="flex flex-col">
            <span className="text-lg font-semibold">{t("Recordatorios por WhatsApp", "WhatsApp reminders")}</span>
            <span className="text-sm text-muted">{t("Antes de que venza una deuda", "Before a debt is due")}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={whatsApp}
            onChange={(e) => setWhatsApp(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-8 w-14 shrink-0 rounded-full bg-line transition-colors duration-150 peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-150 peer-checked:after:translate-x-6"
          />
        </label>
      </Section>

      <Section title={t("Ayuda y cuenta", "Help and account")}>
        <OptionLink href={info("ayuda")} title={t("Ayuda", "Help")} hint={t("Hable con una persona por WhatsApp", "Talk to a person on WhatsApp")} />
        <OptionLink href={info("cerrar")} title={t("Cerrar cuenta", "Close account")} />
      </Section>
    </>
  );
}
