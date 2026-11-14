// Opens every screen of a group at every device size in DESIGN.md (portrait and landscape), checks each
// one, and writes a contact sheet per screen. For the redesign PRs: attach the sheets, paste the report.
//
//   npm run build && npm run start                  (in another terminal; mock data is enough)
//   node scripts/screens.mjs system                 one group: system, shop, distributor, driver, auth, account, admin
//   node scripts/screens.mjs shop --lang en         the same screens in English
//   node scripts/screens.mjs shop --base http://localhost:3000 --out docs/screenshots/redesign
//   node scripts/screens.mjs shop --zoom 2          the browser zoomed to 200%
//   node scripts/screens.mjs shop --text 1.5        the phone's text size raised by half
//   node scripts/screens.mjs shop --only factura --size 360x640 --full     one screen at one size, the whole page: while building
//
// Checked at each size: no sideways scroll, no clipped text, every touch target at least 44 px
// (56 px on the driver's screens; the pay buttons are 52 px, the driver's 60 px; the script prints the smallest it finds).
// Needs Playwright where Node can find it (npm i -g playwright, or NODE_PATH). It is not a dependency
// of the app. Exits 1 if any check fails.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

/** A sheet is committed with its PR, so it is saved with a 256-colour palette (about a third of the size).
    sharp comes with Next; without it the sheet stays as it is. */
async function shrink(file) {
  try {
    const sharp = require("sharp");
    writeFileSync(file, await sharp(readFileSync(file)).png({ palette: true, quality: 90, effort: 8 }).toBuffer());
  } catch {}
}

/**
 * name, path, and (optionally) more about the screen:
 *   inView     what must be in view without scrolling at one size: { "360x640": selector }, or
 *              { "1280x800": { selector, count } } when at least `count` things must match
 *   minTarget  the smallest touch target this screen allows (44 unless given; the driver's screens use 56)
 *   prepare    async (page) => {}: steps to take in the page before it is checked (pay an invoice, open a row)
 */
const press = (page, name) => page.getByRole("button", { name }).first().click();
const move = (page, path) => page.evaluate((to) => window.next.router.push(to), path);

/**
 * The panel on a working day. The demo starts with eight unpaid invoices and nothing else, so before the
 * panel is checked one shop pays digitally, one on credit, one a part, one in cash, and two more invoices
 * arrive. The demo's data lives in the tab, so every step is a move inside the app, never a reload.
 */
