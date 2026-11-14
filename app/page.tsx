import type { ReactNode } from "react";
import { ActionLink, ButtonLink } from "@/components/kit/button";
import { Paper } from "@/components/kit/paper";
import { Logo } from "@/components/logo";
import { TAGLINE } from "@/lib/brand";
import { T } from "@/lib/i18n";
import { AccountLink, DriverLinks, ShopLinks, TaglineMeaning } from "./home-links";

// The home page. First: the logo, "Paga tu ruta", what Relay does in one sentence and three steps, then the
// two ways to make an account. Under it, the demo: three ways in (the shop, the driver, the distributor).
// The page is drawn on the server; only the words (two languages) and the demo's links wait for the browser
// (app/home-links.tsx).

// The same side margins and safe areas as the Slip and Split layouts (components/kit/layout.tsx).
const SIDE = "pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))]";

/** How Relay works, in the order it happens on a delivery day. */
const STEPS: [string, string][] = [
  ["La distribuidora entrega el pedido y la factura llega al teléfono de la tienda.", "The distributor delivers the order and the invoice arrives on the shop's phone."],
  [
    "La tienda paga como le convenga: con dólares digitales, en efectivo al motorista o en 7 días sin intereses.",
    "The shop pays the way that suits it: in digital dollars, in cash to the driver, or in 7 days with no interest.",
  ],
  ["La distribuidora ve cada pago al momento y sus motoristas cargan menos efectivo.", "The distributor sees every payment as it happens, and its drivers carry less cash."],
];

/** One way into the demo: a number, who you are, one sentence, then the links. */
function Role({ n, id, who, children, links }: { n: number; id: string; who: ReactNode; children: ReactNode; links: ReactNode }) {
  return (
    <article aria-labelledby={id} className="flex flex-col gap-3 min-[64rem]:row-span-3 min-[64rem]:grid min-[64rem]:grid-rows-subgrid">
      <header className="flex flex-col gap-1.5">
        <h3 id={id} className="flex items-baseline gap-3 border-b border-counter-rule pb-1">
          <span className="font-mono text-lead font-semibold text-muted" aria-hidden="true">
            {n}
          </span>
          <span className="text-lead font-bold">{who}</span>
        </h3>
        <p className="text-pretty">{children}</p>
      </header>
      <div className="flex flex-col gap-2">{links}</div>
    </article>
  );
}

export default function Home() {
  return (
    <main className={`mx-auto flex w-full max-w-[calc(28rem+2*var(--gutter))] flex-1 flex-col gap-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-1 min-[40rem]:max-w-[calc(64rem+2*var(--gutter))] min-[40rem]:gap-16 ${SIDE}`}>
      <section className="grid gap-y-6 min-[40rem]:grid-cols-[minmax(0,34rem)_minmax(0,22rem)] min-[40rem]:justify-between min-[40rem]:gap-x-[clamp(1.5rem,5vw,4rem)]">
        <header className="flex min-h-12 items-center justify-between gap-3 min-[40rem]:col-span-2">
          {/* 36 px tall; on the narrowest phone with the largest text it gives way to the link beside it. */}
          <Logo className="h-auto max-w-[7.5rem] min-w-0 flex-1" />
          <AccountLink />
        </header>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 min-[40rem]:gap-3">
            <h1 className="text-display font-bold tracking-[-0.02em] text-balance">
              {TAGLINE}
              <TaglineMeaning />
            </h1>
            <p className="text-lead text-pretty">
              <T
                es="Con Relay, las tiendas de barrio de El Salvador le pagan cada entrega a su distribuidora desde el teléfono."
                en="With Relay, neighbourhood shops in El Salvador pay their distributor for each delivery from their phone."
              />
            </p>
          </div>
          <Paper as="div">
            <ol className="flex flex-col">
              {STEPS.map(([es, en], i) => (
                <li key={i} className="flex items-stretch border-paper-rule not-last:border-b">
                  <span className="flex w-12 shrink-0 items-center justify-center border-r-2 border-dotted border-paper-rule font-mono text-[1.5rem] font-semibold" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 px-4 py-3 text-pretty">
                    <T es={es} en={en} />
                  </span>
                </li>
              ))}
            </ol>
          </Paper>
          <p className="text-muted text-pretty">
            <T es="Sin comisiones para la tienda." en="No fees for the shop." />
          </p>
        </div>

        <div className="flex flex-col gap-2 self-end">
          <h2 className="text-label font-semibold uppercase tracking-[0.1em] text-muted">
            <T es="Crear una cuenta" en="Create an account" />
          </h2>
          <ButtonLink
            href="/registro/tienda"
            hint={
              <span className="short:hidden">
                <T es="Compro a distribuidores" en="I buy from distributors" />
              </span>
            }
          >
            <T es="Soy tienda" en="I'm a shop" />
          </ButtonLink>
          <ButtonLink
            href="/registro/distribuidora"
            hint={
              <span className="short:hidden">
                <T es="Vendo y entrego a tiendas" en="I sell and deliver to shops" />
              </span>
            }
          >
            <T es="Soy distribuidora" en="I'm a distributor" />
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="demo" className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 id="demo" className="text-title font-bold">
            <T es="Probar la demo" en="Try the demo" />
          </h2>
          <p className="text-lead text-muted text-pretty">
            <T
              es="Elija cómo entrar: como la tienda, como el motorista o como la distribuidora. Todo usa dinero de prueba."
              en="Choose how to go in: as the shop, as the driver, or as the distributor. Everything uses test money."
            />
          </p>
        </header>

        <div className="grid gap-x-8 gap-y-10 min-[64rem]:grid-cols-3 min-[64rem]:gap-y-3">
          <Role n={1} id="rol-tienda" who={<T es="La tienda" en="The shop" />} links={<ShopLinks />}>
            <T es="Paga cada factura desde el teléfono: ahora, en efectivo o en 7 días sin intereses." en="Pays each invoice from the phone: now, in cash, or in 7 days with no interest." />
          </Role>
          <Role n={2} id="rol-motorista" who={<T es="El motorista" en="The driver" />} links={<DriverLinks />}>
            <T es="Lleva la ruta del día en el teléfono y registra el efectivo que recibe." en="Carries the day's route on the phone and records the cash received." />
          </Role>
          <Role
            n={3}
            id="rol-distribuidora"
            who={<T es="La distribuidora" en="The distributor" />}
            links={<ActionLink href="/distribuidor" title="Distribuidora El Sol" hint={<T es="Panel y facturas" en="Dashboard and invoices" />} />}
          >
            <T es="Ve qué se cobró, qué falta y cuánto efectivo traen sus motoristas." en="Sees what was collected, what's left, and how much cash the drivers carry." />
          </Role>
        </div>
      </section>
    </main>
  );
}
