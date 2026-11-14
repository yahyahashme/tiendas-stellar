import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The colour tokens in app/globals.css, checked pair by pair (WCAG 2 contrast).
// AA (4.5:1) for every text and background pair we use; AAA (7:1) for ink, the colour of every amount.

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})\\b`, "i").exec(css);
  if (!match) throw new Error(`--color-${name} is not a hex colour in app/globals.css`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = parseInt(hex.slice(at, at + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(text: string, background: string): number {
  const [light, dark] = [luminance(text), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const AA = 4.5;
const AAA = 7;
const STATUS = ["ok", "warn", "bad", "credit", "brand"];

describe("colour contrast", () => {
  it("ink (every amount) is AAA on paper and on the counter", () => {
    expect(contrast(token("ink"), token("paper"))).toBeGreaterThanOrEqual(AAA);
    expect(contrast(token("ink"), token("counter"))).toBeGreaterThanOrEqual(AAA);
  });

  it("muted text is AA on paper and on the counter", () => {
    expect(contrast(token("muted"), token("paper"))).toBeGreaterThanOrEqual(AA);
    expect(contrast(token("muted"), token("counter"))).toBeGreaterThanOrEqual(AA);
  });

  it("blue words and outlined rows are AA on paper and on the counter", () => {
    expect(contrast(token("brand"), token("paper"))).toBeGreaterThanOrEqual(AA);
    expect(contrast(token("brand"), token("counter"))).toBeGreaterThanOrEqual(AA);
  });

  it("white text is AA on every filled button, resting and pressed", () => {
    for (const fill of ["brand", "brand-press", "bad"]) expect(contrast("#ffffff", token(fill)), fill).toBeGreaterThanOrEqual(AA);
  });

  it.each(STATUS)("%s is AA on paper, on the counter and on its own stamp tint", (name) => {
    expect(contrast(token(name), token("paper")), "on paper").toBeGreaterThanOrEqual(AA);
    expect(contrast(token(name), token("counter")), "on counter").toBeGreaterThanOrEqual(AA);
    expect(contrast(token(name), token(`${name}-tint`)), "on its tint").toBeGreaterThanOrEqual(AA);
  });

  it("a disabled button's words are still readable (muted on counter-rule)", () => {
    expect(contrast(token("muted"), token("counter-rule"))).toBeGreaterThanOrEqual(3);
  });

  it("an input's outline stands out from the paper it sits on (3:1 for shapes)", () => {
    expect(contrast(token("muted"), token("paper"))).toBeGreaterThanOrEqual(3);
  });
});
