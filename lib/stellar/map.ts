import "server-only";

import type { Invoice as ChainInvoice, ShopView } from "@/packages/route_ledger/src/index";
import type { Invoice, InvoiceStatus, PayMethod, Shop } from "@/lib/types";
import type { Directory, Party } from "@/lib/server/directory";
import { toDollars } from "./units";

const STATUS: Record<string, InvoiceStatus> = { Due: "due", PartPaid: "part_paid", Paid: "paid" };
const METHOD: Record<string, PayMethod | undefined> = {
  None: undefined,
  Digital: "digital",
  Cash: "cash",
  Credit: "credit",
  Mixed: "mixed",
};

const iso = (unixSeconds: bigint) => new Date(Number(unixSeconds) * 1000).toISOString();

/** Contract invoice (bigint units, addresses) -> what the screens use (dollars, role ids). */
/** `cashClaim` = units a driver says they got in cash and the shop hasn't confirmed (0 = none). */
export function toInvoice(i: ChainInvoice, directory: Directory, cashClaim = 0n): Invoice {
  const invoice: Invoice = {
    id: Number(i.id),
    shopId: directory.idOf(i.shop),
    driverId: directory.idOf(i.driver),
    amount: toDollars(i.amount),
    paid: toDollars(i.paid),
    dueDate: iso(i.due),
    status: STATUS[i.status.tag] ?? "due",
  };
  const method = METHOD[i.method.tag];
  if (method) invoice.method = method;
  if (cashClaim > 0n) invoice.cashClaim = toDollars(cashClaim);
  if (i.credit_fee > 0n) invoice.creditFee = toDollars(i.credit_fee);
  return invoice;
}

export function toShop(party: Party, v: ShopView, directory?: Directory): Shop {
  const shop: Shop = {
    id: party.id,
    name: party.name,
    owner: party.owner,
    creditLimit: toDollars(v.limit),
    creditOwed: toDollars(v.owed),
    overdue: v.overdue,
    onTime: v.on_time,
    late: v.late,
    lateMinor: v.late_minor,
    lateMajor: v.late_major,
    maxDaysLate: v.max_days_late,
    goodCycles: v.good_cycles,
  };
  if (v.owed > 0n && v.due_at > 0n) shop.creditDue = iso(v.due_at);
  if (v.first_credit_at > 0n) shop.firstCredit = iso(v.first_credit_at);
  if (v.written_off > 0n) shop.writtenOff = toDollars(v.written_off);
  if (v.voucher) shop.voucherId = directory ? directory.idOf(v.voucher) : v.voucher;
  if (v.vouched_owed > 0n) shop.vouchedOwed = toDollars(v.vouched_owed);
  if (v.covered_by_distributor > 0n) shop.coveredByDistributor = toDollars(v.covered_by_distributor);
  return shop;
}
