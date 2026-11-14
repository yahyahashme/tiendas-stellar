import { dueLabel, fromUnixSeconds, toUnixSeconds } from "./dates";
import { formatUSD } from "./money";

const SECONDS_PER_DAY = 24 * 60 * 60;
const receiptDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/El_Salvador",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const paymentMethods = {
  digital: "Dólares digitales",
  efectivo: "Efectivo",
  credito: "Crédito 7 días",
};

type ReminderInput = {
  phone: string;
  shopName: string;
  amountUnits: bigint;
  dueAt: number;
  now: number;
  link?: string;
  /**
   * Send the message here and not to `phone`: a whole number, country code first. "" opens WhatsApp with no number,
   * and it asks who to send to. The demo uses it, since its shops' numbers are made up (lib/demo-contacts.ts).
   */
  to?: string;
};

function localPhoneDigits(phone: string): string {
  const compact = phone.replace(/[ -]/g, "").replace(/^\+/, "");
  const digits = /^503\d{8}$/.test(compact) ? compact.slice(3) : compact;
  if (!/^[267]\d{7}$/.test(digits)) {
    throw new Error("Número de teléfono inválido: use 8 dígitos de El Salvador, por ejemplo 7123-4567");
  }
  return digits;
}

function whatsappLink(digits: string, message: string): string {
  return `https://wa.me/503${digits}?text=${encodeURIComponent(message)}`;
}

export function reminderLink({
  phone,
  shopName,
  amountUnits,
  dueAt,
  now,
  link,
  to,
}: ReminderInput): string {
  const digits = localPhoneDigits(phone);
  if (amountUnits <= 0n) throw new Error("Monto inválido.");

  const amount = formatUSD(amountUnits);
  const deadline = dueLabel(dueAt, now);
  const reminder = deadline
    ? `le recordamos que su pago de ${amount} ${deadline}`
    : `le recordamos su pago pendiente de ${amount}`;
  const paymentLink = link?.trim();
  const howToPay = paymentLink ? ` Puede pagar aquí: ${paymentLink}` : "";
  const message = `Hola ${shopName}, ${reminder}.${howToPay} ¡Gracias!`;

  if (to !== undefined) return `https://wa.me/${to.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  return whatsappLink(digits, message);
}

export function driverInviteLink({ phone, driverName, distributorName, link }: {
  phone: string;
  driverName: string;
  distributorName: string;
  link: string;
}): string {
  const message = `Hola ${driverName}, ${distributorName} lo invitó a Relay para ver su ruta del día. Cree su cuenta aquí: ${link}`;
  return whatsappLink(localPhoneDigits(phone), message);
}

export function shopInviteLink({ phone, shopName, distributorName, link }: {
  phone: string;
  shopName: string;
  distributorName: string;
  link: string;
}): string {
  const message = `Hola ${shopName}, ${distributorName} ya usa Relay para sus facturas. Cree su cuenta gratis y pague sus pedidos desde el teléfono: ${link}`;
  return whatsappLink(localPhoneDigits(phone), message);
}

export function receiptLink({ phone, invoiceId, amountUnits, method, paidAt, driverName }: {
  phone: string;
  shopName: string;
  invoiceId: number | string;
  amountUnits: bigint;
  method: keyof typeof paymentMethods;
  paidAt: number | Date | string;
  driverName?: string;
}): string {
  const digits = localPhoneDigits(phone);
  const seconds = typeof paidAt === "number" ? paidAt : toUnixSeconds(paidAt);
  const date = receiptDate.format(fromUnixSeconds(seconds));
  const amount = formatUSD(amountUnits);
  const delivery = driverName ? ` · Entregado a ${driverName}` : "";
  const message = `Recibo Relay · Factura ${invoiceId} · ${amount} · ${paymentMethods[method]} · ${date}${delivery}`;
  return whatsappLink(digits, message);
}

export function dueTomorrowLink(input: ReminderInput): string {
  const secondsUntilDue = input.dueAt - input.now;
  if (!Number.isFinite(secondsUntilDue) || secondsUntilDue <= 0 || secondsUntilDue > SECONDS_PER_DAY) {
    throw new Error("La deuda no vence mañana.");
  }
  return reminderLink(input);
}

/** A wa.me link to an El Salvador number with any message ready (e.g. a driver invite, #131). */
export function chatLink(phone: string, message: string): string {
  const compact = phone.replace(/[ -]/g, "").replace(/^\+/, "");
  const digits = /^503\d{8}$/.test(compact) ? compact.slice(3) : compact;
  if (!/^[267]\d{7}$/.test(digits)) {
    throw new Error("Número de teléfono inválido: use 8 dígitos de El Salvador, por ejemplo 7123-4567");
  }
  return `https://wa.me/503${digits}?text=${encodeURIComponent(message)}`;
}
