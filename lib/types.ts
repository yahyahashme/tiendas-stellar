export type InvoiceStatus = "due" | "part_paid" | "paid";
export type PayMethod = "digital" | "cash" | "credit" | "mixed";
export type Invoice = { id: number; shopId: string; driverId: string; amount: number; paid: number; dueDate: string; status: InvoiceStatus; method?: PayMethod; cashClaim?: number; creditFee?: number };
export type Shop = {
  id: string; name: string; owner: string; creditLimit: number; creditOwed: number; creditDue?: string; overdue: boolean;
  onTime: number;
  /** All late repayments (and defaults). `lateMinor` = 2-7 days late, `lateMajor` = 8+ days. */
  late: number; lateMinor: number; lateMajor: number;
  /** The most days late it ever repaid; 0 if never late. */
  maxDaysLate: number;
  /** When it first used credit; absent if never. */
  firstCredit?: string;
  writtenOff?: number;
};
export type Driver = { id: string; name: string; cashHeld: number; distributorId?: string };
export type Pool = { available: number; buffer: number };
/** Everything ever paid, by method (dollars), and how many invoices exist. */
export type Totals = { invoices: number; digital: number; cash: number; credit: number };
/** Newest first, `pages` pages of `HISTORY_PAGE`; `total` is how many exist. */
export type InvoiceHistory = { invoices: Invoice[]; total: number };
export const HISTORY_PAGE = 30; // the contract's MAX_PAGE
/** A shop's own details (Mi cuenta → Datos). Until accounts (#129) they live with the demo data. */
export type Profile = { owner: string; shopName: string; address: string; phone: string; dui: string };
/** A distributor the shop buys from, and how many of its invoices the shop has. */
export type Supplier = { id: string; name: string; invoices: number; unpaid: number };
/** One payment the shop made, as the contract or the mock recorded it (#136). */
export type Payment = {
  /** null for a repayment of credit (not tied to one invoice). */
  invoiceId: number | null;
  method: "digital" | "cash" | "credit" | "repay";
  amount: number;
  /** ISO time it happened; absent when it's older than what can be looked up. */
  at?: string;
  driverId?: string;
  txHash?: string;
};
/** A row of the shop's history: a payment, or what's still open on an invoice. */
export type HistoryRow = {
  key: string;
  kind: "payment" | "open";
  invoiceId: number | null;
  distributor: string;
  driverId?: string;
  method?: Payment["method"];
  /** Paid in this row, or left to pay on an open row. */
  amount: number;
  /** This payment covered only part of its invoice. */
  partial: boolean;
  at?: string;
  dueDate?: string;
  /** Payment: days after the due date it was paid. Open: days past due now. */
  daysLate: number;
  explorerUrl?: string;
};
export type ShopHistory = { rows: HistoryRow[]; owedNow: number; nextDue?: string; paidThisMonth: number };
export type Receipt = { ok: boolean; message: string; txHash?: string; explorerUrl?: string };
export type InvoiceRow = { invoiceId: number; shopId: string; driverId: string; amount: string; dueDate: string };
