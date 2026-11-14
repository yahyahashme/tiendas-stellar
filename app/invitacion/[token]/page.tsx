import { Suspense } from "react";
import { Loading, Screen } from "@/components/ui";
import InviteScreen from "./invite-screen";

// The token is only known when the page is opened, so the screen waits inside
// Suspense (Next.js Cache Components), like the invoice page.
export default function Page() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Loading />
        </Screen>
      }
    >
      <InviteScreen />
    </Suspense>
  );
}
