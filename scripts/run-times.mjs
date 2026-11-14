// Summarises the run-through logs for #39 and checks its two "Done means" lines.
//
//   node scripts/run-times.mjs                 reads docs/testing/run-throughs/log.csv and qa-log.csv
//   node scripts/run-times.mjs path/to/folder  reads log.csv and qa-log.csv from that folder
//
// No npm packages. Exits 1 only if a log file has a bad row (so a typo can't hide a result).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.argv[2] ? resolve(process.argv[2]) : join(root, "docs/testing/run-throughs");

const RUN_LIMIT = 180; // every run must be under 3:00
const ANSWER_LIMIT = 20; // every answer must take 20 seconds or less
const RUNS_NEEDED = 5;
// Seconds per segment, from docs/testing/run-throughs/README.md (they add up to 180).
const BUDGET = { problem: 25, built: 30, video: 60, pays: 35, risk: 20, close: 10 };

const errors = [];

// A small CSV reader: handles "quoted, text", doubled quotes and blank lines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

function load(name) {
  const file = join(dir, name);
  if (!existsSync(file)) {
    errors.push(`${name}: file not found in ${dir}`);
    return [];
  }
  const [header, ...body] = parseCsv(readFileSync(file, "utf8"));
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((cells, n) => ({
    line: n + 2,
    ...Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? "").trim()])),
  }));
}

// "2:52" or "172" -> seconds. Empty -> null. Anything else is an error.
function seconds(value, where) {
  if (value === "") return null;
  const m = /^(\d+):([0-5]\d)$/.exec(value);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if (/^\d+$/.test(value)) return Number(value);
  errors.push(`${where}: "${value}" is not m:ss or seconds`);
  return null;
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const signed = (n) => `${n >= 0 ? "+" : "-"}${Math.abs(Math.round(n))} s`;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// ---------- runs ----------
const runs = load("log.csv").map((r) => {
  const where = `log.csv line ${r.line}`;
  const total = seconds(r.total, `${where}, total`);
  if (total === null && r.total === "") errors.push(`${where}: total is required`);
  const parts = Object.fromEntries(Object.keys(BUDGET).map((k) => [k, seconds(r[k] ?? "", `${where}, ${k}`)]));
  return { run: r.run, total, parts };
});

console.log(`Run-throughs logged: ${runs.length}`);
const timed = runs.filter((r) => r.total !== null);
const under = timed.filter((r) => r.total < RUN_LIMIT);
if (timed.length) {
  const totals = timed.map((r) => r.total);
  console.log(`  under ${mmss(RUN_LIMIT)}: ${under.length} of ${timed.length}`);
  console.log(`  fastest ${mmss(Math.min(...totals))}, slowest ${mmss(Math.max(...totals))}, average ${mmss(mean(totals))}`);
  for (const r of timed.filter((x) => x.total >= RUN_LIMIT)) {
    console.log(`  run ${r.run} was ${mmss(r.total)}, ${r.total - RUN_LIMIT} s over ${mmss(RUN_LIMIT)}`);
  }
}

const segLines = Object.entries(BUDGET)
  .map(([k, budget]) => {
    const xs = runs.map((r) => r.parts[k]).filter((v) => v !== null);
    return xs.length ? { k, budget, avg: mean(xs), n: xs.length } : null;
  })
  .filter(Boolean);
if (segLines.length) {
  console.log("Segments (average against budget):");
  for (const s of segLines) {
    console.log(`  ${s.k.padEnd(8)} ${mmss(s.avg)} (budget ${mmss(s.budget)}, ${signed(s.avg - s.budget)}, ${s.n} runs)`);
  }
  const worst = [...segLines].sort((a, b) => b.avg - b.budget - (a.avg - a.budget))[0];
  if (worst.avg > worst.budget) console.log(`  cut here first: ${worst.k}`);
}
for (const r of runs) {
  const given = Object.values(r.parts).filter((v) => v !== null);
  if (given.length === Object.keys(BUDGET).length && r.total !== null) {
    const sum = given.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - r.total) > 5) console.log(`  check run ${r.run}: segments add up to ${mmss(sum)} but the total is ${mmss(r.total)}`);
  }
}

// ---------- questions ----------
const qa = load("qa-log.csv");
let long = 0;
const weak = [];
for (const q of qa) {
  const where = `qa-log.csv line ${q.line}`;
  const s = seconds(q.seconds, `${where}, seconds`);
  if (s !== null && s > ANSWER_LIMIT) long++;
  for (const k of ["clarity", "accuracy"]) {
    if (q[k] !== "" && !/^[1-5]$/.test(q[k])) errors.push(`${where}: ${k} "${q[k]}" must be 1 to 5`);
  }
  if (q.weak && !/^(yes|no)$/i.test(q.weak)) errors.push(`${where}: weak "${q.weak}" must be yes or no`);
  if (/^yes$/i.test(q.weak)) weak.push(q);
}
const unfixed = weak.filter((q) => !/^yes$/i.test(q.fixed_in_pitch_md));
console.log(`Questions logged: ${qa.length}`);
console.log(`  answers over ${ANSWER_LIMIT} s: ${long}; weak: ${weak.length}; weak and not yet fixed in docs/pitch/pitch.md: ${unfixed.length}`);
for (const q of unfixed) console.log(`  fix: ${q.question_id} (run ${q.run}) ${q.notes}`);

// ---------- done means ----------
// Stop before the checkboxes if a row is bad, so a typo can't show a box as ticked.
if (errors.length) {
  console.error("\nProblems in the logs (fix them, then run this again):");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const box = (ok) => (ok ? "[x]" : "[ ]");
console.log("Done means (#39):");
console.log(`  ${box(under.length >= RUNS_NEEDED)} Five run-throughs under 3:00 (${under.length} so far)`);
console.log(`  ${box(qa.length > 0 && unfixed.length === 0)} Weak answers rewritten in docs/pitch/pitch.md${qa.length === 0 ? " (no questions logged yet)" : ""}`);
