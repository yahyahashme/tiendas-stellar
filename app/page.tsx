import type { ReactNode } from "react";
import { ActionLink } from "@/components/kit/button";
import { Paper } from "@/components/kit/paper";
import { Logo } from "@/components/logo";
import { TAGLINE, TAGLINE_EN } from "@/lib/brand";
import { T } from "@/lib/i18n";
import { AccountLink, DriverLinks, ShopLinks } from "./home-links";

// The home page, top to bottom: "Crear cuenta" and "Entrar" at the top right (the shop or distributor choice is on
// /registro), the tagline and what Relay does, the problem
// in three figures, how it works (three steps joined by hand-drawn arrows), then the demo's three ways in.
// The page is drawn on the server; only the words (two languages) and the demo's links wait for the browser
// (app/home-links.tsx). The figures and their sources are in docs/facts.md (entries 1, 9 and 10).

// The same side margins and safe areas as the Slip and Split layouts (components/kit/layout.tsx).
const SIDE = "pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))]";

const KICKER = "text-label font-semibold uppercase tracking-[0.1em] text-muted";

/** The problem in three figures (docs/facts.md, entries 1, 9 and 10). */
const FIGURES: { figure: [string, string]; text: [string, string] }[] = [
  {
    figure: ["$2 mil millones", "$2 billion"],
    text: [
      "en mercadería al año le venden las distribuidoras a las tiendas de barrio. La mayoría se paga en efectivo al motorista.",
      "of stock a year is sold to neighbourhood shops by distributors. Most of it is paid in cash to the driver.",
    ],
  },
  {
    figure: ["6 de cada 10", "6 in 10"],
    text: ["microempresas informales le han pedido prestado a un prestamista.", "informal small businesses have borrowed from a loan shark."],
  },
  {
    figure: ["$35 por cada $100", "$35 per $100"],
    text: ["es lo que cobra de interés un prestamista, según una encuesta de 2019.", "is what a loan shark charges in interest, according to a 2019 survey."],
  },
];

/** How it works, in the order it happens on a delivery day. */
const STEPS: { icon: ReactNode; title: [string, string]; text: [string, string] }[] = [
  {
    icon: (
      <>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M10 6.5h4M10 10h4M10 13.5h2.5" />
      </>
    ),
    title: ["La factura llega al teléfono", "The invoice reaches the phone"],
    text: ["El motorista entrega el pedido y la factura aparece en el teléfono de la tienda.", "The driver delivers the order and the invoice shows up on the shop owner's phone."],
  },
  {
    icon: (
      <>
        <circle cx="9" cy="9" r="5.5" />
        <path d="M15.4 9.6a5.5 5.5 0 1 1-5.8 5.8" />
        <path d="M9 6.5v5" />
      </>
    ),
    title: ["La tienda elige cómo pagar", "The shop chooses how to pay"],
    text: [
      "Con dólares digitales, en efectivo confirmado por los dos en la app, o en 7 días sin intereses.",
      "In digital dollars, in cash that both sides confirm in the app, or in 7 days with no interest.",
    ],
  },
  {
    icon: (
      <>
        <path d="M3 20h18" />
        <path d="M5 16l5-5 3.5 3.5L20 8" />
        <path d="M15 8h5v5" />
      </>
    ),
    title: ["Pagar a tiempo abre más crédito", "Paying on time opens more credit"],
    text: [
      "Cada pago a tiempo sube el límite $25, de $200 hasta $500. El historial es de la tienda y lo puede mostrar a cualquier distribuidora, banco o cooperativa.",
      "Each on-time payment raises the limit by $25, from $200 up to $500. The record belongs to the shop, and it can show it to any distributor, bank or cooperative.",
    ],
  },
];

