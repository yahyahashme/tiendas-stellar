import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kit/states";
import InvoiceScreen, { InvoiceFrame } from "./invoice-screen";

export const metadata: Metadata = { title: "Factura · Relay" };

// The id in the URL is only known when the page is opened, so the screen
// waits inside Suspense (Next.js Cache Components).
export default function Page() {
  return (
    <Suspense
      fallback={
        <InvoiceFrame>
          <Loading />
        </InvoiceFrame>
      }
    >
      <InvoiceScreen />
    </Suspense>
  );
}
