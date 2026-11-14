// Repeat-tap safety for the buttons that move money or record it (the shop's pay buttons, the driver's
// "Recibí efectivo", the distributor's cash hand-in). Accidental payment is the worst bug this product can have,
// so each one is tapped the way a worried thumb taps: twice quickly, then again and again one second apart,
// then two seconds apart, while the screen changes underneath.
//
//   npm run build && npm run start          (mock data; the mock answers in a second, like a slow phone)
//   node scripts/pay-taps.mjs [--base http://localhost:3000] [--only "este monto"]
//
// Passes when each run makes exactly one payment (or one hand-in) and no later tap lands on any button or link.
// One scenario taps a stop on the driver's sheet instead, at the spot where "Recibí efectivo" is once the stop
// is open: it passes when no cash is recorded at all.
// Needs Playwright where Node can find it, like scripts/screens.mjs. Exits 1 if any run fails.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3000";
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : ""; // part of a scenario's name

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright isn't installed where Node can find it. Try: npm i -g playwright && npx playwright install chromium");
  process.exit(1);
}

/** [name, how many taps, milliseconds between them] */
const RHYTHMS = [
  ["twice quickly", 2, 90],
  ["every second", 6, 1000],
  ["every two seconds", 5, 2000],
];

const button = (page, name) => page.getByRole("button", { name }).first();
/** A stop on the driver's sheet, by its invoice number. */
const stop = (page, invoice) => page.locator("main a", { hasText: String(invoice) }).first();
const ready = async (page, selector = "main button:not([disabled])") => {
  await page.waitForSelector(selector, { timeout: 20_000 });
  await page.waitForTimeout(900); // a pay button ignores taps for its first 0.6 s
};
const ROUTE = "/ruta/motorista-1";

/** A client-side move, so the mock's data (it lives in the tab) comes along. */
const move = async (page, path) => {
  await page.evaluate((to) => window.next.router.push(to), path);
  await page.waitForFunction((to) => location.pathname === to, path, { timeout: 20_000 });
};

/** The driver marks an invoice as paid in cash, then the shop confirms it: now the driver holds that cash. */
const cashWithDriver = async (page, driver, invoice) => {
  await move(page, `/ruta/${driver}`);
  await page.waitForSelector("main [data-next]", { timeout: 20_000 });
  await stop(page, invoice).tap();
  await page.waitForTimeout(900); // the button is quiet for a beat after a stop opens
  await button(page, "Recibí efectivo").tap();
  await page.waitForTimeout(2500);
  await move(page, `/tienda/${invoice}`);
  await page.waitForSelector("text=Efectivo por confirmar", { timeout: 20_000 });
  await page.waitForTimeout(1500);
  await page.locator("button:visible", { hasText: /^Confirmo/ }).first().tap();
  await page.getByText("Pagada · Efectivo").first().waitFor({ timeout: 20_000 });
  await page.waitForTimeout(3000); // the hold after a payment
};

/**
 * name, how to get the pay button on screen, the button, and what the slip must say afterwards.
 * Also: `start` and `end` (the page it begins and must end on; the shop's invoice unless given), `ready` (what
 * shows that the first page has loaded), `read` (the text `after` is given; the slip unless given), `point`
 * (where to tap, instead of the middle of `target`) and `check` (instead of "one tap reached a button" and `after`).
 */
