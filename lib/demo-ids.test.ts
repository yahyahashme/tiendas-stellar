import { describe, expect, it } from "vitest";
import { firstFreeId, nextDemoId } from "./demo-ids";

describe("demo invoice numbers", () => {
  it("count on from the demo's own range, ignoring other numbers on the contract", () => {
    expect(nextDemoId([])).toBe(1001n);
    expect(nextDemoId([1001n, 1008n, 1004n])).toBe(1009n);
    expect(nextDemoId([1001n, 1008n, 998473n, 910131n])).toBe(1009n); // a test invoice and a real distributor's
    expect(nextDemoId([5n, 998473n])).toBe(1001n);
  });

  it("handles the edges of the range", () => {
    expect(nextDemoId([1000n])).toBe(1001n);
    expect(nextDemoId([1001n])).toBe(1002n);
    expect(nextDemoId([99_998n])).toBe(99_999n);
    expect(nextDemoId([99_999n])).toBe(1001n); // never 100000: back to the start, then step past what's taken
  });

  it("steps past taken numbers, so /demo can't get stuck (Jack's review)", async () => {
    // The newest invoices hold no demo number, but 1001-1009 exist from before.
    const onChain = new Set([1001n, 1002n, 1003n, 1004n, 1005n, 1006n, 1007n, 1008n, 1009n]);
    const taken = async (id: bigint) => onChain.has(id);
    const start = nextDemoId(Array.from({ length: 60 }, (_, i) => 900_000n + BigInt(i)));
    expect(start).toBe(1001n);
    expect(await firstFreeId(start, taken)).toBe(1010n);
    expect(await firstFreeId(1001n, async () => true, 5)).toBeNull();
  });
});
