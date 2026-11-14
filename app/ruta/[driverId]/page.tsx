import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kit/states";
import RouteScreen, { RouteFrame } from "./route-screen";

export const metadata: Metadata = { title: "Mi ruta · Relay" };

// The id in the URL is only known when the page is opened, so the screen
// waits inside Suspense (Next.js Cache Components).
export default function Page() {
  return (
    <Suspense
      fallback={
        <RouteFrame>
          <Loading torn={false} lines={5} />
        </RouteFrame>
      }
    >
      <RouteScreen />
    </Suspense>
  );
}
