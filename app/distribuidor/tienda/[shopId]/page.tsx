import type { Metadata } from "next";
import { Suspense } from "react";
import { Slip } from "@/components/kit/layout";
import { Loading } from "@/components/kit/states";
import HistoryScreen from "./history-screen";

export const metadata: Metadata = { title: "Historial de la tienda · Relay" };

// The id in the URL is only known when the page is opened, so the screen
// waits inside Suspense (Next.js Cache Components).
export default function Page() {
  return (
    <Suspense
      fallback={
        <Slip>
          <Loading />
        </Slip>
      }
    >
      <HistoryScreen />
    </Suspense>
  );
}
