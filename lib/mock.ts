// In-memory demo data that follows the same rules as the contract
// (contracts/route_ledger/src/lib.rs). Pages never import this file:
// they call lib/api.ts, which uses it while NEXT_PUBLIC_USE_MOCKS isn't "false".
//
// Inside this file money is in whole cents (pool: 7-decimal units, like the
// contract) so sums never drift. Everything returned is in dollars.

import { formatDay, formatMoney, plural } from "./format";
import { buildHistory } from "./history";
import { creditFeeBps } from "./labels";
import { HISTORY_PAGE, type Driver, type Payment, type Profile, type ShopHistory, type Supplier, type Invoice, type InvoiceHistory, type InvoiceRow, type PayMethod, type Pool, type Receipt, type Shop, type Totals } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const CREDIT_DAYS = 7;
const UNITS_PER_CENT = 100_000; // $1 = 10,000,000 units
const LIMIT_STEP = 25_00; // +$25 per on-time repayment...
const LIMIT_CAP = 500_00; // ...up to $500,
const MIN_BORROW_WITH_HALF = 10_00; // or $10 with half of every credited invoice paid up front
const MIN_BORROW_TO_GROW = 40_00; // ...only if the cycle borrowed at least $40,
const RAISE_EVERY_MS = CREDIT_DAYS * DAY_MS; // ...and at most once per credit period
const LENDER_BPS = 50; // the credit fee slides 1.00%-1.50% (lib/labels.ts); lenders always get 0.50%
const GRACE_DAYS = 1; // repaid up to 1 day late still counts as on time (#137)
const MINOR_LATE_DAYS = 7; // 2-7 days late: limit -$25; 8+ days: -$50 and no raise for 4 periods
const MAJOR_LATE_STEP = 50_00;
const NO_RAISE_MS = 4 * CREDIT_DAYS * DAY_MS;

type InvoiceRecord = {
  id: number;
  shopId: string;
  driverId: string;
  amount: number;
  paid: number;
  dueAt: number;
  method?: PayMethod;
  cashClaim?: number;
  creditFee?: number; // units
};
type ShopRecord = {
  id: string;
  name: string;
  owner: string;
  limit: number;
  owed: number;
  dueAt: number; // 0 while nothing is owed
  onTime: number;
  late: number;
  cycleBorrowed: number; // borrowed since owed was last 0
  lastRaiseAt: number; // 0 if never
  halfUpFront: boolean; // every invoice credited this cycle had half or more paid first
  lateMinor: number;
  lateMajor: number;
  maxDaysLate: number;
  firstCreditAt: number; // 0 if never
  noRaiseUntil: number;
  balance: number; // dollars digitales on hand, in cents
  profile: Profile;
};
type DriverRecord = { id: string; name: string; cashHeld: number };
type Store = {
  invoices: InvoiceRecord[];
  shops: ShopRecord[];
  drivers: DriverRecord[];
  pool: { available: number; buffer: number }; // units
  payments: PaymentRecord[]; // every payment, oldest first, for the shop's history (#136)
};
type PaymentRecord = { shopId: string; invoiceId: number | null; method: Payment["method"]; amount: number; at: number; driverId?: string };

const SEED_INVOICES: [number, string, string, number][] = [
  [1001, "tienda-1", "motorista-1", 150_00],
  [1002, "tienda-2", "motorista-1", 85_50],
  [1003, "tienda-3", "motorista-2", 220_00], // over the $200 limit on purpose
  [1004, "tienda-1", "motorista-1", 60_00],
  [1005, "tienda-2", "motorista-2", 130_00],
  [1006, "tienda-3", "motorista-2", 95_25],
  [1007, "tienda-1", "motorista-1", 40_00],
  [1008, "tienda-2", "motorista-1", 175_00],
];
const DEMO_DRIVER: Record<string, string> = {
  "tienda-1": "motorista-1",
  "tienda-2": "motorista-2",
  "tienda-3": "motorista-2",
};
const DISTRIBUTOR_NAME = "Distribuidora El Sol";
const DEMO_AMOUNTS = [45_75, 120_00, 68_40, 99_90, 152_30];

let clock = () => Date.now();
let store: Store | null = null;

