import type { ReactNode } from "react";
import { ActionLink, ButtonLink } from "@/components/kit/button";
import { Money } from "@/components/kit/money";
import { Paper, Receipt, ReceiptFoot, ReceiptHeader, ReceiptLine, ReceiptLines, ReceiptRule, ReceiptTotal } from "@/components/kit/paper";
import { Stamp, type StampTone } from "@/components/kit/stamp";
import { Logo } from "@/components/logo";
import { TAGLINE } from "@/lib/brand";
import { T } from "@/lib/i18n";
import { AccountLink, DriverLinks, ShopLinks } from "./home-links";

// The home page. First screen: the logo, "Paga tu ruta", one sentence, a paid receipt and the two ways in.
// Under it, the three roles as their three papers (el recibo, la hoja de ruta, el libro mayor), each with
// its way into the demo. The page is drawn on the server; only the words (two languages) and the demo's
// links wait for the browser (app/home-links.tsx).

// The same side margins and safe areas as the Slip and Split layouts (components/kit/layout.tsx).
const SIDE = "pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))]";

/** One delivery told three ways: the same three invoices are on the receipts, the route sheet and the ledger. */
const INVOICES: { id: number; shop: string; amount: number; tone: StampTone; status: [string, string] }[] = [
  { id: 1001, shop: "Tienda Rosa", amount: 150, tone: "ok", status: ["Pagada", "Paid"] },
  { id: 1002, shop: "Tienda Don Luis", amount: 85.5, tone: "credit", status: ["En crédito", "On credit"] },
  { id: 1003, shop: "Mini Súper La Esquina", amount: 220, tone: "ink", status: ["Pendiente", "Unpaid"] },
];
const TOTAL = INVOICES.reduce((sum, invoice) => sum + invoice.amount, 0);

const invoiceNo = (id: number) => (
  <>
    <T es="Factura n.º" en="Invoice no." /> {id}
  </>
);

// A phone in the hand that is under 576 px tall (one column, so narrower than 640 px).
const TINY = "max-[39.99rem]:[@media(max-height:35.99rem)]:hidden";

/** The hero: a real receipt, paid. It prints in once and its stamp lands (no buzz: nothing was paid here). */
function PaidReceipt() {
  return (
    <Receipt printIn>
      {/* On the smallest phones (under 576 px tall) the slip is only its total and its stamp, so both ways in still fit under it. */}
      <div className={`contents ${TINY}`}>
        <ReceiptHeader from="Distribuidora El Sol" number={invoiceNo(1001)} />
      </div>
      {/* On a phone under 816 px tall (and on a laptop under 576) the lines step aside, so the total, the stamp and
          both ways in stay in view. So do they on paper too narrow for a name beside its label (a printed line
          never breaks its figure). */}
      <div className="contents max-[39.99rem]:[@media(max-height:50.99rem)]:hidden @max-[13.5rem]:hidden [@media(max-height:35.99rem)]:hidden">
        <ReceiptRule />
        <ReceiptLines>
          <ReceiptLine label={<T es="Cliente" en="Customer" />}>Tienda Rosa</ReceiptLine>
          <ReceiptLine label={<T es="Motorista" en="Driver" />}>Carlos</ReceiptLine>
          <ReceiptLine label="Arroz 5 lb × 12">
            <Money value={54} />
          </ReceiptLine>
          <ReceiptLine label="Frijol 2 lb × 20">
            <Money value={46} />
          </ReceiptLine>
          <ReceiptLine label="Aceite 750 ml × 10">
            <Money value={50} />
          </ReceiptLine>
        </ReceiptLines>
      </div>
      <ReceiptTotal label="Total" value={150} note={<T es="Pagada · Dólares digitales" en="Paid · Digital dollars" />} />
      {/* The foot of a slip (ReceiptFoot), except that on a very narrow slip the stamp goes under the words instead of squeezing them. */}
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className={`min-w-[7.5rem] flex-1 text-base text-muted text-pretty ${TINY}`}>
          <T es="Sin comisiones para la tienda." en="No fees for the shop." />
        </p>
        <div className="-mt-2 ml-auto shrink-0 pr-1">
          <Stamp tone="ok" fit={6} className="stamp-land [animation-delay:300ms]">
            <T es="Pagada" en="Paid" />
          </Stamp>
        </div>
      </div>
    </Receipt>
  );
}