/** A hand-drawn arrow with a loop in it, from one step to the next: across on a laptop, down on a phone. */
function CurlyArrow() {
  return (
    <div className="flex h-24 w-12 items-center justify-center min-[64rem]:h-9 min-[64rem]:w-auto min-[64rem]:px-2" aria-hidden="true">
      <svg viewBox="0 0 80 48" className="h-12 w-20 shrink-0 rotate-90 text-brand min-[64rem]:h-auto min-[64rem]:w-full min-[64rem]:rotate-0" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 34C18 36 24 12 38 10C50 8 52 26 42 28C32 30 36 12 52 14C60 15 66 19 72 24" />
        <path d="M63 25.5L72.5 24.5L69 15.5" />
      </svg>
    </div>
  );
}

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
    <main className={`mx-auto flex w-full max-w-[calc(28rem+2*var(--gutter))] flex-1 flex-col gap-12 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-1 min-[40rem]:max-w-[calc(64rem+2*var(--gutter))] min-[40rem]:gap-16 ${SIDE}`}>
      <section className="flex flex-col gap-y-6">
        <header className="flex min-h-12 items-center justify-between gap-3">
          {/* 36 px tall; on the narrowest phone with the largest text it gives way to the link beside it. */}
          <Logo className="h-auto max-w-[7.5rem] min-w-0 flex-1" />
          <AccountLink />
        </header>

        <div className="flex max-w-[44rem] flex-col gap-3 min-[40rem]:pt-6">
          <p className={KICKER}>
            <T es="Pagos y crédito para tiendas de barrio · El Salvador" en="Payments and credit for neighbourhood shops · El Salvador" />
          </p>
          <h1 className="text-display font-bold tracking-[-0.02em] text-balance">
            <T es={TAGLINE} en={TAGLINE_EN} />
          </h1>
          <p className="text-lead text-pretty">
            <T
              es="Relay cambia el efectivo por dólares digitales cuando la tienda le paga el pedido a su distribuidora, y le da crédito a 7 días sin intereses que crece con cada pago a tiempo."
              en="Relay replaces cash with digital dollars when a shop pays its distributor for stock, and gives it 7-day, zero-interest credit that grows with every on-time payment."
            />
          </p>
        </div>

      </section>

      <section aria-labelledby="problema" className="flex flex-col gap-5">
        <header className="flex max-w-[44rem] flex-col gap-2">
          <h2 id="problema" className="text-title font-bold">
            <T es="El problema" en="The problem" />
          </h2>
          <p className="text-lead text-pretty">
            <T
              es="Casi todas las tiendas le pagan el pedido al motorista en efectivo. Si el monto no cuadra, es la palabra de uno contra la del otro, y el pago no queda anotado en ningún lado: una tienda que ha pagado a tiempo por diez años se ve igual ante un banco que una que abrió la semana pasada."
              en="Most shops pay the driver in cash when stock arrives. When the amounts don't match, it's one person's word against the other's, and the payment isn't recorded anywhere: a shop that has paid on time for ten years looks the same to a bank as one that opened last week."
            />
          </p>
        </header>
        <Paper as="div">
          <dl className="grid min-[48rem]:grid-cols-3">
            {FIGURES.map(({ figure, text }, i) => (
              <div key={i} className="flex flex-col gap-1 border-paper-rule px-5 py-4 not-last:border-b min-[48rem]:not-last:border-b-0 min-[48rem]:not-last:border-r">
                <dt className="font-mono text-[1.75rem] font-semibold leading-tight tracking-[-0.01em]">
                  <T es={figure[0]} en={figure[1]} />
                </dt>
                <dd className="text-pretty text-muted">
                  <T es={text[0]} en={text[1]} />
                </dd>
              </div>
            ))}
          </dl>
        </Paper>
        <p className="text-label text-muted">
          <T es="Fuentes: Conamype (estimado, 2026); El Diario de Hoy (estudio de 2026); encuesta a 1,285 comerciantes (2019)." en="Sources: Conamype (estimate, 2026); El Diario de Hoy (2026 study); survey of 1,285 merchants (2019)." />
        </p>
      </section>

      <section aria-labelledby="como" className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 id="como" className="text-title font-bold">
            <T es="Cómo funciona" en="How it works" />
          </h2>
        </header>
        <ol className="grid min-[64rem]:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_5rem_minmax(0,1fr)] min-[64rem]:items-start">
          {STEPS.map(({ icon, title, text }, i) => (
            <li key={i} className="contents">
              {i > 0 && <CurlyArrow />}
              <div className="flex flex-col gap-2">
                <svg viewBox="0 0 24 24" className="size-9 text-brand" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {icon}
                </svg>
                <h3 className="text-lead font-bold text-balance">
                  <T es={title[0]} en={title[1]} />
                </h3>
                <p className="text-pretty">
                  <T es={text[0]} en={text[1]} />
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="max-w-[44rem] text-muted text-pretty">
          <T
            es="Si la tienda elige 7 días, un fondo de prestamistas le paga a la distribuidora en el momento. Las reglas de crédito están escritas en un contrato público: no se cambian para una sola tienda ni en secreto."
            en="If the shop picks 7 days, a lender pool pays the distributor right away. The credit rules are written in a public contract, so they can't be changed for one shop or quietly changed later."
          />
        </p>
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