function seed(now: number): Store {
  const shop = (id: string, name: string, owner: string, address: string, phone: string, dui: string): ShopRecord => ({
    id, name, owner, limit: 200_00, owed: 0, dueAt: 0, onTime: 0, late: 0, cycleBorrowed: 0, lastRaiseAt: 0,
    halfUpFront: false, lateMinor: 0, lateMajor: 0, maxDaysLate: 0, firstCreditAt: 0, noRaiseUntil: 0,
    balance: 1_000_00, // setup.sh gives each testnet shop $1,000 of test dollars
    profile: { owner, shopName: name, address, phone, dui },
  });
  return {
    invoices: SEED_INVOICES.map(([id, shopId, driverId, amount]) => ({
      id, shopId, driverId, amount, paid: 0, dueAt: now + CREDIT_DAYS * DAY_MS,
    })),
    shops: [
      shop("tienda-1", "Tienda Rosa", "Rosa Martínez", "Col. Escalón, San Salvador", "7012-3456", "04512345-6"),
      shop("tienda-2", "Tienda Don Luis", "Luis Hernández", "Barrio El Centro, Santa Tecla", "7123-4567", "03498765-2"),
      shop("tienda-3", "Mini Súper La Esquina", "Marta López", "Col. Miramonte, San Salvador", "7234-5678", "05276543-1"),
    ],
    drivers: [
      { id: "motorista-1", name: "Carlos", cashHeld: 0 },
      { id: "motorista-2", name: "Ana", cashHeld: 0 },
    ],
    pool: { available: 5_000_00 * UNITS_PER_CENT, buffer: 50_00 * UNITS_PER_CENT }, // deploy.sh seeds $50
    payments: [],
  };
}

function db(): Store {
  return (store ??= seed(clock()));
}

/** Tests only: start again from the seed data, optionally with a fixed clock. */
export function resetMock(now?: () => number) {
  clock = now ?? (() => Date.now());
  store = null;
}

// ---------- conversions ----------

const dollars = (cents: number) => cents / 100;
const money = (cents: number) => formatMoney(dollars(cents));
const iso = (time: number) => new Date(time).toISOString();
const bps = (units: number, rate: number) => Math.floor((units * rate) / 10_000);

