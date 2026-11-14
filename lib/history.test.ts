import { beforeEach, describe, expect, it } from "vitest";
import { buildHistory, daysPast } from "./history";
import * as mock from "./mock";

const NOW = Date.parse("2026-11-12T18:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
let now = NOW;

beforeEach(() => {
  now = NOW;
  mock.resetMock(() => now);
});

describe("shop history (#136)", () => {
  it("shows a part-paid invoice as two payment rows, with method and driver", () => {
    mock.payNow(1002, 40); // tienda-2, $85.50
    mock.claimCash(1002, 45.5);
    now = NOW + DAY;
    mock.confirmCash(1002, 45.5);
    const history = mock.getShopHistory("tienda-2")!;
    const rows = history.rows.filter((r) => r.invoiceId === 1002);
    expect(rows.map((r) => [r.kind, r.method, r.amount, r.partial, r.driverId])).toEqual([
      ["payment", "cash", 45.5, true, "motorista-1"],
      ["payment", "digital", 40, true, "motorista-1"],
    ]);
    expect(history.paidThisMonth).toBe(85.5);
  });

  it("lists what's open first, and counts it in what the shop owes now", () => {
    mock.payLater(1005); // $130 on credit
    const history = mock.getShopHistory("tienda-2")!;
    expect(history.rows[0].kind).toBe("open");
    // Open: 1002 ($85.50) + 1008 ($175), plus $130 of credit.
    expect(history.owedNow).toBe(390.5);
    expect(history.nextDue).toBe(new Date(NOW + 7 * DAY).toISOString());
    const credit = history.rows.find((r) => r.invoiceId === 1005)!;
    expect([credit.method, credit.partial]).toEqual(["credit", false]);
    expect(history.paidThisMonth).toBe(0); // credit is paid by the pool, not the shop
  });

  it("marks late payments and overdue invoices with days", () => {
    mock.getInvoices(); // seed while it's still NOW
    now = NOW + 10 * DAY;
    mock.payNow(1002);
    const history = mock.getShopHistory("tienda-2")!;
    expect(history.rows.find((r) => r.invoiceId === 1002)!.daysLate).toBe(3);
    expect(history.rows.find((r) => r.invoiceId === 1005)).toMatchObject({ kind: "open", daysLate: 3 });
  });

  it("adds repayments of credit as their own rows", () => {
    mock.payLater(1005);
    mock.repay("tienda-2", 130);
    const repay = mock.getShopHistory("tienda-2")!.rows.find((r) => r.method === "repay")!;
    expect([repay.invoiceId, repay.amount]).toEqual([null, 130]);
  });

  it("shows payments older than the events it can read as one undated row", () => {
    const history = buildHistory({
      invoices: [{ id: 7, shopId: "s", driverId: "d", amount: 100, paid: 100, dueDate: "2026-11-01T00:00:00Z", status: "paid", method: "cash" }],
      payments: [],
      creditOwed: 0,
      distributor: "El Sol",
      now: NOW,
    });
    expect(history.rows).toEqual([expect.objectContaining({ kind: "payment", method: "cash", amount: 100, partial: false })]);
    expect(history.rows[0].at).toBeUndefined();
  });

  it("counts days past due, rounding up", () => {
    expect(daysPast("2026-11-10T00:00:00Z", Date.parse("2026-11-10T00:00:00Z"))).toBe(0);
    expect(daysPast("2026-11-10T00:00:00Z", Date.parse("2026-11-10T01:00:00Z"))).toBe(1);
  });
});
