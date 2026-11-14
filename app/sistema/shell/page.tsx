"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/kit/button";
import { Shell } from "@/components/kit/layout";
import { Logo } from "@/components/logo";
import { useT } from "@/lib/i18n";
import { ROWS, SampleCash, SampleFigures, SampleFilters, SampleLedger } from "../samples";

// The Shell layout with sample content: the distributor's sidebar (or top bar and bottom navigation) around a ledger.
export default function ShellSample() {
  const { t } = useT();
  const rows = [...ROWS, ...ROWS.map((row) => ({ ...row, id: row.id - 6 }))];
  return (
    <Shell
      brand={
        <Link href="/sistema" aria-label="Relay" className="inline-flex min-h-11 items-center">
          <Logo className="h-7 w-auto" />
        </Link>
      }
      name="Distribuidora El Sol"
      nav={[
        { href: "/sistema/shell", label: "Panel", current: true },
        { href: "/sistema/shell#facturas", label: t("Facturas", "Invoices") },
        { href: "/sistema/shell#motoristas", label: t("Motoristas", "Drivers") },
        { href: "/sistema/shell#tiendas", label: t("Tiendas", "Shops") },
        { href: "/sistema/shell#pasos", label: t("Primeros pasos", "First steps"), sidebarOnly: true },
      ]}
      action={(place) => (
        <ButtonLink href="/sistema/shell" size={place === "bar" ? "sm" : "md"}>
          {t("Nueva factura", "New invoice")}
        </ButtonLink>
      )}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-title font-bold">Panel</h1>
        <SampleFigures />
        <SampleFilters />
        <SampleLedger rows={rows} />
        <SampleCash />
      </div>
    </Shell>
  );
}