/** Dollars from the screens -> whole cents, or null if it isn't a usable amount. */
function toCents(amount: number): number | null {
  const cents = Math.round(amount * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

function toInvoice(r: InvoiceRecord): Invoice {
  const invoice: Invoice = {
    id: r.id,
    shopId: r.shopId,
    driverId: r.driverId,
    amount: dollars(r.amount),
    paid: dollars(r.paid),
    dueDate: iso(r.dueAt),
    status: r.paid >= r.amount ? "paid" : r.paid > 0 ? "part_paid" : "due",
  };
  if (r.method) invoice.method = r.method;
  if (r.cashClaim !== undefined) invoice.cashClaim = dollars(r.cashClaim);
  if (r.creditFee) invoice.creditFee = r.creditFee / (UNITS_PER_CENT * 100);
  return invoice;
}

function toShop(s: ShopRecord): Shop {
  const shop: Shop = {
    id: s.id,
    name: s.name,
    owner: s.owner,
    creditLimit: dollars(s.limit),
    creditOwed: dollars(s.owed),
    overdue: s.owed > 0 && clock() > s.dueAt,
    onTime: s.onTime,
    late: s.late,
    lateMinor: s.lateMinor,
    lateMajor: s.lateMajor,
    maxDaysLate: s.maxDaysLate,
  };
  if (s.owed > 0) shop.creditDue = iso(s.dueAt);
  if (s.firstCreditAt > 0) shop.firstCredit = iso(s.firstCreditAt);
  return shop;
}

function nextMethod(current: PayMethod | undefined, method: PayMethod): PayMethod {
  return !current || current === method ? method : "mixed";
}

const ok = (message: string): Receipt => ({ ok: true, message });
const fail = (message: string): Receipt => ({ ok: false, message });

const findInvoice = (id: number) => db().invoices.find((i) => i.id === id);
const findShop = (id: string) => db().shops.find((s) => s.id === id);

// ---------- reads ----------

export function getInvoices(): Invoice[] {
  return [...db().invoices].sort((a, b) => a.id - b.id).map(toInvoice);
}

/** The dashboard in demo mode: always Distribuidora El Sol. */
export function getDistributorView(pages: number) {
  const { invoices, total } = getInvoiceHistory(pages);
  const shops = db().shops.map((s) => getShop(s.id)).filter((s): s is Shop => s !== null);
  return {
    scope: { id: "distributor", name: "Distribuidora El Sol", isDemo: true },
    invoices,
    total,
    totals: getTotals(),
    drivers: getDrivers(),
    shops,
  };
}

export function getInvoiceHistory(pages: number): InvoiceHistory {
  const all = getInvoices().reverse();
  return { invoices: all.slice(0, Math.max(1, pages) * HISTORY_PAGE), total: all.length };
}

/** Demo data only tracks one method per invoice, so a mixed invoice counts as digital here. */
export function getTotals(): Totals {
  const totals: Totals = { invoices: db().invoices.length, digital: 0, cash: 0, credit: 0 };
  for (const invoice of db().invoices) {
    const paid = dollars(invoice.paid);
    if (invoice.method === "cash") totals.cash += paid;
    else if (invoice.method === "credit") totals.credit += paid;
    else totals.digital += paid;
  }
  return totals;
}

export function getInvoice(id: number): Invoice | null {
  const invoice = findInvoice(id);
  return invoice ? toInvoice(invoice) : null;
}

export function getShop(shopId: string): Shop | null {
  const shop = findShop(shopId);
  return shop ? toShop(shop) : null;
}

export function getDrivers(): Driver[] {
  return db().drivers.map((d) => ({ ...d, cashHeld: dollars(d.cashHeld) }));
}

export function getPool(): Pool {
  const { available, buffer } = db().pool;
  return { available: available / (100 * UNITS_PER_CENT), buffer: buffer / (100 * UNITS_PER_CENT) };
}

export function createDemoInvoice(shopId?: string): Invoice {
  const { invoices, shops } = db();
  const id = Math.max(1000, ...invoices.map((i) => i.id)) + 1;
  const shop = shopId ? findShop(shopId) : shops[id % shops.length];
  if (!shop) throw new Error("Tienda desconocida.");
  const record: InvoiceRecord = {
    id,
    shopId: shop.id,
    driverId: DEMO_DRIVER[shop.id] ?? "motorista-1",
    amount: DEMO_AMOUNTS[id % DEMO_AMOUNTS.length],
    paid: 0,
    dueAt: clock() + CREDIT_DAYS * DAY_MS,
  };
  invoices.push(record);
  return toInvoice(record);
}

// ---------- writes (same checks, in the same order, as the contract) ----------

function logPayment(shopId: string, invoiceId: number | null, method: Payment["method"], amount: number, driverId?: string) {
  db().payments.push({ shopId, invoiceId, method, amount, at: clock(), driverId });
}

/** Every payment the shop made and what it still owes, newest first (#136). */
export function getShopHistory(shopId: string): ShopHistory | null {
  const shop = findShop(shopId);
  if (!shop) return null;
  return buildHistory({
    invoices: db().invoices.filter((i) => i.shopId === shopId).map(toInvoice),
    payments: db()
      .payments.filter((p) => p.shopId === shopId)
      .map((p) => ({ invoiceId: p.invoiceId, method: p.method, amount: dollars(p.amount), at: iso(p.at), driverId: p.driverId })),
    creditOwed: dollars(shop.owed),
    creditDue: shop.owed > 0 ? iso(shop.dueAt) : undefined,
    distributor: DISTRIBUTOR_NAME,
    now: clock(),
  });
}

/** The shop's dollars digitales on hand. */
export function getBalance(shopId: string): number | null {
  const shop = findShop(shopId);
  return shop ? dollars(shop.balance) : null;
}

/** The distributors this shop buys from. The demo has one. */
export function getSuppliers(shopId: string): Supplier[] {
  const mine = db().invoices.filter((i) => i.shopId === shopId);
  if (mine.length === 0) return [];
  return [{ id: "distributor", name: DISTRIBUTOR_NAME, invoices: mine.length, unpaid: mine.filter((i) => i.paid < i.amount).length }];
}

export function getProfile(shopId: string): Profile | null {
  const shop = findShop(shopId);
  return shop ? { ...shop.profile } : null;
}

/** Checks and saves the shop's details. The shop's name on screen follows the new one. */
export function saveProfile(shopId: string, profile: Profile): Receipt {
  const shop = findShop(shopId);
  if (!shop) return fail("No encontramos esa tienda.");
  const clean = Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, String(v ?? "").trim()])) as Profile;
  if (!clean.owner) return fail("Escriba su nombre.");
  if (!clean.shopName) return fail("Escriba el nombre de la tienda.");
  if (clean.phone && !/^\+?[\d\s-]{8,15}$/.test(clean.phone)) return fail("Revise el teléfono.");
  if (clean.dui && !/^\d{8}-?\d$/.test(clean.dui)) return fail("Revise el DUI (9 números).");
  shop.profile = clean;
  shop.owner = clean.owner;
  shop.name = clean.shopName;
  return ok("Datos guardados.");
}