async function workingDay(page) {
  const paid = (words) => page.getByText(words).first().waitFor({ timeout: 20_000 });
  const open = async (path) => {
    await move(page, path);
    await page.waitForSelector("main button:not([disabled])", { timeout: 20_000 });
    await page.waitForTimeout(800); // a pay button ignores taps for its first 0.6 s
  };
  await open("/tienda/1008");
  await press(page, /Pagar ahora|Pay now/);
  await paid(/Pagada · Digital|Paid · Digital/);
  await open("/tienda/1007");
  await press(page, /Pagar en 7 días|Pay in 7 days/);
  // On a short screen the panel can open with "Confirmo" right where the row was tapped, and a tap on the
  // same spot within 2.5 s is ignored on purpose (lib/taps.ts). A person reads the terms first; so does this.
  await page.waitForTimeout(2700);
  await press(page, /^Confirmo|^Confirm/);
  await paid(/Pagada · Crédito|Paid · Credit/);
  await open("/tienda/1006");
  await press(page, /Pagar otro monto|Pay another amount/);
  await page.locator("main input[inputmode=decimal]:visible").fill("45");
  await page.waitForTimeout(800);
  await press(page, /Pagar este monto|Pay this amount/);
  await paid(/^(Pagado|Paid)$/);
  await move(page, "/ruta/motorista-1");
  await page.waitForSelector("main [data-next]", { timeout: 20_000 });
  await page.locator("main a", { hasText: "1004" }).first().click();
  // On a small phone at a large text size the button can open right where the row was tapped, and a tap on the
  // same spot within 2.5 s is ignored on purpose (lib/taps.ts).
  await page.waitForTimeout(2700);
  await press(page, /Recibí efectivo|I received cash/);
  await page.waitForTimeout(2500);
  await open("/tienda/1004");
  await press(page, /^Confirmo|^Confirm/);
  await paid(/Pagada · Efectivo|Paid · Cash/);
  await move(page, "/distribuidor");
  await page.locator("#facturas tbody tr:visible, #facturas ul > li:visible").first().waitFor({ timeout: 20_000 });
  for (let made = 0; made < 2; made++) {
    const before = await page.locator("#facturas tbody tr, #facturas ul > li").count();
    await page.locator("button:visible", { hasText: /Nueva factura de demo|New demo invoice/ }).first().click();
    await page.waitForFunction((count) => document.querySelectorAll("#facturas tbody tr, #facturas ul > li").length > count, before, { timeout: 20_000 });
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(4500); // the rows that just changed stop being lit
}

const GROUPS = {
  system: [
    ["sistema", "/sistema"],
    ["sistema-split", "/sistema/split"],
    ["sistema-shell", "/sistema/shell"],
  ],
  shop: [
    // The floor: on a 360x640 phone "Pagar ahora" and the three other ways to pay are all in view.
    ["factura", "/tienda/1001", { inView: { "360x640": "main button" } }],
    ["demo", "/demo", { inView: { "360x640": "main button" } }],
  ],
  distributor: [
    // The booth laptop: the four figures and the first ten invoices are in view without scrolling.
    ["panel", "/distribuidor", { prepare: workingDay, inView: { "1280x800": { selector: "#resumen, #facturas tbody tr", count: 11 } } }],
    ["panel-nuevo", "/distribuidor"], // as the demo starts: eight invoices, nothing paid
  ],
  driver: [
    // Gloves and wet hands: every target on the driver's screens is at least 56 px.
    // The sheet: the next stop is pinned in view. From 40 rem of width (a phone held sideways, a tablet, a laptop)
    // the open stop lies beside it, so its code and "Recibí efectivo" are in view too, with nothing to tap first.
    [
      "ruta",
      "/ruta/motorista-1",
      {
        minTarget: 56,
        inView: {
          ...Object.fromEntries(["280x653", "320x568", "360x640", "375x667", "390x844", "393x852", "412x915", "360x800", "384x854", "412x919"].map((size) => [size, "[data-next]"])),
          ...Object.fromEntries(
            ["640x360", "667x375", "800x360", "844x390", "852x393", "854x384", "915x412", "919x412", "673x841", "768x1024", "820x1180", "800x1280", "841x673", "1024x768", "1180x820", "1280x800", "1366x768", "1440x900", "1920x1080"].map((size) => [
              size,
              "[data-next], [data-code], [data-cash]",
            ]),
          ),
        },
      },
    ],
    // A stop opened from the sheet (on a phone it takes the whole screen): the code and "Recibí efectivo" are in view at every size.
    [
      "parada",
      "/ruta/motorista-1?parada=1001",
      {
        minTarget: 56,
        inView: Object.fromEntries(
          ["280x653", "320x568", "360x640", "375x667", "390x844", "393x852", "412x915", "360x800", "384x854", "412x919", "568x320", "640x360", "667x375", "800x360", "844x390", "852x393", "854x384", "915x412", "919x412", "673x841", "768x1024", "820x1180", "800x1280", "841x673", "1024x768", "1180x820", "1280x800", "1366x768", "1440x900", "1920x1080"].map(
            (size) => [size, "[data-code], [data-cash]"],
          ),
        ),
      },
    ],
    // The same after "Recibí efectivo": the words that hold the button's place, and the stamp on the sheet.
    [
      "efectivo",
      "/ruta/motorista-1?parada=1002",
      {
        minTarget: 56,
        prepare: async (page) => {
          await page.locator("[data-cash] button:not([disabled])").click();
          await page.locator("[data-cash] button").waitFor({ state: "detached", timeout: 15_000 });
          await page.waitForTimeout(2600); // the hold after the last tap
        },
      },
    ],
  ],
  auth: (() => {
    // The home page's first screen, on a 360x640 phone and on a 390x844 one: the logo, the sentence and both ways in.
    const fold = { selector: 'main svg[aria-label="Relay"], main h1 + p, main a[href^="/registro/"]', count: 4 };
    // Mock data has no accounts, so a screen that asks the server "who is this?" would only show its way out.
    // Here the browser answers the page's questions itself (the 1st with the 1st value, and so on; the last one
    // repeats), the page is opened again, and the real screen draws. `shows` is a word that must then be on it.
    // Nothing these screens send reaches the server, so the check can't make an account anywhere.
    const answers =
      (path, shows, ...values) =>
      async (page) => {
        let asked = 0;
        await page.route("**/*", (route) => {
          if (route.request().method() !== "POST" || !route.request().headers()["next-action"]) return route.fallback();
          const value = values[Math.min(asked++, values.length - 1)];
          return route.fulfill({ status: 200, contentType: "text/x-component", body: `0:{"a":"$@1","q":"","i":false}\n1:${JSON.stringify(value)}\n` });
        });
        const english = await page.evaluate(() => document.documentElement.lang === "en");
        await page.goto(new URL(`${path}${english ? "?lang=en" : ""}`, page.url()).href, { waitUntil: "networkidle" });
        await page.getByText(shows).first().waitFor({ timeout: 8000 });
      };
    const tap = (page, name) => page.getByRole("button", { name }).click();
    const sol = "Distribuidora El Sol";
    const waiting = { id: "d-1", businessName: sol, status: "pendiente", autoApprove: true };
    /** A shop claims its invite and walks to `step` (2 the shop, 3 security, 4 done). */
    const claim = (step) => async (page) => {
      const suppliers = { suppliers: [{ distributorId: "distributor", name: sol, addedAt: "2026-11-13T15:00:00Z" }], isOwner: true };
      await answers("/unirse/demo", /Paso 1|Step 1/, { distributorName: sol }, { ok: true }, { ok: true, shopId: "tienda-1", creditLimit: 200 }, suppliers)(page);
      await page.locator("input").nth(0).fill("Rosa Martínez");
      await page.locator("input").nth(1).fill("7000 0132");
      await page.locator("input").nth(2).fill("secreto-2026");
      await tap(page, /Siguiente|Next/);
      await page.getByText(/Paso 2|Step 2/).waitFor();
      if (step === 2) return;
      await page.locator("input").nth(0).fill("Tienda Rosa");
      await tap(page, /^(Tienda|Corner shop)$/);
      await tap(page, /Crear mi cuenta|Create my account/);
      await page.getByText(/Paso 3|Step 3/).waitFor();
      if (step === 3) return tap(page, /Agregar otro contacto|Add another contact/);
      await tap(page, /Más tarde|Later/);
      await page.getByText(/Paso 4|Step 4/).waitFor();
    };
    return [
      ["inicio", "/", { inView: { "360x640": fold, "390x844": fold } }],
      ["registro", "/registro"],
      ["registro-tienda", "/registro/tienda"],
      ["registro-distribuidora", "/registro/distribuidora"],
      [
        "registro-distribuidora-2",
        "/registro/distribuidora",
        {
          prepare: async (page) => {
            await page.locator("input").nth(0).fill(sol);
            await page.locator("input").nth(1).fill("0614-010190-101-2");
            await page.locator("input").nth(2).fill("Calle Arce 123, San Salvador");
            await tap(page, /^(Abarrotes|Groceries)$/);
            await tap(page, /Siguiente|Next/);
            await page.getByText(/Paso 2|Step 2/).waitFor();
          },
        },
      ],
      ["entrar", "/entrar"],
      // Signed out, these two and "cuenta" send the person to /entrar, so the check starts there, as a person would.
      ["espera", "/entrar", { prepare: answers("/distribuidor/espera", /En revisión|In review/, waiting) }],
      ["espera-rechazada", "/entrar", { prepare: answers("/distribuidor/espera", /No aprobada|Not approved/, { ...waiting, status: "rechazado" }) }],
      ["unirse", "/unirse/demo", { prepare: answers("/unirse/demo", /Paso 1|Step 1/, { distributorName: sol }) }],
      ["unirse-tienda", "/unirse/demo", { prepare: claim(2) }],
      ["unirse-seguridad", "/unirse/demo", { prepare: claim(3) }],
      ["unirse-lista", "/unirse/demo", { prepare: claim(4) }],
      ["unirse-no-valido", "/unirse/demo"],
      ["invitacion", "/invitacion/demo", { prepare: answers("/invitacion/demo", /Su cuenta|Your account/, { distributorName: sol, name: "Carlos Hernández", phoneEnd: "0132" }) }],
      [
        "cuenta",
        "/entrar",
        {
          prepare: answers(
            "/cuenta",
            /Ir a mi tienda|Go to my shop/,
            { name: "Rosa Martínez", role: "tienda", contact: "+50370000132", stellarAddress: "GDEMO00000000000000000000000000000000000000000000000DEMO", explorerUrl: "https://example.com/detalles" },
            "tienda-1",
          ),
        },
      ],
    ];
  })(),
  account: [
    // The longest shop name, with nothing owed.
    ["cuenta", "/tienda/cuenta/tienda-3"],
    // Right after a "Pagar en 7 días" (the photo for the printed trifold is this screen at 360x640): the whole
    // account slip (Debe, the due date, the limit) and "Pagar deuda" are in view without scrolling.
    [
      "cuenta-deuda",
      "/tienda/1007",
      {
        inView: { "360x640": "#estado-de-cuenta, main button" },
        prepare: async (page) => {
          await page.waitForSelector("main button:not([disabled])", { timeout: 20_000 });
          await page.waitForTimeout(800); // a pay button ignores taps for its first 0.6 s
          await press(page, /Pagar en 7 días|Pay in 7 days/);
          await page.waitForTimeout(2700); // a tap on the same spot within 2.5 s is ignored on purpose (lib/taps.ts)
          await press(page, /^Confirmo|^Confirm/);
          await page.getByText(/Pagada · Crédito|Paid · Credit/).first().waitFor({ timeout: 20_000 });
          await page.waitForTimeout(2500); // the hold after a payment
          await move(page, "/tienda/cuenta/tienda-1");
          await page.getByRole("button", { name: /Pagar deuda|Pay debt/ }).waitFor({ timeout: 20_000 });
        },
      },
    ],
    // The same debt, just paid: the stamp has landed and "Deuda pagada" holds the button's place.
    [
      "cuenta-pagada",
      "/tienda/1007",
      {
        prepare: async (page) => {
          await page.waitForSelector("main button:not([disabled])", { timeout: 20_000 });
          await page.waitForTimeout(800);
          await press(page, /Pagar en 7 días|Pay in 7 days/);
          await page.waitForTimeout(2700);
          await press(page, /^Confirmo|^Confirm/);
          await page.getByText(/Pagada · Crédito|Paid · Credit/).first().waitFor({ timeout: 20_000 });
          await page.waitForTimeout(2500);
          await move(page, "/tienda/cuenta/tienda-1");
          await page.getByRole("button", { name: /Pagar deuda|Pay debt/ }).waitFor({ timeout: 20_000 });
          await page.waitForTimeout(800);
          await press(page, /Pagar deuda|Pay debt/);
          await page.getByText(/Deuda pagada$|Debt paid$/).first().waitFor({ timeout: 20_000 });
          await page.waitForTimeout(2500);
        },
      },
    ],
    ["datos", "/tienda/cuenta/tienda-1/datos"],
    // With a payment on credit in it, and its first row unfolded (the receipt links are checked too).
    [
      "historial",
      "/tienda/1007",
      {
        prepare: async (page) => {
          await page.waitForSelector("main button:not([disabled])", { timeout: 20_000 });
          await page.waitForTimeout(800);
          await press(page, /Pagar en 7 días|Pay in 7 days/);
          await page.waitForTimeout(2700);
          await press(page, /^Confirmo|^Confirm/);
          await page.getByText(/Pagada · Crédito|Paid · Credit/).first().waitFor({ timeout: 20_000 });
          await page.waitForTimeout(2500);
          await move(page, "/tienda/cuenta/tienda-1/historial");
          await page.locator("main button[aria-expanded]:visible").first().waitFor({ timeout: 20_000 });
          await page.locator("main button[aria-expanded]:visible").first().click();
        },
      },
    ],
    ["info", "/tienda/cuenta/tienda-1/info/retirar"],
    // What a lender sees from the shop's link (the link carries its last day).
    ["compartido", "/compartido/tienda-1?hasta=2099-12-31"],
  ],
  // The distributor's other screens and the admin's. Without a database these screens only say "Solo la distribuidora
  // aprobada puede hacer esto.", so each one is opened, the answers of its server actions are swapped for sample
  // answers (the screen's own code runs untouched), and the page is loaded again as a signed-in user would see it.
  admin: (() => {
    const NAME = "Distribuidora El Sol";
    const sample = () => ({
      drivers: [
        { id: "motorista-1", name: "Carlos", phone: "+50371234567", status: "activo", inviteToken: null, cashHeld: 60 },
        { id: "motorista-2", name: "Ana", phone: "+50372345678", status: "activo", inviteToken: null, cashHeld: 0 },
        { id: "inv-3", name: "José Antonio Ramírez", phone: "+50376543210", status: "invitado", inviteToken: "k3f9x2m7q1", cashHeld: 0 },
      ],
      shops: [
        { id: "tienda-1", name: "Tienda Rosa", nickname: null, ownerName: "Rosa Martínez", phone: "+50370123456", status: "activa", inviteCode: null, driverId: "motorista-1", creditLimit: 200, creditOwed: 40, driverName: "Carlos" },
        { id: "tienda-2", name: "Tienda Don Luis", nickname: "Don Luis, frente al parque", ownerName: "Luis Hernández", phone: "+50371234567", status: "activa", inviteCode: null, driverId: "motorista-2", creditLimit: 200, creditOwed: 0, driverName: "Ana" },
        { id: "tienda-3", name: "Mini Súper La Esquina", nickname: null, ownerName: "Marta López", phone: "+50372345678", status: "invitada", inviteCode: "K7M2QX", driverId: "motorista-2", creditLimit: 0, creditOwed: 0, driverName: "Ana" },
        { id: "tienda-9", name: "Pupusería y Tienda La Bendición de Dios", nickname: "Pupusería y Tienda La Bendición de Dios", ownerName: null, phone: null, status: "sin_cuenta", inviteCode: "P4T9WZ", driverId: null, creditLimit: 0, creditOwed: 0, driverName: null },
      ],
      pending: [
        { id: "d-1", businessName: "Distribuidora La Central", nit: "0614-120394-102-3", address: "Av. Roosevelt 1420, San Salvador", sells: ["Bebidas", "Snacks"], shopsApprox: 120, driversApprox: 8, status: "pendiente", ownerName: "Mauricio Flores", ownerContact: "mauricio@lacentral.com.sv", createdAt: "2026-11-12T15:00:00Z", explorerUrl: "https://stellar.expert/explorer/testnet" },
        { id: "d-2", businessName: "Lácteos y Abarrotes del Pacífico, S.A. de C.V.", nit: "0511-010188-001-0", address: "Km 12 Carretera al Puerto, La Libertad", sells: ["Lácteos", "Abarrotes", "Pan"], shopsApprox: 45, driversApprox: 3, status: "pendiente", ownerName: "Gloria Menjívar", ownerContact: "+503 7890-1234", createdAt: "2026-11-13T09:30:00Z", explorerUrl: "https://stellar.expert/explorer/testnet" },
        { id: "d-3", businessName: "El Buen Pan", nit: null, address: null, sells: [], shopsApprox: null, driversApprox: null, status: "pendiente", ownerName: "Pedro", ownerContact: "7000-1111", createdAt: "2026-11-14T02:00:00Z", explorerUrl: "https://stellar.expert/explorer/testnet" },
      ],
      decided: [
        { id: "d-0", businessName: NAME, nit: null, address: null, sells: [], shopsApprox: 3, driversApprox: 2, status: "aprobado", ownerName: null, ownerContact: null, createdAt: "2026-11-01T15:00:00Z", explorerUrl: "https://stellar.expert/explorer/testnet" },
        { id: "d-00", businessName: "Importadora Fantasma", nit: null, address: null, sells: [], shopsApprox: null, driversApprox: null, status: "rechazado", ownerName: null, ownerContact: null, createdAt: "2026-11-03T15:00:00Z", explorerUrl: "https://stellar.expert/explorer/testnet" },
      ],
    });
    /** What the server would answer a signed-in, approved distributor (or an admin) for this call. */
    const answer = (path, args, data) => {
      const active = data.drivers.filter((d) => d.status === "activo").map((d) => ({ id: d.id, name: d.name }));
      if (path === "/distribuidor/factura") {
        if (args.length === 0) return { distributorName: NAME, shops: data.shops.map((s) => ({ id: s.id, name: s.nickname ?? s.name, owner: s.ownerName ?? "", driverId: s.driverId })), drivers: active, suggestedId: 1009, today: "2026-11-14" };
        return { ok: true, message: `Factura ${args[0].invoiceId} creada.`, txHash: "0", explorerUrl: "https://stellar.expert/explorer/testnet", invoiceId: args[0].invoiceId };
      }
      if (path === "/distribuidor/motoristas") return args.length === 0 ? { distributorName: NAME, drivers: data.drivers } : undefined;
      if (path === "/distribuidor/tiendas") {
        if (args.length === 0) return { distributorName: NAME, shops: data.shops, drivers: active };
        if (typeof args[0] === "string")
          return [
            { id: "tienda-20", name: "Tienda La Esperanza", ownerName: "María Elena Rivas", address: "Col. Zacamil, Mejicanos" },
            { id: "tienda-21", name: "Abarrotería San José", ownerName: "José Portillo", address: "Barrio San Jacinto, San Salvador" },
          ];
        return { ok: true, shopId: "tienda-30", code: "N3W5HP" };
      }
      if (path === "/admin") return args.length === 0 ? { pending: data.pending, decided: data.decided } : undefined;
    };
    const signedIn = async (page) => {
      const data = sample();
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (request.method() !== "POST" || !request.headers()["next-action"]) return route.fallback();
        let args = [];
        try {
          args = JSON.parse(request.postData() || "[]");
        } catch {}
        const found = answer(new URL(request.url()).pathname, args, data);
        if (found === undefined) return route.fallback();
        // The first line of a server action's answer carries the build's id: keep it, and swap the value on the second.
        const head = (await (await route.fetch()).text()).split("\n")[0];
        await route.fulfill({ status: 200, contentType: "text/x-component", body: `${head}\n1:${JSON.stringify(found)}\n` });
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("main h1, main h2").first().waitFor({ timeout: 20_000 });
      await page.waitForTimeout(400);
    };
    const filled = async (page) => {
      await signedIn(page);
      const search = page.getByPlaceholder(/Buscar entre sus tiendas|Search your shops/);
      await search.fill("rosa");
      await search.press("Enter");
      await page.locator("form input[inputmode=decimal]").fill("48.50");
      await page.locator("form textarea").fill("Agua 600 ml x 24  $30.00\nJugos surtidos x 12  $18.50\nEntregar antes de las 10");
      await page.locator("form textarea").blur();
      await page.waitForTimeout(800); // the button waits a beat after a shop is picked
    };
    /** A distributor approved today: nothing invoiced yet, so "Primeros pasos" is on the panel with one step left. */
    const newDistributor = async (page) => {
      await page.route("**/_next/static/chunks/*.js", async (route) => {
        const response = await route.fetch();
        const body = await response.text();
        if (!/isDemo:!0\},invoices:\w+,total:\w+/.test(body)) return route.fulfill({ response });
        await route.fulfill({ response, body: body.replace(/isDemo:!0\},invoices:\w+,total:\w+/, "isDemo:!1},invoices:[],total:0") });
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("#pasos").waitFor({ timeout: 20_000 });
    };
    return [
      // The booth laptop: the whole form, its button and the slip it makes are in view without scrolling.
      ["nueva-factura", "/distribuidor/factura", { prepare: filled, inView: { "1280x800": { selector: "main form button[type=submit], main aside section", count: 2 } } }],
      [
        "nueva-factura-recibo", // a phone has the slip behind "Ver recibo"
        "/distribuidor/factura",
        {
          prepare: async (page) => {
            await filled(page);
            const fold = page.getByRole("button", { name: /Ver recibo|See receipt/ });
            if (await fold.isVisible()) await fold.click();
          },
        },
      ],
      [
        "nueva-factura-creada",
        "/distribuidor/factura",
        {
          prepare: async (page) => {
            await filled(page);
            await press(page, /Crear factura|Create invoice/);
            await page.getByText(/Factura creada|Invoice created/).first().waitFor({ timeout: 20_000 });
            await page.waitForTimeout(3200); // the hold after the invoice is made, then the next button's beat
          },
        },
      ],
      [
        "motoristas", // with one invite's link on show
        "/distribuidor/motoristas",
        {
          prepare: async (page) => {
            await signedIn(page);
            await page.locator("button:visible", { hasText: /Ver enlace|Show link/ }).first().click();
          },
        },
      ],
      [
        "tiendas", // after a search
        "/distribuidor/tiendas",
        {
          prepare: async (page) => {
            await signedIn(page);
            await page.getByLabel(/Nombre de la tienda o teléfono|Shop name or phone/).fill("esperanza");
            await press(page, /^Buscar$|^Search$/);
            await page.getByText("Tienda La Esperanza").first().waitFor({ timeout: 20_000 });
          },
        },
      ],
      [
        "tiendas-sin-cuenta",
        "/distribuidor/tiendas",
        {
          prepare: async (page) => {
            await signedIn(page);
            await page.getByRole("tab", { name: /Agregar sin cuenta|Add without an account/ }).click();
          },
        },
      ],
      ["admin", "/admin", { prepare: signedIn }],
      ["primeros-pasos", "/distribuidor", { prepare: newDistributor }],
      ["sin-sesion", "/distribuidor/motoristas"], // what anyone else sees: one sentence, one way out
      ["no-encontrada", "/esta-pagina-no-existe"],
    ];
  })(),
};

// The device bands of DESIGN.md. Phones and tablets are also turned on their side.
const PORTRAIT = [
  [280, 653], // foldable, folded
  [320, 568],
  [360, 640], // the floor
  [375, 667],
  [390, 844],
  [393, 852],
  [412, 915],
  [360, 800],
  [384, 854],
  [412, 919],
  [673, 841], // foldable, unfolded
  [768, 1024],
  [820, 1180],
  [800, 1280],
];
const DESKTOP = [
  [1280, 800], // the booth laptop
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
const SIZES = [...PORTRAIT, ...PORTRAIT.filter(([w]) => w >= 320).map(([w, h]) => [h, w]), ...DESKTOP].filter(
  ([w, h], i, all) => all.findIndex(([w2, h2]) => w2 === w && h2 === h) === i,
);

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const group = args.find((arg) => !arg.startsWith("--") && args[args.indexOf(arg) - 1]?.startsWith("--") !== true) ?? "system";
const base = flag("--base", "http://localhost:3000");
const lang = flag("--lang", "es");
const outDir = resolve(root, flag("--out", "docs/screenshots/redesign"));
const only = flag("--only"); // one screen name
const fullPage = args.at(-1) === "--full"; // last on the line: the whole page in each shot, not only the first screenful
const oneSize = flag("--size"); // one size, as 1280x800: a quick look while building (its sheet gets its own name)
const zoom = Number(flag("--zoom", "1")); // 2 = the browser zoomed to 200%: the same window, half as many CSS pixels
const text = Number(flag("--text", "1")); // 1.5 = the phone's text size raised by half
const variant = `${lang === "es" ? "" : `-${lang}`}${zoom === 1 ? "" : `-zoom${zoom}`}${text === 1 ? "" : `-text${text}`}${oneSize ? `-${oneSize}` : ""}`;
const MIN_TARGET = 44;

if (!GROUPS[group]) {
  console.error(`Unknown group "${group}". Use one of: ${Object.keys(GROUPS).join(", ")}`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright isn't installed where Node can find it. Try: npm i -g playwright && npx playwright install chromium");
  process.exit(1);
}

/** Runs in the page: what's wrong at this size? */
function inspect([minTarget, width]) {
  const problems = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1) problems.push(`scrolls sideways by ${doc.scrollWidth - doc.clientWidth}px`);
  // A phone browser widens the page to fit what sticks out, so nothing "scrolls": the page is just wider than the screen.
  if (window.innerWidth > width + 1) problems.push(`${window.innerWidth - width}px wider than the screen (a phone would zoom out or scroll sideways)`);
  const shown = (el) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return style.visibility !== "hidden" && style.display !== "none" && box.width > 0 && box.height > 0;
  };
  const name = (el) => (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
  let smallest = Infinity;
  for (const el of document.querySelectorAll("a[href], button, input, select, textarea, [role=button], summary")) {
    if (!shown(el) || el.closest("[aria-hidden=true]") || el.disabled) continue;
    const box = el.getBoundingClientRect();
    // A link inside a sentence is text, not a button.
    if (el.tagName === "A" && getComputedStyle(el).display === "inline") continue;
    // The tappable area can be bigger than the box (a ::before that extends it).
    const before = getComputedStyle(el, "::before");
    const extra = before.content !== "none" && before.position === "absolute" ? Math.abs(parseFloat(before.top) || 0) + Math.abs(parseFloat(before.bottom) || 0) : 0;
    const height = box.height + extra;
    smallest = Math.min(smallest, height, box.width);
    if (height < minTarget - 0.5 || box.width < minTarget - 0.5) problems.push(`small target ${Math.round(box.width)}x${Math.round(height)}: "${name(el)}"`);
    if (box.right > doc.clientWidth + 1 || box.left < -1) problems.push(`off screen: "${name(el)}"`);
  }
  for (const el of document.querySelectorAll("p, span, h1, h2, h3, dt, dd, td, th, a, button, label, li")) {
    if (!shown(el) || el.children.length > 0 || !el.textContent.trim() || el.closest(".sr-only")) continue;
    const style = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 1 && style.overflowX !== "visible" && style.textOverflow !== "ellipsis") problems.push(`clipped text: "${name(el)}"`);
    const box = el.getBoundingClientRect();
    if (box.right > doc.clientWidth + 1) problems.push(`text past the edge: "${name(el)}"`);
  }
  return { problems: [...new Set(problems)], smallest: Number.isFinite(smallest) ? Math.round(smallest) : null };
}

const browser = await chromium.launch();
const failures = [];
mkdirSync(outDir, { recursive: true });

/** Mock reads answer after a second each, one after another: wait until "Cargando..." has gone. */
const loaded = (page) =>
  page.waitForFunction(() => ![...document.querySelectorAll("[role=status]")].some((el) => el.checkVisibility() && /Cargando|Loading/.test(el.textContent)), null, { timeout: 10_000 }).catch(() => {});

for (const [screen, path, { inView = {}, minTarget = MIN_TARGET, prepare } = {}] of GROUPS[group]) {
  if (only && only !== screen) continue;
  const shots = [];
  let smallest = Infinity;
  for (const [fullWidth, fullHeight] of SIZES) {
    if (oneSize && oneSize !== `${fullWidth}x${fullHeight}`) continue;
    const [width, height] = [Math.round(fullWidth / zoom), Math.round(fullHeight / zoom)];
    if (width < 280) continue; // nothing is narrower than the folded phone
    const touch = fullWidth < 1100;
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: touch && Math.min(width, height) < 700, hasTouch: touch });
    const page = await context.newPage();
    if (text !== 1) await page.addInitScript((scale) => document.addEventListener("DOMContentLoaded", () => (document.documentElement.style.fontSize = `${scale * 100}%`)), text);
    const url = new URL(path, base);
    if (lang !== "es") url.searchParams.set("lang", lang);
    await page.goto(url.href, { waitUntil: "networkidle" });
    await loaded(page);
    if (prepare) {
      await prepare(page);
      await loaded(page);
    }
    await page.waitForTimeout(1200); // the slip prints in
    const result = await page.evaluate(inspect, [minTarget, width]);
    const wanted = zoom === 1 && text === 1 ? inView[`${width}x${height}`] : undefined;
    if (wanted) {
      const { selector, count = 1 } = typeof wanted === "string" ? { selector: wanted } : wanted;
      const hidden = await page.evaluate((selector) => {
        const below = [...document.querySelectorAll(selector)].filter((el) => el.getBoundingClientRect().bottom > window.innerHeight || el.getBoundingClientRect().top < 0);
        return { found: document.querySelectorAll(selector).length, below: below.map((el) => el.textContent.trim().replace(/\s+/g, " ").slice(0, 30)) };
      }, selector);
      if (hidden.found < count) result.problems.push(`${hidden.found} of ${count} found for "${selector}"`);
      for (const text of hidden.below) result.problems.push(`not in view without scrolling: "${text}"`);
    }
    if (result.smallest !== null) smallest = Math.min(smallest, result.smallest);
    for (const problem of result.problems) failures.push(`${screen} ${width}x${height}: ${problem}`);
    const file = join(outDir, ".shots", `${group}-${screen}${variant}-${width}x${height}.png`);
    mkdirSync(dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage });
    shots.push({ file, width, height, bad: result.problems.length });
    await context.close();
  }

  // The contact sheet: every size side by side, at a third of its size (laptops at a quarter).
  const sheet = await browser.newPage({ viewport: { width: 2400, height: 1000 } });
  const cells = shots
    .map(({ file, width, height, bad }) => {
      const scale = width >= 1024 ? 0.3 : 0.4;
      const data = readFileSync(file).toString("base64");
      return `<figure><img width="${Math.round(width * scale)}" height="${Math.round(height * scale)}" src="data:image/png;base64,${data}"><figcaption class="${bad ? "bad" : ""}">${width}x${height}${bad ? ` · ${bad} to fix` : ""}</figcaption></figure>`;
    })
    .join("");
  await sheet.setContent(
    `<style>body{margin:0;padding:24px;background:#23272e;color:#e8e6df;font:14px system-ui,sans-serif}h1{font-size:18px;margin:0 0 16px}main{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end}figure{margin:0}img{display:block;outline:1px solid #555}figcaption{padding-top:5px;color:#b9bdc6}.bad{color:#ff9b8e}</style><h1>${group} · ${screen} · ${path} · ${lang}${zoom === 1 ? "" : ` · zoom ${zoom * 100}%`}${text === 1 ? "" : ` · text ${text * 100}%`} · ${shots.length} sizes</h1><main>${cells}</main>`,
  );
  const sheetFile = join(outDir, `${group}-${screen}${variant}.png`);
  await sheet.screenshot({ path: sheetFile, fullPage: true });
  await sheet.close();
  await shrink(sheetFile);
  console.log(`${screen}: ${shots.length} sizes, smallest touch target ${Number.isFinite(smallest) ? smallest : "-"}px (${minTarget} allowed), sheet ${sheetFile.replace(`${root}/`, "")}`);
}

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} to fix:`);
  for (const failure of failures) console.log(`  ${failure}`);
  process.exit(1);
}
console.log("\nEvery size passed: no sideways scroll, no clipped text, no touch target under its minimum.");
