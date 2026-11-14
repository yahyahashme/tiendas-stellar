import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/kit/states";
import { AccountPage } from "../../account-page";
import HelpScreen from "./help-screen";

export const metadata: Metadata = { title: "Ayuda · Relay" };

export default function Page() {
  return (
    <Suspense
      fallback={
        <AccountPage>
          <Loading />
        </AccountPage>
      }
    >
      <HelpScreen />
    </Suspense>
  );
}