export function payNow(invoiceId: number, amount?: number): Receipt {
  const invoice = findInvoice(invoiceId);
  if (!invoice) return fail("No encontramos esa factura.");
  if (invoice.paid >= invoice.amount) return fail("Esta factura ya está pagada.");
  const left = invoice.amount - invoice.paid;
  const pay = amount === undefined ? left : toCents(amount);
  if (pay === null) return fail("Monto inválido.");
  if (pay > left) return fail(`El monto es mayor que lo que falta pagar (${money(left)}).`);

  invoice.paid += pay;
  invoice.method = nextMethod(invoice.method, "digital");
  logPayment(invoice.shopId, invoice.id, "digital", pay);
  const payer = findShop(invoice.shopId);
  if (payer) payer.balance = Math.max(0, payer.balance - pay);
  return pay === left
    ? ok(`Pago recibido: ${money(pay)} en dólares digitales.`)
    : ok(`Pago recibido: ${money(pay)}. Falta ${money(left - pay)}.`);
}

export function payLater(invoiceId: number): Receipt {
  const invoice = findInvoice(invoiceId);
  if (!invoice) return fail("No encontramos esa factura.");
  if (invoice.paid >= invoice.amount) return fail("Esta factura ya está pagada.");
  const shop = findShop(invoice.shopId);
  if (!shop) return fail("Esta tienda todavía no tiene crédito.");
  const now = clock();
  if (shop.owed > 0 && now > shop.dueAt) return fail("Tiene un pago vencido.");
  const amount = invoice.amount - invoice.paid;
  if (shop.owed + amount > shop.limit) return fail("Supera su límite de crédito.");

  const units = amount * UNITS_PER_CENT;
  // No usage fee on credit: our cut is inside the credit fee, which slides from 1.50% (all on
  // credit, $98.50 per $100) down to 1.00% the more the shop paid up front (#135).
  const rate = creditFeeBps(amount, invoice.amount);
  const rest = rate - LENDER_BPS; // splits 3:1 buffer : us, the odd part to the buffer
  const ours = bps(units, Math.floor(rest / 4));
  const toBuffer = bps(units, rest - Math.floor(rest / 4));
  const payout = units - bps(units, rate);
  const fromPool = payout + ours + toBuffer;
  const { pool } = db();
  if (pool.available < fromPool) return fail("Hoy no hay fondos para crédito. Intente más tarde.");

  pool.available -= fromPool;
  pool.buffer += toBuffer;
  if (shop.owed === 0) {
    shop.dueAt = now + CREDIT_DAYS * DAY_MS;
    shop.cycleBorrowed = 0;
    shop.halfUpFront = true;
  }
  if (shop.firstCreditAt === 0) shop.firstCreditAt = now;
  shop.halfUpFront &&= invoice.paid * 2 >= invoice.amount;
  shop.owed += amount;
  shop.cycleBorrowed += amount;
  invoice.creditFee = units - payout;
  logPayment(shop.id, invoice.id, "credit", amount);
  invoice.paid = invoice.amount;
  invoice.method = nextMethod(invoice.method, "credit");
  return ok(`Listo. Tiene hasta el ${formatDay(iso(shop.dueAt))} para pagar ${money(amount)}, sin intereses.`);
}

export function claimCash(invoiceId: number, amount: number): Receipt {
  const invoice = findInvoice(invoiceId);
  if (!invoice) return fail("No encontramos esa factura.");
  if (invoice.paid >= invoice.amount) return fail("Esta factura ya está pagada.");
  const cash = toCents(amount);
  if (cash === null) return fail("Monto inválido.");
  if (cash > invoice.amount - invoice.paid) return fail("El monto es mayor que lo que falta pagar.");

  invoice.cashClaim = cash;
  return ok("Listo. Ahora la tienda debe tocar «Confirmo».");
}

export function confirmCash(invoiceId: number, amount: number): Receipt {
  const invoice = findInvoice(invoiceId);
  if (!invoice) return fail("No encontramos esa factura.");
  const cash = invoice.cashClaim;
  if (cash === undefined) return fail("El motorista aún no registró el efectivo.");
  if (cash !== toCents(amount)) {
    return fail("El motorista cambió el monto. Revise el nuevo monto y confirme de nuevo.");
  }
  if (invoice.paid >= invoice.amount) return fail("Esta factura ya está pagada.");
  if (cash > invoice.amount - invoice.paid) return fail("El efectivo registrado es mayor que lo que falta pagar.");

  invoice.paid += cash;
  logPayment(invoice.shopId, invoice.id, "cash", cash, invoice.driverId);
  invoice.method = nextMethod(invoice.method, "cash");
  delete invoice.cashClaim;
  const driver = db().drivers.find((d) => d.id === invoice.driverId);
  if (driver) driver.cashHeld += cash;
  return ok(`Listo. Confirmó ${money(cash)} en efectivo.`);
}