/** The shop's paper: el recibo. This one was paid with "Pagar en 7 días". */
function CreditReceipt() {
  const invoice = INVOICES[1];
  return (
    <Receipt>
      <ReceiptHeader from="Distribuidora El Sol" number={invoiceNo(invoice.id)} />
      {/* A printed line never breaks its figure, so the customer's name is left out where it would not fit (a folded phone with large text). */}
      <div className="contents @max-[15.9rem]:hidden">
        <ReceiptRule />
        <ReceiptLines>
          <ReceiptLine label={<T es="Cliente" en="Customer" />}>{invoice.shop}</ReceiptLine>
        </ReceiptLines>
      </div>
      <ReceiptTotal label="Total" value={invoice.amount} note={<T es="Paga en 7 días" en="Pays in 7 days" />} />
      <ReceiptFoot
        stamp={
          <Stamp tone={invoice.tone} tilt={-4} fit={10}>
            <T es={invoice.status[0]} en={invoice.status[1]} />
          </Stamp>
        }
      />
    </Receipt>
  );
}

/** A small stamp on a sample: on the narrowest paper with the largest text it may break between its words. */
const MARK = "whitespace-normal text-center";

/** The driver's paper: la hoja de ruta. Numbered stops, each with its amount and its stamp. */
function RouteSheet() {
  return (
    <Paper as="div" className="@container">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-ink px-3 py-2 font-mono text-label font-medium uppercase tracking-[0.04em] text-muted">
        <T es="Ruta de Carlos" en="Carlos's route" />
        <span>
          {INVOICES.length} <T es="paradas" en="stops" />
        </span>
      </p>
      <ol>
        {INVOICES.map((invoice, i) => (
          <li key={invoice.id} className="flex items-stretch border-paper-rule not-last:border-b">
            <span className="flex w-[clamp(2.25rem,14cqi,3rem)] shrink-0 items-center justify-center border-r-2 border-dotted border-paper-rule font-mono text-[1.75rem] font-semibold">{i + 1}</span>
            {/* Two lines: name and amount, invoice and stamp. Where a pair has no room on one line, its second half goes under, at the right. */}
            <span className="flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 flex-[1_1_6rem] text-[1.0625rem] font-bold text-balance">{invoice.shop}</span>
                <Money value={invoice.amount} className="ml-auto text-[1.0625rem] font-semibold" />
              </span>
              <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-mono text-label font-medium text-muted">
                  <T es="Factura" en="Invoice" /> {invoice.id}
                </span>
                <span className="ml-auto min-w-0">
                  <Stamp small tone={invoice.tone} className={MARK}>
                    <T es={invoice.status[0]} en={invoice.status[1]} />
                  </Stamp>
                </span>
              </span>
            </span>
          </li>
        ))}
      </ol>
    </Paper>
  );
}

/**
 * The distributor's paper: el libro mayor. Ruled columns, figures to the right, the total under a double rule.
 * On paper too narrow for a stamp beside the column of figures, the rule between the columns goes and the stamp
 * takes the whole width under the name.
 */
function LedgerPage() {
  const heading = "flex min-h-10 items-center px-3 text-label font-semibold uppercase tracking-[0.08em] text-muted";
  const line = "col-span-2 grid grid-cols-subgrid";
  const ruled = "@min-[17rem]:border-l @min-[17rem]:border-paper-rule";
  return (
    <Paper as="div" className="@container">
      <div className="grid grid-cols-[minmax(0,1fr)_auto]">
        <p className={`${line} border-b border-ink`}>
          <span className={heading}>
            <T es="Tienda" en="Shop" />
          </span>
          <span className={`${heading} justify-end ${ruled}`}>
            <T es="Monto" en="Amount" />
          </span>
        </p>
        {INVOICES.map((invoice) => (
          <p key={invoice.id} className={`${line} border-b border-paper-rule`}>
            <span className="px-3 pt-2">{invoice.shop}</span>
            <span className={`px-3 py-2 text-right font-mono font-medium @min-[17rem]:row-span-2 ${ruled}`}>
              <Money value={invoice.amount} />
            </span>
            <span className="col-span-2 px-3 pb-2 pt-1 @min-[17rem]:col-span-1">
              <Stamp small tone={invoice.tone} className={MARK}>
                <T es={invoice.status[0]} en={invoice.status[1]} />
              </Stamp>
            </span>
          </p>
        ))}
        <p className={`${line} border-t-[3px] border-double border-ink`}>
          <span className="flex min-h-12 items-center px-3 font-semibold">Total</span>
          <span className={`flex min-h-12 items-center justify-end px-3 font-mono font-semibold ${ruled}`}>
            <Money value={TOTAL} />
          </span>
        </p>
      </div>
    </Paper>
  );
}

/**
 * One role: who it is and the name of its paper, one sentence, the paper itself, then the way into the demo.
 * On a phone they stack; on a tablet the paper sits beside the words; on a laptop the three roles stand side by side.
 */
