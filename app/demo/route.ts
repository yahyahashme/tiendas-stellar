// The trifold QR points here. Each visit makes a new invoice for one of the
// demo shops and sends the phone to it, so every judge pays their own invoice.
// A route handler (not a page) so it runs on every request, also for curl.

import { connection, NextResponse } from "next/server";
import { createDemoInvoice } from "@/app/actions";
import { USE_MOCKS } from "@/lib/api";

const ERROR_PAGE = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>No se pudo crear la factura · Couldn't create the invoice</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px 16px; background: #e6e1d4; color: #14202e; font-size: 1.0625rem; line-height: 1.5; }
  main { max-width: 28rem; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .paper { background: #fffdf8; border-radius: 2px; padding: 20px 16px; display: flex; flex-direction: column; gap: 12px; }
  h1 { font-size: 1.375rem; line-height: 1.25; margin: 0; }
  p { margin: 0; }
  .en { color: #4f5a68; border-top: 2px dotted #d9d3c4; padding-top: 12px; }
  .en h2 { font-size: 1.0625rem; margin: 0 0 4px; }
  a { display: flex; min-height: 52px; align-items: center; justify-content: center; padding: 8px 20px; border-radius: 10px; background: #0b4ea2; color: #fff;
      font-size: 1.125rem; font-weight: 700; text-align: center; text-decoration: none; }
</style>
</head>
<body><main>
  <div class="paper">
    <h1>No pudimos crear su factura</h1>
    <p>Puede ser la conexión. Espere unos segundos e intente de nuevo.</p>
    <section class="en" lang="en">
      <h2>We couldn't create your invoice</h2>
      <p>It may be the connection. Wait a few seconds and try again.</p>
    </section>
  </div>
  <a href="/demo">Intentar de nuevo · Try again</a>
</main></body>
</html>`;

// A burst of five judges can take ~30 s (one distributor account signs every invoice);
// give the function time to answer with our own page instead of a platform error.
export const maxDuration = 60;

// A public URL that signs transactions: cap how many invoices one server instance
// makes per minute, so a bot or a link checker can't fill the contract.
const MAX_PER_MINUTE = 20;
let recent: number[] = [];

function allowed(now = Date.now()): boolean {
  recent = recent.filter((at) => now - at < 60_000);
  if (recent.length >= MAX_PER_MINUTE) return false;
  recent.push(now);
  return true;
}

function redirect(path: string, request: Request) {
  const target = new URL(path, request.url);
  // Keep ?lang=en so a judge's English link opens the invoice in English.
  const lang = new URL(request.url).searchParams.get("lang");
  if (lang === "en" || lang === "es") target.searchParams.set("lang", lang);
  const response = NextResponse.redirect(target, 303);
  response.headers.set("cache-control", "no-store"); // never replay a redirect to an earlier invoice
  return response;
}

function errorPage() {
  return new NextResponse(ERROR_PAGE, {
    status: 503,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(request: Request) {
  await connection(); // never prerender: every visit is a new invoice
  // The mock store lives in each browser tab, so in mock mode use a seeded invoice.
  if (USE_MOCKS) return redirect("/tienda/1001", request);
  if (!allowed()) return errorPage();
  try {
    const invoice = await createDemoInvoice();
    return redirect(`/tienda/${invoice.id}`, request);
  } catch {
    return errorPage();
  }
}

/** Next would answer HEAD by running GET; a link checker or `curl -I` must not make an invoice. */
export async function HEAD() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