export function repay(shopId: string, amount: number): Receipt {
  const shop = findShop(shopId);
  if (!shop || shop.owed === 0) return fail("No tiene deudas pendientes.");
  const pay = toCents(amount);
  if (pay === null || pay > shop.owed) return fail("Monto inválido.");

  db().pool.available += pay * UNITS_PER_CENT;
  shop.owed -= pay;
  logPayment(shop.id, null, "repay", pay);
  shop.balance = Math.max(0, shop.balance - pay);
  if (shop.owed > 0) return ok(`Pago recibido: ${money(pay)}. Falta ${money(shop.owed)}.`);

  const now = clock();
  const daysLate = now <= shop.dueAt ? 0 : Math.ceil((now - shop.dueAt) / DAY_MS);
  const bigEnough = shop.cycleBorrowed >= MIN_BORROW_TO_GROW || (shop.halfUpFront && shop.cycleBorrowed >= MIN_BORROW_WITH_HALF);
  shop.dueAt = 0;
  shop.cycleBorrowed = 0;
  shop.halfUpFront = false;
  shop.maxDaysLate = Math.max(shop.maxDaysLate, daysLate);
  if (daysLate > GRACE_DAYS) {
    shop.late += 1;
    if (daysLate <= MINOR_LATE_DAYS) {
      shop.lateMinor += 1;
      shop.limit = Math.max(shop.limit - LIMIT_STEP, 0);
    } else {
      shop.lateMajor += 1;
      shop.limit = Math.max(shop.limit - MAJOR_LATE_STEP, 0);
      shop.noRaiseUntil = now + NO_RAISE_MS;
    }
    return ok(`Deuda pagada con atraso. Su límite bajó a ${money(shop.limit)}.`);
  }
  shop.onTime += 1;
  const waited = shop.lastRaiseAt === 0 || now >= shop.lastRaiseAt + RAISE_EVERY_MS;
  if (shop.limit >= LIMIT_CAP || !bigEnough || !waited || now < shop.noRaiseUntil) {
    return ok("Deuda pagada a tiempo. Gracias.");
  }
  shop.limit = Math.min(shop.limit + LIMIT_STEP, LIMIT_CAP);
  shop.lastRaiseAt = now;
  return ok(`Deuda pagada a tiempo. Su límite subió a ${money(shop.limit)}.`);
}

/** The driver handed cash to the distributor at the warehouse. Lowers what the driver holds. */
export function handInCash(driverId: string, amount: number): Receipt {
  const driver = db().drivers.find((d) => d.id === driverId);
  if (!driver) return fail("No encontramos a ese motorista.");
  const cash = toCents(amount);
  if (cash === null || cash > driver.cashHeld) return fail("Monto inválido.");
  driver.cashHeld -= cash;
  return ok(`Listo. ${driver.name} entregó ${money(cash)} en efectivo.`);
}

/** Many invoices at once (CSV import, #32). All rows are checked before any is added. */
export function createInvoices(rows: InvoiceRow[]): Receipt {
  const { invoices, drivers } = db();
  const ids = new Set(invoices.map((i) => i.id));
  const records: InvoiceRecord[] = [];
  for (const [index, row] of rows.entries()) {
    const line = `Fila ${index + 1}`;
    if (!Number.isInteger(row.invoiceId) || row.invoiceId <= 0) return fail(`${line}: número de factura inválido.`);
    if (ids.has(row.invoiceId)) return fail(`${line}: la factura ${row.invoiceId} ya existe.`);
    if (!findShop(row.shopId)) return fail(`${line}: tienda desconocida.`);
    if (!drivers.some((d) => d.id === row.driverId)) return fail(`${line}: motorista desconocido.`);
    const amount = /^\d+(\.\d{1,7})?$/.test(row.amount.trim()) ? toCents(Number(row.amount)) : null;
    if (amount === null) return fail(`${line}: monto inválido.`);
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(row.dueDate.trim());
    const dueAt = Date.parse(dateOnly ? `${row.dueDate.trim()}T06:00:00Z` : row.dueDate); // midnight in El Salvador
    if (Number.isNaN(dueAt)) return fail(`${line}: fecha inválida.`);
    ids.add(row.invoiceId);
    records.push({ id: row.invoiceId, shopId: row.shopId, driverId: row.driverId, amount, paid: 0, dueAt });
  }
  if (records.length === 0) return fail("No hay facturas para crear.");
  invoices.push(...records);
  return ok(records.length === 1 ? "Se creó 1 factura." : `Se crearon ${plural(records.length, "factura", "facturas")}.`);
}