function Role({ id, who, paper, children, sample, links }: { id: string; who: ReactNode; paper: ReactNode; children: ReactNode; sample: ReactNode; links: ReactNode }) {
  return (
    <article
      aria-labelledby={id}
      className="grid gap-y-3 min-[40rem]:max-[63.99rem]:grid-cols-2 min-[40rem]:max-[63.99rem]:grid-rows-[auto_1fr] min-[40rem]:max-[63.99rem]:gap-x-8 min-[64rem]:row-span-3 min-[64rem]:grid-rows-subgrid"
    >
      <header className="flex flex-col gap-1.5 min-[40rem]:max-[63.99rem]:col-start-2">
        <h3 id={id} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-counter-rule pb-1">
          <span className="text-lead font-bold">{who}</span>
          <span className="text-label font-semibold uppercase tracking-[0.1em] text-muted">{paper}</span>
        </h3>
        <p className="text-pretty">{children}</p>
      </header>
      <div className="min-[40rem]:max-[63.99rem]:col-start-1 min-[40rem]:max-[63.99rem]:row-span-2 min-[40rem]:max-[63.99rem]:row-start-1">{sample}</div>
      <div className="flex flex-col gap-2 min-[40rem]:max-[63.99rem]:col-start-2">{links}</div>
    </article>
  );
}

export default function Home() {
  return (
    <main className={`mx-auto flex w-full max-w-[calc(28rem+2*var(--gutter))] flex-1 flex-col gap-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-1 min-[40rem]:max-w-[calc(64rem+2*var(--gutter))] min-[40rem]:gap-14 ${SIDE}`}>
      <section className="grid gap-y-3 min-[40rem]:grid-cols-[minmax(0,28rem)_minmax(0,26rem)] min-[40rem]:grid-rows-[auto_1fr_1fr] min-[40rem]:justify-between min-[40rem]:gap-x-[clamp(1.5rem,5vw,4rem)]">
        <header className="flex min-h-12 items-center justify-between gap-3 min-[40rem]:col-span-2">
          {/* 36 px tall; on the narrowest phone with the largest text it gives way to the link beside it. */}
          <Logo className="h-auto max-w-[7.5rem] min-w-0 flex-1" />
          <AccountLink />
        </header>

        <div className="flex flex-col gap-2 min-[40rem]:col-start-2 min-[40rem]:row-start-2 min-[40rem]:gap-3 min-[40rem]:self-end">
          <h1 className="text-display font-bold tracking-[-0.02em] text-balance">{TAGLINE}</h1>
          <p className="text-lead text-pretty">
            <T
              es="La tienda le paga al distribuidor con dólares digitales, en efectivo o en 7 días sin intereses."
              en="The shop pays its distributor in digital dollars, in cash, or in 7 days with no interest."
            />
          </p>
        </div>

        <div className="min-[40rem]:col-start-1 min-[40rem]:row-span-2 min-[40rem]:row-start-2">
          <PaidReceipt />
        </div>

        <div className="flex flex-col gap-2 self-start min-[40rem]:col-start-2 min-[40rem]:row-start-3 min-[40rem]:pt-3">
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
            <T es="Una entrega, tres papeles. Abra cualquiera." en="One delivery, three papers. Open any of them." />
          </p>
        </header>

        <div className="grid gap-x-8 gap-y-10 min-[64rem]:grid-cols-3 min-[64rem]:gap-y-3">
          <Role id="rol-tienda" who={<T es="La tienda" en="The shop" />} paper={<T es="El recibo" en="The receipt" />} sample={<CreditReceipt />} links={<ShopLinks />}>
            <T es="Paga cada factura desde el teléfono: ahora, en efectivo o en 7 días sin intereses." en="Pays each invoice from the phone: now, in cash, or in 7 days with no interest." />
          </Role>
          <Role id="rol-motorista" who={<T es="El motorista" en="The driver" />} paper={<T es="La hoja de ruta" en="The route sheet" />} sample={<RouteSheet />} links={<DriverLinks />}>
            <T es="Lleva la ruta del día en el teléfono y registra el efectivo que recibe." en="Carries the day's route on the phone and records the cash received." />
          </Role>
          <Role
            id="rol-distribuidora"
            who={<T es="La distribuidora" en="The distributor" />}
            paper={<T es="El libro mayor" en="The ledger" />}
            sample={<LedgerPage />}
            links={<ActionLink href="/distribuidor" title="Distribuidora El Sol" hint={<T es="Panel y facturas" en="Dashboard and invoices" />} />}
          >
            <T es="Ve qué se cobró, qué falta y cuánto efectivo traen sus motoristas." en="Sees what was collected, what's left, and how much cash the drivers carry." />
          </Role>
        </div>
      </section>
    </main>
  );
}
