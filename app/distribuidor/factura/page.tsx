import { Suspense } from "react";
import { Loading, Screen } from "@/components/ui";
import NewInvoice from "./new-invoice";

// "Repetir" opens this page with ?tienda=…&motorista=…, only known when it's
// opened, so the screen waits inside Suspense (Next.js Cache Components).
export default function Page() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Loading />
        </Screen>
      }
    >
      <NewInvoice />
    </Suspense>
  );
}
