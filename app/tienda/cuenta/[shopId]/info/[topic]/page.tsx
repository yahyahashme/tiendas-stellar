import { Suspense } from "react";
import { Loading, Screen } from "@/components/ui";
import HelpScreen from "./help-screen";

export default function Page() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Loading />
        </Screen>
      }
    >
      <HelpScreen />
    </Suspense>
  );
}
