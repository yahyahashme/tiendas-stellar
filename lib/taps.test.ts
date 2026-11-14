import { describe, expect, it } from "vitest";
import { isStrayTap, isTooSoon, SAME_SPOT_MS, SAME_SPOT_PX } from "./taps";

const at = (x: number, y: number, time: number) => ({ x, y, at: time });

describe("isStrayTap", () => {
  it("is stray when the tap before was at the same spot, a moment ago, on something else", () => {
    expect(isStrayTap(at(180, 500, 0), at(184, 505, 1000), false)).toBe(true);
    expect(isStrayTap(at(180, 500, 0), at(180, 500, 2000), false)).toBe(true); // taps two seconds apart
  });

  it("lets a double tap on the same button through (the tap shield takes the second)", () => {
    expect(isStrayTap(at(180, 500, 0), at(180, 500, 120), true)).toBe(false);
  });

  it("lets a tap through when the thumb moved to the button", () => {
    expect(isStrayTap(at(180, 440, 0), at(180, 440 + SAME_SPOT_PX + 1, 800), false)).toBe(false);
  });

  it("lets a tap through after a pause", () => {
    expect(isStrayTap(at(180, 500, 0), at(180, 500, SAME_SPOT_MS + 1), false)).toBe(false);
  });

  it("lets the first tap on a screen through", () => {
    expect(isStrayTap(null, at(180, 500, 0), false)).toBe(false);
  });
});

describe("isTooSoon", () => {
  it("ignores an answer that comes within the gap of the question (the second half of a double tap)", () => {
    expect(isTooSoon(1000, 1150, 600)).toBe(true);
    expect(isTooSoon(1000, 1599, 600)).toBe(true);
  });

  it("takes an answer once the gap has passed", () => {
    expect(isTooSoon(1000, 1600, 600)).toBe(false);
    expect(isTooSoon(1000, 3000, 600)).toBe(false);
  });
});
