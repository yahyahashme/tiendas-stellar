"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/kit/button";
import { Shell, type ShellItem } from "@/components/kit/layout";
import { Logo } from "@/components/logo";
import { useT } from "@/lib/i18n";
import { sectionInView } from "@/lib/sections";

/**
 * The distributor's app: the sidebar (or top bar and bottom navigation) around every distributor screen.
 * In the demo the drivers and shops live on the dashboard itself, so those two places scroll to them;
 * a signed-in distributor has a page for each.
 */
export function DistributorShell({
  current,
  name,
  demo = true,
  firstSteps = false,
  action,
  children,
}: {
  /** "factura" is Nueva factura: no section of the navigation, so none is marked. */
  current: "panel" | "motoristas" | "tiendas" | "factura";
  /** The business the dashboard belongs to (not known yet while the screen loads). */
  name?: string;
  /** False once we know a signed-in, approved distributor is looking. */
  demo?: boolean;
  /** "Primeros pasos" is listed while a new distributor still has steps to do. */
  firstSteps?: boolean;
  /** The one main action ("Nueva factura"), drawn full size in the sidebar and compact in the top bar. */
  action?: (place: "side" | "bar") => ReactNode;
  children: ReactNode;
}) {
  const { t } = useT();
  // On the dashboard, Facturas (and in the demo Motoristas and Tiendas) are parts of the same page: the tab for the
  // part in view is the marked one, whether it was tapped or scrolled to.
  const section = useSectionInView(current === "panel" ? (demo ? ["facturas", "motoristas", "tiendas"] : ["facturas"]) : []);
  const at = (id: string | null) => current === "panel" && section.id === id;
  const nav: ShellItem[] = [
    {
      href: "/distribuidor",
      label: t("Panel", "Dashboard"),
      current: at(null),
      // The link alone does not move a page that is already open, so the mark and the screen go to the top together.
      onClick: () => {
        section.choose(null);
        if (current === "panel") window.scrollTo({ top: 0 });
      },
    },
    { href: "/distribuidor#facturas", label: t("Facturas", "Invoices"), current: at("facturas"), onClick: () => section.choose("facturas") },
    demo
      ? { href: "/distribuidor#motoristas", label: t("Motoristas", "Drivers"), current: at("motoristas"), onClick: () => section.choose("motoristas") }
      : { href: "/distribuidor/motoristas", label: t("Motoristas", "Drivers"), current: current === "motoristas" },
    demo
      ? { href: "/distribuidor#tiendas", label: t("Tiendas", "Shops"), current: at("tiendas"), onClick: () => section.choose("tiendas") }
      : { href: "/distribuidor/tiendas", label: t("Tiendas", "Shops"), current: current === "tiendas" },
    ...(firstSteps ? [{ href: "/distribuidor#pasos", label: t("Primeros pasos", "First steps"), sidebarOnly: true }] : []),
  ];
  return (
    <Shell
      brand={
        <Link href="/" aria-label={t("Relay, inicio", "Relay, home")} className="inline-flex min-h-11 items-center">
          <Logo className="h-7 w-auto" />
        </Link>
      }
      name={name ?? ""}
      nav={nav}
      action={action}
    >
      {children}
    </Shell>
  );
}

/**
 * Which of a page's sections is in view: the lowest one whose top has passed the upper third of the screen, or null
 * above the first (`sectionInView`). A tap on a tab decides at once (`choose`), and scrolling takes over again a moment later, so the
 * short last section of a page can still be marked.
 */
function useSectionInView(ids: string[]) {
  const [id, setId] = useState<string | null>(null);
  const chosenAt = useRef(0);
  const key = ids.join(",");
  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (list.length === 0) return;
    const read = () => {
      if (Date.now() - chosenAt.current < 1200) return;
      // At the top of the page it is the page itself, even on a tall screen where the first section starts high up.
      if (window.scrollY < 8) return setId(null);
      const tops = list.flatMap((name) => {
        const el = document.getElementById(name);
        return el ? [{ id: name, top: el.getBoundingClientRect().top }] : [];
      });
      setId(sectionInView(tops, window.innerHeight / 3));
    };
    const start = window.location.hash.slice(1);
    if (list.includes(start)) {
      chosenAt.current = Date.now();
      setId(start);
    } else {
      // A page restored part of the way down has no scroll event to tell us where it is.
      read();
    }
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [key]);
  return {
    id,
    choose: (next: string | null) => {
      chosenAt.current = Date.now();
      setId(next);
    },
  };
}

/** "Nueva factura" for the shell's action slot, on the pages of a signed-in distributor. */
export function NewInvoiceAction({ place }: { place: "side" | "bar" }) {
  const { t } = useT();
  return (
    <ButtonLink size={place === "bar" ? "sm" : "md"} href="/distribuidor/factura">
      {t("Nueva factura", "New invoice")}
    </ButtonLink>
  );
}

/** On Nueva factura itself the action's place holds where you are: a paper tab in the sidebar, nothing in the top bar. */
export function NewInvoiceHere({ place }: { place: "side" | "bar" }) {
  const { t } = useT();
  if (place === "bar") return null;
  return (
    <p aria-current="page" className="flex min-h-13 items-center justify-center rounded-paper bg-paper px-5 text-[1.125rem] font-bold">
      {t("Nueva factura", "New invoice")}
    </p>
  );
}
