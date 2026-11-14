import { describe, expect, it } from "vitest";
import { APP_NAME, TAGLINE, TAGLINE_EN } from "./brand";

describe("brand", () => {
  it("has a product name and a tagline", () => {
    expect(APP_NAME).toBe("Relay");
    expect(TAGLINE).toBe("Del efectivo al crédito");
    expect(TAGLINE_EN).toBe("From cash to credit");
  });
});
