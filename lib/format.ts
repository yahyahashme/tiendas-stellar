// Display helpers for the screens (dollars as plain numbers).
// Exact money math on contract amounts (bigint units) lives in lib/money.ts (#53).

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 1234.5 -> "$1,234.50" */
export function formatMoney(dollars: number): string {
  return usd.format(dollars);
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EL_SALVADOR_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC-6 all year, no daylight saving

/** An ISO timestamp -> "17 nov" (or "Nov 17" in English), in El Salvador time. */
export function formatDay(iso: string, lang: "es" | "en" = "es"): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const local = new Date(time - EL_SALVADOR_OFFSET_MS);
  const day = local.getUTCDate();
  const month = local.getUTCMonth();
  return lang === "en" ? `${MONTHS_EN[month]} ${day}` : `${day} ${MONTHS[month]}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const localDay = (time: number) => Math.floor((time - EL_SALVADOR_OFFSET_MS) / DAY_MS);

/** "Vence el 17 nov", or "Venció el 17 nov" once that day is over in El Salvador. `now` is in milliseconds. */
export function dueOn(iso: string, now: number, lang: "es" | "en" = "es"): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const past = localDay(time) < localDay(now);
  if (lang === "en") return `${past ? "Was due" : "Due"} ${formatDay(iso, "en")}`;
  return `${past ? "Venció" : "Vence"} el ${formatDay(iso)}`;
}

/** "1 pago" / "2 pagos" */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "+50370000132" -> "7000-0132" (how numbers are written in El Salvador); anything else as it is. */
export function formatPhone(phone: string): string {
  const match = /^\+503(\d{4})(\d{4})$/.exec(phone);
  return match ? `${match[1]}-${match[2]}` : phone;
}