const SCENARIOS = [
  {
    name: "Pagar ahora",
    target: (page) => button(page, "Pagar ahora"),
    after: (text) => /Pagada · Digital/.test(text),
  },
  {
    name: "Pagar este monto ($ 50 of $ 150)",
    setup: async (page) => {
      await button(page, "Pagar otro monto").tap();
      await page.locator("main input").fill("50");
      await page.waitForTimeout(900);
    },
    target: (page) => button(page, "Pagar este monto"),
    // One payment of 50 and no more: 50 paid of 150, 100 left, and the slip is not stamped paid.
    after: (text) => /Pagado\s*\$50\.00 de \$150\.00/.test(text) && /Falta[\s\S]*\$100\.00/.test(text) && !/Pagada ·/.test(text),
  },
  {
    name: "Confirmo (Pagar en 7 días)",
    setup: async (page) => {
      await button(page, "Pagar en 7 días").tap();
      await page.waitForTimeout(900);
    },
    target: (page) => button(page, "Confirmo"),
    after: (text) => /Pagada · Crédito/.test(text),
  },
  {
    name: "Confirmo (Pagué en efectivo)",
    start: ROUTE,
    ready: "main [data-next]",
    setup: async (page) => {
      // The driver marks the cash first, then the same browser opens the shop's invoice (the mock lives in the tab).
      await stop(page, 1001).tap();
      await button(page, "Recibí efectivo").tap();
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.next.router.push("/tienda/1001"));
      await page.waitForSelector("text=Efectivo por confirmar", { timeout: 20_000 });
      await page.waitForTimeout(1500);
    },
    target: (page) => button(page, "Confirmo"),
    after: (text) => /Pagada · Efectivo/.test(text),
  },
  {
    // The driver's own money button: one record, and the taps that follow reach nothing (not the invitation, not a link).
    name: "Recibí efectivo (the driver's stop)",
    start: ROUTE,
    end: ROUTE,
    ready: "main [data-next]",
    setup: async (page) => {
      await stop(page, 1001).tap();
      await page.waitForTimeout(900);
    },
    target: (page) => button(page, "Recibí efectivo"),
    read: (page) => page.locator("main").innerText(),
    after: (text) => /Efectivo registrado\s*\$150\.00 por confirmar/.test(text) && !/Recibí efectivo/.test(text),
  },
  {
    // Opening a stop puts "Recibí efectivo" on screen, for some rows right where the row was tapped.
    // Taps that keep landing on that spot were meant for the row: none of them may record cash.
    name: "A stop's row, at the spot where Recibí efectivo will be",
    start: ROUTE,
    end: ROUTE,
    ready: "main [data-next]",
    point: async (page) => {
      // Open the last stop to see where its button lies, go back to the sheet, and aim there.
      await stop(page, 1008).tap();
      const box = await button(page, "Recibí efectivo").boundingBox();
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await page.goBack();
      await page.waitForSelector("main [data-next]", { timeout: 20_000 });
      await page.waitForTimeout(3000); // longer than the same-spot guard remembers the taps above
      // The point can fall in the 8 px between two rows. A person's thumb would be on a row: nudge the sheet until one is there.
      const under = () => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("main a")?.innerText ?? null, point);
      let row = await under();
      for (const by of [16, -32, 48, -64]) {
        if (row !== null) break;
        await page.evaluate((y) => window.scrollBy(0, y), by);
        await page.waitForTimeout(300);
        row = await under();
      }
      if (row === null) throw new Error("no stop lies where Recibí efectivo will be: pick another row for this scenario");
      return point;
    },
    read: (page) => page.locator("main").innerText(),
    check: ({ hits, text, url }) => [
      ...(hits.length === 0 ? ["the first tap did not open the stop"] : []),
      ...(url.searchParams.has("parada") ? [] : ["the stop is not open"]),
      ...(/Efectivo registrado|Procesando/.test(text) || !/Recibí efectivo/.test(text) ? [`cash was recorded: ${text.replace(/\s+/g, " ").slice(-160)}`] : []),
    ],
  },
  {
    // Two drivers hold cash, so the second driver's button sits right under the first. Handing in the first
    // driver's cash must not hand in the second's, however the thumb keeps tapping.
    name: "Marcar efectivo entregado (two drivers hold cash)",
    start: ROUTE,
    end: "/distribuidor",
    ready: "main [data-next]",
    setup: async (page) => {
      await cashWithDriver(page, "motorista-1", 1001);
      await cashWithDriver(page, "motorista-2", 1003);
      await move(page, "/distribuidor");
      await page.locator("#motoristas button:visible", { hasText: "Marcar efectivo entregado" }).nth(1).waitFor({ timeout: 20_000 });
      await page.waitForTimeout(1500);
    },
    target: (page) => page.locator("#motoristas button:visible", { hasText: "Marcar efectivo entregado" }).first(),
    read: (page) => page.locator("#motoristas").innerText(),
    // One driver's cash is in ($ 0.00 and nothing to hand in), the other's is untouched and still has its button.
    after: (text) =>
      (text.match(/Marcar efectivo entregado/g) ?? []).length === 1 && (text.match(/Nada por entregar/g) ?? []).length === 1 && /\$\s?0\.00/.test(text) && /\$\s?220\.00/.test(text),
  },
];

