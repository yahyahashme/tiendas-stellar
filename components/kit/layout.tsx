"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { ChevronBack } from "./icons";

// The three page layouts. All of them leave room for the notch and the home bar (safe areas),
// and size against the visible screen (dvh, svh), never vh.

const SIDE = "pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))]";
const FOOT = "pb-[max(1.5rem,env(safe-area-inset-bottom))]";

/**
 * Slip: one paper column, at most 28 rem wide, with real counter margins on wide screens.
 * For the shop's phone screens, sign-in, sign-up and anything else that is a single slip.
 */
export function Slip({ children, wide = false, className = "" }: { children: ReactNode; /** As wide as a Split (56 rem): for a page that holds a ledger. */ wide?: boolean; className?: string }) {
  return (
    <main className={`mx-auto flex w-full ${wide ? "max-w-[calc(56rem+2*var(--gutter))]" : "max-w-[calc(28rem+2*var(--gutter))]"} flex-1 flex-col gap-4 pt-1 ${SIDE} ${FOOT} ${className}`}>{children}</main>
  );
}

/**
 * Split: facts on paper on the left, actions on the right, like a slip laid on a counter next to a till.
 * Below 40 rem of room it becomes one column, facts first. On a phone held sideways the facts scroll
 * and the actions stay in view. Anything inside can ask which form it is in: `@min-[40rem]/split:`.
 */
export function Split({
  nav,
  facts,
  actions,
  pin = "actions",
  className = "",
}: {
  nav?: ReactNode;
  facts: ReactNode;
  actions: ReactNode;
  /**
   * Which side stays in view when the two sit side by side. "actions" (a short list of buttons beside a long slip)
   * is the usual one. "facts" is for a short slip beside a long list (Mi cuenta): the list scrolls with the page
   * and the slip stays, on a screen tall enough to hold it.
   */
  pin?: "actions" | "facts";
  className?: string;
}) {
  return (
    <main className={`@container/split w-full flex-1 ${className}`}>
      <div className={`mx-auto flex w-full max-w-[calc(28rem+2*var(--gutter))] flex-col pt-1 @min-[40rem]/split:max-w-[calc(56rem+2*var(--gutter))] ${SIDE} ${FOOT}`}>
        {nav}
        <div className="flex flex-col gap-4 @min-[40rem]/split:grid @min-[40rem]/split:grid-cols-[minmax(0,28rem)_minmax(0,24rem)] @min-[40rem]/split:items-start @min-[40rem]/split:justify-between @min-[40rem]/split:gap-x-[clamp(1.25rem,5cqi,4rem)]">
          <div className={`flex min-w-0 flex-col gap-4 ${pin === "facts" ? "@min-[40rem]/split:tall:sticky @min-[40rem]/split:tall:top-[calc(var(--band-h)+0.75rem)]" : ""}`}>{facts}</div>
          <div
            className={`flex min-w-0 flex-col gap-3 ${
              pin === "facts"
                ? ""
                : "@min-[40rem]/split:sticky @min-[40rem]/split:top-[calc(var(--band-h)+0.75rem)] @min-[40rem]/split:max-h-[calc(100dvh-var(--band-h)-1.5rem)] @min-[40rem]/split:overflow-y-auto @min-[40rem]/split:p-1"
            }`}
          >
            {actions}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * The row above a screen: where you came from on the left, one other place on the right. Blue words, full-size targets.
 * `size="lg"` is the driver's row (56 px). `onBack` lets a screen that keeps two views in one page (the driver's
 * route and its open stop) go back itself: call `event.preventDefault()` in it.
 */
export function TopNav({
  back,
  backLabel,
  onBack,
  size = "md",
  children,
}: {
  back?: string;
  backLabel?: ReactNode;
  onBack?: (event: MouseEvent<HTMLAnchorElement>) => void;
  size?: "md" | "lg";
  children?: ReactNode;
}) {
  const height = size === "lg" ? "min-h-14" : "min-h-12";
  return (
    <nav className={`flex items-center justify-between gap-3 ${height}`}>
      {back ? (
        <Link href={back} onClick={onBack} prefetch={onBack ? false : undefined} className={`-ml-1.5 inline-flex shrink-0 items-center gap-0.5 pr-2 text-[1.0625rem] font-bold text-brand ${height}`}>
          <ChevronBack />
          {backLabel}
        </Link>
      ) : (
        <span />
      )}
      {children}
    </nav>
  );
}

/** A blue text link for the top row ("Mi cuenta"). */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center pl-2 text-[1.0625rem] font-bold text-brand">
      {children}
    </Link>
  );
}

