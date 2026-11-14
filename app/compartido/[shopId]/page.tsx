import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kit/states";
import SharedScreen, { SharedFrame } from "./shared-screen";

export const metadata: Metadata = { title: "Historial compartido · Relay" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <SharedFrame>
          <Loading lines={6} />
        </SharedFrame>
      }
    >
      <SharedScreen />
    </Suspense>
  );
}
