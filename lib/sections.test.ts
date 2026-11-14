import { describe, expect, it } from "vitest";
import { sectionInView } from "./sections";

describe("sectionInView", () => {
  const line = 280;

  it("is null above the first section", () => {
    expect(sectionInView([{ id: "facturas", top: 400 }, { id: "tiendas", top: 900 }], line)).toBeNull();
    expect(sectionInView([], line)).toBeNull();
  });

  it("is the section whose top passed the line last", () => {
    expect(sectionInView([{ id: "facturas", top: 100 }, { id: "tiendas", top: 600 }], line)).toBe("facturas");
    expect(sectionInView([{ id: "facturas", top: line }], line)).toBe("facturas");
  });

  it("follows the page, not the order of the list", () => {
    // The dashboard lists Motoristas before Tiendas in its navigation, and shows Tiendas first on the page.
    const tops = [
      { id: "facturas", top: -900 },
      { id: "motoristas", top: 120 },
      { id: "tiendas", top: -200 },
    ];
    expect(sectionInView(tops, line)).toBe("motoristas");
    expect(sectionInView([...tops].reverse(), line)).toBe("motoristas");
  });
});
