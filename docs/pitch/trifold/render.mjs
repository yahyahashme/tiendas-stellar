// Builds the trifold from docs/pitch/trifold/trifold.html, at the real board's size (9 + 19 + 9 in wide, 27 in tall):
//   out/trifold-9-19-9.pdf     37 x 27 in, text stays text (out/ is git-ignored: share the PDF, don't commit it)
//   out/trifold-9-19-9-left.pdf, -centre.pdf, -right.pdf   one panel per page, for a shop that prints panel by panel
//   preview-9-19-9.jpg         a small picture with the fold marks drawn on, for the pull request
//                              (a .png instead if sips, a macOS tool, isn't there)
//
// Run from anywhere:
//   node docs/pitch/trifold/render.mjs
//   node docs/pitch/trifold/render.mjs --final    also fail while any yellow placeholder is left on the board
//
// Needs Google Chrome or Chromium (set CHROME=/path/to/chrome if yours is somewhere unusual). No npm packages.
// It prints these checks for each layout and exits with an error if one fails:
//   - nothing runs past the bottom of a panel, or past its sides (so nothing crosses a fold)
//   - text covers at most 25% of the board (Velocity's tip, context 3.8)
//   - body text is at least 24 pt (small print for sources is allowed to be smaller; it prints its size)
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
const page = pathToFileURL(join(here, "trifold.html")).href;

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];
const CHROME = process.env.CHROME || CHROME_PATHS.find((p) => existsSync(p)) || "";
const die = (msg) => {
  console.error(`render.mjs: ${msg}`);
  process.exit(1);
};
if (!CHROME || !existsSync(CHROME)) die(`Chrome not found${CHROME ? ` at ${CHROME}` : ""}. Set CHROME=/path/to/chrome.`);

const LAYOUTS = { real: { name: "9-19-9", label: "9 + 19 + 9 in, 27 in tall", widths: [9, 19, 9] } };
const args = process.argv.slice(2);
const final = args.includes("--final");
const keys = Object.keys(LAYOUTS);
const unknown = args.filter((a) => a !== "--final");
if (unknown.length) die(`unknown argument: ${unknown.join(", ")}. The only option is --final.`);

mkdirSync(outDir, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "trifold-chrome-"));
const BOARD_PX = "3552,2592"; // 37 x 27 in at 96 px per inch

function chrome(extra, url) {
  return execFileSync(
    CHROME,
    ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${profile}`, "--virtual-time-budget=8000", ...extra, url],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
  );
}

let failed = false;
for (const key of keys) {
  const { name, label, widths } = LAYOUTS[key];
  const url = `${page}?board=${name}`;

  // 1. The layout checks, read from the page itself.
  const dom = chrome([`--window-size=${BOARD_PX}`, "--force-device-scale-factor=1", "--dump-dom"], url);
  const found = dom.match(/<pre id="metrics" hidden="">([\s\S]*?)<\/pre>/);
  if (!found) die(`board ${name}: the page did not report its measurements. Open ${url} in Chrome and look for errors.`);
  const m = JSON.parse(found[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));

  const problems = [];
  for (const p of m.panels) if (p.freeIn < -0.05) problems.push(`${p.id} panel runs ${(-p.freeIn).toFixed(1)} in past the bottom`);
  for (const o of m.overflowX) problems.push(`too wide for its panel: ${o}`);
  if (m.textSharePct > 25) problems.push(`text covers ${m.textSharePct}% of the board (limit 25%)`);
  if (m.minBodyPt < 24) problems.push(`body text is ${m.minBodyPt.toFixed(0)} pt ("${m.minBodyWhere}"); the tip says 24 to 32 pt`);
  if (final && m.todos > 0) problems.push(`${m.todos} yellow placeholder(s) left`);
  for (const i of m.images) if (final && i.ppi < 100) problems.push(`${i.name} is only ${i.ppi} pixels per inch at ${i.widthIn} in wide: it will look blurry`);

  console.log(`\nBoard: ${label}`);
  // Blocks are spread top to bottom, so "fits" means nothing runs past the bottom; the gap shows how airy it is.
  for (const p of m.panels) console.log(`  ${p.id.padEnd(6)} ${String(p.widthIn).padStart(4)} in wide, ${p.freeIn < -0.05 ? "OVERFLOWS" : "fits"}, biggest gap between blocks ${p.gapsIn} in`);
  console.log(`  text covers ${m.textSharePct}% of the board (limit 25%)`);
  console.log(`  smallest body text ${m.minBodyPt.toFixed(0)} pt, smallest source line ${m.minSmallPt === 999 ? "n/a" : m.minSmallPt.toFixed(0) + " pt"}`);
  console.log(`  yellow placeholders left: ${m.todos}${m.todos ? " (name, numbers, screenshots or QR still missing)" : ""}`);
  for (const i of m.images) console.log(`  image ${i.name}: ${i.px} px at ${i.widthIn} in wide = ${i.ppi} pixels per inch${i.ppi < 150 ? "  (below 150: ask for a bigger render)" : ""}`);
  if (problems.length) {
    failed = true;
    for (const p of problems) console.log(`  PROBLEM: ${p}`);
  }

  // 2. The print PDF (the fold marks are screen-only, so they are not in it).
  const pdf = join(outDir, `trifold-${name}.pdf`);
  chrome(["--no-pdf-header-footer", `--print-to-pdf=${pdf}`], url);
  console.log(`  wrote ${pdf}`);

  // Each panel on its own page of its own size, for a shop that prints panel by panel.
  ["left", "centre", "right"].forEach((side, i) => {
    chrome(["--no-pdf-header-footer", `--print-to-pdf=${join(outDir, `trifold-${name}-${side}.pdf`)}`], `${url}&panel=${i + 1}`);
  });
  console.log(`  wrote the three panel PDFs (${widths.join(" + ")} in wide, each 27 in tall) next to it`);

  // 3. A small preview, with the fold marks, for the pull request.
  const raw = join(outDir, `preview-raw-${name}.png`);
  chrome([`--window-size=${BOARD_PX}`, "--force-device-scale-factor=0.25", `--screenshot=${raw}`], url);
  // Chrome writes a 2304 px PNG (about 500 KB) whatever the scale flag says. Where macOS' sips exists,
  // turn it into a 1500 px JPEG for the repo; otherwise copy the PNG.
  let preview = join(here, `preview-${name}.jpg`);
  try {
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "80", "-Z", "1500", raw, "--out", preview], { stdio: "ignore" });
  } catch {
    preview = join(here, `preview-${name}.png`);
    copyFileSync(raw, preview);
  }
  console.log(`  wrote ${preview}`);
}
if (failed) {
  console.error("\nrender.mjs: fix the PROBLEM lines above, then run it again.");
  process.exit(1);
}
console.log("\nAll checks passed.");
