import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand } from "@/components/auth";
import { Slip } from "@/components/kit/layout";
import { Loading } from "@/components/kit/states";
import ClaimScreen from "./claim-screen";

export const metadata: Metadata = { title: "Crear la cuenta de su tienda · Relay" };

// The code is only known when the page is opened, so the screen waits inside
// Suspense (Next.js Cache Components), like the invoice page.
export default function Page() {
  return (
    <Suspense
      fallback={
        <Slip>
          <Brand />
          <Loading />
        </Slip>
      }
    >
      <ClaimScreen />
    </Suspense>
  );
}
