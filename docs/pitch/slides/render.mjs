// Renders the two pitch images for #56 into docs/img/:
//   code-slide.png    real lines from contracts/route_ledger/src/lib.rs (pay_with_credit)
//   architecture.png  "How it works on Stellar"
//
// Run from anywhere:  node docs/pitch/slides/render.mjs
// Print size:         SCALE=3 node docs/pitch/slides/render.mjs
//   SCALE (a whole number, 1 to 4, default 1) draws the same slide with more pixels, so it prints
//   sharp: 3 gives 5760 x 3240 (240 pixels per inch at 24 in wide). The files are named
//   code-slide@3x.png and architecture@3x.png; the 1x files are left alone. Git ignores the @Nx
//   files, so render them on the computer that prints, after the final contract ID is in place.
// Needs Google Chrome or Chromium. It looks in the usual macOS, Windows and Linux places; if yours is
// somewhere else, set CHROME=/path/to/chrome. No npm packages.
//
// The code on the slide is read straight from lib.rs, so it cannot drift from the contract.
// If those lines change, this script stops and says so: update the slide, then re-run.
//
// Contract ID: CONTRACT_ID env var, else contracts.routeLedger in config/testnet.json.
// If neither exists the slide says "PENDING" in amber, so a placeholder can't pass for the real ID.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const outDir = join(root, "docs/img");
const SCALE = Number(process.env.SCALE || 1);
if (!Number.isInteger(SCALE) || SCALE < 1 || SCALE > 4) {
  console.error(`render.mjs: SCALE must be a whole number from 1 to 4 (got "${process.env.SCALE}").`);
  process.exit(1);
}
const SUFFIX = SCALE === 1 ? "" : `@${SCALE}x`;
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
const EXPLORER = "https://stellar.expert/explorer/testnet/contract";

const die = (msg) => {
  console.error(`render.mjs: ${msg}`);
  process.exit(1);
};

// ---------- 1. The code, copied from the contract ----------
const lib = readFileSync(join(root, "contracts/route_ledger/src/lib.rs"), "utf8").split("\n");
const start = lib.findIndex((l) => l.includes("pub fn pay_with_credit"));
if (start < 0) die("pay_with_credit not found in contracts/route_ledger/src/lib.rs.");

// Each block starts at a known line inside pay_with_credit and runs for `len` lines.
const BLOCKS = [
  { first: "if terms.owed > 0 && now > terms.due_at {", len: 3 }, // not overdue
  { first: "match terms.owed.checked_add(amount) {", len: 4 }, // within the limit (#66 made the sum overflow-safe)
  { first: "let mut pool = load_pool(&env);", len: 4 }, // the pool has money
];

// What fits on the 1920x1080 slide at 48 px (24 pt) code: see code-slide.html. Past these the
// text runs into the callouts or the contract ID, so stop instead of rendering a broken image.
const MAX_CHARS = 45;
const MAX_LINES = 11;

function takeBlock({ first, len }) {
  const i = lib.findIndex((l, n) => n > start && l.trim() === first);
  if (i < 0) die(`the line "${first}" is no longer in pay_with_credit. Update docs/pitch/slides/render.mjs and the slide.`);
  const lines = lib.slice(i, i + len);
  if (lines[len - 1].trim() !== "}") die(`the block starting "${first}" changed shape. Update docs/pitch/slides/render.mjs.`);
  const indent = Math.min(...lines.map((l) => l.match(/^ */)[0].length));
  const out = lines.map((l) => l.slice(indent));
  const wide = out.find((l) => l.length > MAX_CHARS);
  if (wide) die(`"${wide.trim()}" is wider than ${MAX_CHARS} characters, so it will not fit the slide at 24 pt. Pick other lines.`);
  return out.join("\n");
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// One pass, so a replacement is never highlighted twice.
function highlight(code) {
  return esc(code).replace(
    /(\/\/.*)|\b(Error::\w+)\b|\b(if|let|mut|return|match)\b/g,
    (m, comment, err) => (comment ? `<span class="c">${m}</span>` : err ? `<span class="e">${m}</span>` : `<span class="k">${m}</span>`),
  );
}

// ---------- 2. The contract ID ----------
function contractId() {
  let id = process.env.CONTRACT_ID || "";
  const config = join(root, "config/testnet.json");
  if (!id && existsSync(config)) id = JSON.parse(readFileSync(config, "utf8")).contracts?.routeLedger || "";
  if (!id) return "";
  if (!/^C[A-Z2-7]{55}$/.test(id)) die(`"${id}" is not a contract ID (C followed by 55 letters and digits).`);
  return id;
}

const id = contractId();
const contractBlock = id
  ? `<div class="id">${id}</div>\n    <div class="url"><a href="${EXPLORER}/${id}">${EXPLORER.replace("https://", "")}/${id}</a></div>`
  : `<div class="id pending">PENDING: add the deployed contract ID (Yahya deploys, then re-run this script)</div>\n    <div class="url">stellar.expert/explorer/testnet/contract/&lt;ID&gt;</div>`;
if (!id) console.warn("render.mjs: no contract ID found. The code slide shows PENDING.");

// ---------- 3. Render ----------
if (!CHROME || !existsSync(CHROME)) die(`Chrome not found${CHROME ? ` at ${CHROME}` : ""}. Set CHROME=/path/to/chrome.`);
// Chrome refuses to run its sandbox as root (e.g. in a container).
const asRoot = typeof process.getuid === "function" && process.getuid() === 0;
mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "slides-56-"));

function shoot(htmlPath, name) {
  const png = name.replace(/\.png$/, `${SUFFIX}.png`);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      ...(asRoot ? ["--no-sandbox"] : []),
      `--force-device-scale-factor=${SCALE}`,
      "--window-size=1920,1080",
      `--user-data-dir=${join(tmp, "profile")}`,
      `--screenshot=${join(outDir, png)}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "ignore" },
  );
  console.log(`wrote docs/img/${png} (${1920 * SCALE} x ${1080 * SCALE})`);
}

let page = readFileSync(join(here, "code-slide.html"), "utf8");
const totalLines = BLOCKS.reduce((sum, b) => sum + b.len, 0);
if (totalLines > MAX_LINES) die(`the slide shows ${totalLines} code lines but only ${MAX_LINES} fit above the contract ID.`);
BLOCKS.forEach((b, n) => {
  page = page.replace(`{{BLOCK_${n + 1}}}`, () => highlight(takeBlock(b)));
});
page = page.replace("{{CONTRACT_BLOCK}}", () => contractBlock);
const codeHtml = join(tmp, "code-slide.html");
writeFileSync(codeHtml, page);

shoot(codeHtml, "code-slide.png");
shoot(join(here, "architecture.html"), "architecture.png");