// ---------- Mi cuenta: "Pagar deuda" ----------
// The shop takes $ 40 on credit (invoice 1007), then opens Mi cuenta in the same tab and pays the debt.
// One repayment and no more: the balance goes from $ 1,000 to $ 960 once, the slip is stamped, and every
// later tap lands on the inert "Deuda pagada" block or on paper, never on an invoice row under it.
SCENARIOS.push({
  name: "Pagar deuda (Mi cuenta)",
  start: "/tienda/1007",
  end: "/tienda/cuenta/tienda-1",
  setup: async (page) => {
    await button(page, "Pagar en 7 días").tap();
    await page.waitForTimeout(2700); // a tap on the same spot within 2.5 s is ignored on purpose
    await button(page, "Confirmo").tap();
    await page.getByText("Pagada · Crédito").first().waitFor({ timeout: 20_000 });
    await page.waitForTimeout(3000); // the hold after a payment
    await move(page, "/tienda/cuenta/tienda-1");
    await button(page, "Pagar deuda").waitFor({ timeout: 20_000 });
    await page.waitForTimeout(1500);
  },
  target: (page) => button(page, "Pagar deuda"),
  after: (text) => /Pagada hoy/.test(text) && /Saldo\s*\$960\.00/.test(text) && /PAGADA/i.test(text),
});
// ---------- end of Mi cuenta ----------

// ---------- redesign PR 7: the distributor's Nueva factura and the admin's Aprobar ----------
// Neither moves money, but each writes to the contract and can't be taken back, and each changes what is under the
// thumb (the form becomes "Crear otra factura"; the next business moves up under the same "Aprobar").
// Without a database these screens have nothing to show, so the answers of their server actions are swapped for
// sample answers (as in scripts/screens.mjs), and every write that reaches the server is counted.
{
  const signedIn = async (page, path) => {
    const writes = { count: 0 };
    let pending = ["La Central", "Del Pacífico", "El Buen Pan"].map((businessName, i) => ({ id: `d-${i}`, businessName, nit: null, address: null, sells: [], shopsApprox: null, driversApprox: null, status: "pendiente", ownerName: null, ownerContact: null, createdAt: "2026-11-12T15:00:00Z", explorerUrl: "https://stellar.expert/explorer/testnet" }));
    const answer = (args) => {
      if (path === "/admin") {
        if (args.length === 0) return { pending, decided: [] };
        writes.count += 1;
        pending = pending.filter((d) => d.id !== args[0]);
        return { ok: true };
      }
      if (args.length === 0) return { distributorName: "Distribuidora El Sol", shops: [{ id: "tienda-1", name: "Tienda Rosa", owner: "Rosa Martínez", driverId: "motorista-1" }], drivers: [{ id: "motorista-1", name: "Carlos" }], suggestedId: 1009, today: "2026-11-14" };
      writes.count += 1;
      return { ok: true, message: `Factura ${args[0].invoiceId} creada.`, explorerUrl: "https://stellar.expert/explorer/testnet", invoiceId: args[0].invoiceId };
    };
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() !== "POST" || !request.headers()["next-action"] || new URL(request.url()).pathname !== path) return route.fallback();
      const args = JSON.parse(request.postData() || "[]");
      const found = answer(args);
      const head = (await (await route.fetch()).text()).split("\n")[0];
      if (args.length > 0) await new Promise((resolve) => setTimeout(resolve, 1000)); // a write takes a moment, like the mock's
      await route.fulfill({ status: 200, contentType: "text/x-component", body: `${head}\n1:${JSON.stringify(found)}\n` });
    });
    // The run starts on the shop's invoice, like the others, and opens the screen from there.
    await page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
    page.__writes = writes;
  };
  SCENARIOS.push(
    {
      name: "Crear factura (Nueva factura)",
      end: "/distribuidor/factura",
      setup: async (page) => {
        await signedIn(page, "/distribuidor/factura");
        await page.locator("main form input[inputmode=decimal]").fill("48.50");
        await page.waitForTimeout(900);
      },
      target: (page) => button(page, "Crear factura"),
      read: async (page) => `${page.__writes.count} written. ${await page.locator("main").innerText()}`,
      after: (text) => /^1 written\./.test(text) && /Factura creada/.test(text) && /Crear otra factura/.test(text),
    },
    {
      // Three businesses wait. Approving the first moves the second up under the same button.
      name: "Aprobar (admin, three businesses waiting)",
      end: "/admin",
      setup: async (page) => {
        await signedIn(page, "/admin");
        await page.locator("main button:visible", { hasText: "Aprobar" }).nth(2).waitFor({ timeout: 20_000 });
        await page.waitForTimeout(900);
      },
      target: (page) => page.locator("main button:visible", { hasText: "Aprobar" }).first(),
      read: async (page) => `${page.__writes.count} written. ${await page.locator("main").innerText()}`,
      after: (text) => /^1 written\./.test(text) && (text.match(/Aprobar/g) ?? []).length === 2 && !/La Central/.test(text),
    },
  );
}