export type ShellItem = {
  href: string;
  label: string;
  current?: boolean;
  /** Only in the sidebar. A phone's bottom navigation has room for four places; the page links to the rest. */
  sidebarOnly?: boolean;
};

/**
 * Shell: the distributor's app. A sidebar from 64 rem (laptop, iPad sideways); below that a top bar and
 * a bottom navigation. The place you are in is a paper tab (a fact); the others are blue (actions).
 */
export function Shell({
  brand,
  name,
  nav,
  action,
  children,
}: {
  /** The logo, linked home. */
  brand: ReactNode;
  /** The business the dashboard belongs to. Pass "" while it loads: its line is kept, so the sidebar doesn't jump when the name arrives. */
  name?: ReactNode;
  nav: ShellItem[];
  /** The one main action of the app ("Nueva factura"): full size at the foot of the sidebar, compact in the top bar. */
  action?: (place: "side" | "bar") => ReactNode;
  children: ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-5 border-r border-counter-rule py-5 pl-[max(1.25rem,env(safe-area-inset-left))] lg:sticky lg:top-(--band-h) lg:flex lg:h-[calc(100dvh-var(--band-h))]">
        <div className="pr-5">{brand}</div>
        {name !== undefined && <p className="min-h-[1lh] pr-5 text-label font-semibold uppercase tracking-[0.1em] text-muted text-balance">{name}</p>}
        <nav aria-label={t("Secciones", "Sections")} className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={`flex min-h-12 items-center rounded-l-paper px-3 text-[1.0625rem] font-bold -outline-offset-3 ${
                item.current ? "bg-paper text-ink" : "text-brand hover:bg-brand/6"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {action && <div className="mt-auto pr-5">{action("side")}</div>}
      </aside>

      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-counter-rule py-2 pl-[max(var(--gutter),env(safe-area-inset-left))] pr-[max(var(--gutter),env(safe-area-inset-right))] lg:hidden">
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:shrink">
          {brand}
          {name && <p className="hidden min-w-0 truncate text-label font-semibold uppercase tracking-[0.1em] text-muted sm:block">{name}</p>}
        </div>
        {action && <div className="min-w-0 sm:shrink-0">{action("bar")}</div>}
      </header>

      <main className={`@container min-w-0 max-w-[88rem] flex-1 pt-4 ${SIDE} pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-8`}>{children}</main>

      <nav
        aria-label={t("Secciones", "Sections")}
        className="fixed inset-x-0 bottom-0 z-4 flex justify-between overflow-hidden border-t border-counter-rule bg-counter px-[max(0.25rem,env(safe-area-inset-left))] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {/* Four places must fit a phone at any text size: a label stops growing where the row is full, and is never under 14 px. */}
        {nav
          .filter((item) => !item.sidebarOnly)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={`flex min-h-14 min-w-0 flex-auto items-center justify-center px-1.5 text-center text-[min(var(--text-label),max(14px,4.4vw))] leading-tight font-bold -outline-offset-3 ${
                item.current ? "rounded-b-paper bg-paper text-ink" : "text-brand"
              }`}
            >
              {item.label}
            </Link>
          ))}
      </nav>
    </div>
  );
}
