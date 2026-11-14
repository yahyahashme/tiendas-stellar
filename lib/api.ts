// The only data layer pages call. Signatures stay the same with mocks or the
// real contract: only the inside of this file changes.
//
// Mock mode unless NEXT_PUBLIC_USE_MOCKS is "false". Mocks wait 1 second so
// the screens show "Cargando..." like they will on a slow connection.
// Live mode calls the server actions in app/actions.ts (testnet, signed on the server).
// Writes never throw: they return { ok: false, message } in Spanish.

import * as live from "@/app/actions";
import * as distributors from "@/app/distributor-actions";
import * as shops from "@/app/shop-actions";
import * as invoices from "@/app/invoice-actions";
import type { DistributorView } from "@/app/distributor-actions";
import * as mock from "./mock";
import type { Driver, Invoice, InvoiceHistory, InvoiceRow, Pool, Profile, Receipt, Shop, ShopHistory, Supplier, Totals } from "./types";

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const MOCK_DELAY_MS = 1000;
const NOT_CONNECTED = "Todavía no está conectado al contrato.";

const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

async function read<T>(mockRead: () => T, liveRead?: () => Promise<T>): Promise<T> {
  if (!USE_MOCKS) {
    if (!liveRead) throw new Error(NOT_CONNECTED);
    return liveRead();
  }
  await wait();
  return mockRead();
}

async function write(mockWrite: () => Receipt, liveWrite?: () => Promise<Receipt>): Promise<Receipt> {
  try {
    if (!USE_MOCKS) return liveWrite ? await liveWrite() : { ok: false, message: NOT_CONNECTED }; // not wired yet: CSV import (#32)
    await wait();
    return mockWrite();
  } catch {
    return { ok: false, message: "Algo salió mal. Intente de nuevo." };
  }
}

// ---------- reads ----------

export const getInvoices = (): Promise<Invoice[]> => read(mock.getInvoices, live.getInvoices);
export const getInvoice = (id: number): Promise<Invoice | null> =>
  read(() => mock.getInvoice(id), () => live.getInvoice(id));
export const getShop = (shopId: string): Promise<Shop | null> =>
  read(() => mock.getShop(shopId), () => live.getShop(shopId));
export const getDrivers = (): Promise<Driver[]> => read(mock.getDrivers, live.getDrivers);
export const getPool = (): Promise<Pool> => read(mock.getPool, live.getPool);
/** The whole history a page at a time: `pages` pages, newest first. */
export const getInvoiceHistory = (pages: number): Promise<InvoiceHistory> =>
  read(() => mock.getInvoiceHistory(pages), () => live.getInvoiceHistory(pages));
/** The distributor dashboard for whoever is looking: their own business once approved (#130), else the demo. */
export const getDistributorView = (pages: number): Promise<DistributorView> =>
  read(() => mock.getDistributorView(pages), () => distributors.getDistributorView(pages));
/** Notes / products on these invoices (#133); the demo's have none. */
export const getInvoiceNotes = (ids: number[]) => read(() => ({}) as Record<number, string>, () => invoices.getInvoiceNotes(ids));
/** Who sent an invoice, and its note (#133). The demo's come from Distribuidora El Sol. */
export const getInvoiceSource = (id: number) =>
  read(() => ({ distributorName: "Distribuidora El Sol", note: null as string | null }), () => invoices.getInvoiceSource(id));
/** Claim codes for the stops on a route, shown only to that driver or their distributor (#132). */
export const getRouteInvites = (driverId: string, shopIds: string[]) =>
  read(() => ({ distributorName: "", codes: {} as Record<string, string> }), () => shops.getRouteInvites(driverId, shopIds));
/** Everything ever paid, by method, for the dashboard's totals. */
export const getTotals = (): Promise<Totals> => read(mock.getTotals, live.getTotals);
/** Every payment the shop made, and what it still owes, newest first (#136). */
export const getShopHistory = (shopId: string): Promise<ShopHistory | null> =>
  read(() => mock.getShopHistory(shopId), () => live.getShopHistory(shopId));
/** The shop's dollars digitales on hand. */
export const getBalance = (shopId: string): Promise<number | null> =>
  read(() => mock.getBalance(shopId), () => live.getBalance(shopId));
export const getSuppliers = (shopId: string): Promise<Supplier[]> =>
  read(() => mock.getSuppliers(shopId), () => live.getSuppliers(shopId));
// The shop's details aren't on chain. Until accounts (#129) they stay with the demo data in both modes.
export const getProfile = (shopId: string): Promise<Profile | null> => read(() => mock.getProfile(shopId), async () => mock.getProfile(shopId));
export const saveProfile = (shopId: string, profile: Profile) =>
  write(() => mock.saveProfile(shopId, profile), async () => mock.saveProfile(shopId, profile));
export const createDemoInvoice = (shopId?: string): Promise<Invoice> =>
  read(() => mock.createDemoInvoice(shopId), () => live.createDemoInvoice());

// ---------- writes ----------

/** No amount = pay what's left. */
export const payNow = (invoiceId: number, amount?: number) =>
  write(() => mock.payNow(invoiceId, amount), () => live.payNow(invoiceId, amount));
export const payLater = (invoiceId: number) =>
  write(() => mock.payLater(invoiceId), () => live.payLater(invoiceId));
export const claimCash = (invoiceId: number, amount: number) =>
  write(() => mock.claimCash(invoiceId, amount), () => live.claimCash(invoiceId, amount));
/** `amount` is the claim the shop saw: if the driver changed it since, nothing happens. */
export const confirmCash = (invoiceId: number, amount: number) =>
  write(() => mock.confirmCash(invoiceId, amount), () => live.confirmCash(invoiceId, amount));
export const repay = (shopId: string, amount: number) =>
  write(() => mock.repay(shopId, amount), () => live.repay(shopId, amount));
/** The distributor got a driver's cash at the warehouse (only lowers the driver's cash count). */
export const handInCash = (driverId: string, amount: number) =>
  write(() => mock.handInCash(driverId, amount), () => live.handInCash(driverId, amount));
/** CSV import (#32): checks every row, then creates them one by one. */
export const createInvoices = (rows: InvoiceRow[]) =>
  write(() => mock.createInvoices(rows), () => live.createInvoices(rows));