const browser = await chromium.launch();
const failures = [];

for (const scenario of SCENARIOS) {
  if (!scenario.name.includes(only)) continue;
  for (const [rhythm, taps, gap] of RHYTHMS) {
    const context = await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    // Every tap that reaches a button, a link or an input is written down.
    await page.addInitScript(() => {
      window.__hits = [];
      addEventListener(
        "click",
        (event) => {
          const hit = event.target instanceof Element ? event.target.closest("a, button, input") : null;
          if (hit) window.__hits.push((hit.innerText || hit.tagName).trim().split("\n")[0]);
        },
        true,
      );
    });
    await page.goto(new URL(scenario.start ?? "/tienda/1001", base).href, { waitUntil: "networkidle" });
    await ready(page, scenario.ready);
    await scenario.setup?.(page);

    let x, y;
    if (scenario.point) {
      ({ x, y } = await scenario.point(page));
    } else {
      const target = scenario.target(page);
      await target.scrollIntoViewIfNeeded();
      const box = await target.boundingBox();
      [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    }
    await page.evaluate(() => (window.__hits = []));
    for (let tap = 0; tap < taps; tap++) {
      if (tap > 0) await page.waitForTimeout(gap);
      await page.touchscreen.tap(x, y);
    }
    await page.waitForTimeout(6500); // the payment, the reload, and the hold after the last tap

    const hits = await page.evaluate(() => window.__hits);
    const slip = await (scenario.read ? scenario.read(page) : page.locator("main section").first().innerText());
    const url = new URL(page.url());
    const problems = [];
    if (scenario.check) {
      problems.push(...scenario.check({ hits, text: slip, url }));
    } else {
      if (hits.length !== 1) problems.push(`${hits.length} taps reached a button or link: ${hits.join(" | ")}`);
      if (!scenario.after(slip)) problems.push(`the slip reads: ${slip.replace(/\s+/g, " ").slice(0, 160)}`);
    }
    if (url.pathname !== (scenario.end ?? "/tienda/1001")) problems.push(`ended on ${url.pathname}`);
    if (context.pages().length !== 1) problems.push("opened another tab");

    console.log(`${problems.length ? "FAIL" : "ok  "}  ${scenario.name}, tapped ${rhythm}`);
    for (const problem of problems) failures.push(`${scenario.name}, tapped ${rhythm}: ${problem}`);
    await context.close();
  }
}

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} to fix:`);
  for (const failure of failures) console.log(`  ${failure}`);
  process.exit(1);
}
console.log("\nEvery run made one payment or one hand-in, and no later tap reached a button or a link.");
