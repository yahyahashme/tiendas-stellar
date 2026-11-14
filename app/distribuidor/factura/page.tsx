import type { Metadata } from "next";
import { Suspense } from "react";
import NewInvoice, { NewInvoiceLoading } from "./new-invoice";

export const metadata: Metadata = { title: "Nueva factura · Relay" };

// "Repetir" opens this page with ?tienda=…&motorista=…, only known when it's
// opened, so the screen waits inside Suspense (Next.js Cache Components).
export default function Page() {
  return (
    <Suspense fallback={<NewInvoiceLoading />}>
      <NewInvoice />
    </Suspense>
  );
}
