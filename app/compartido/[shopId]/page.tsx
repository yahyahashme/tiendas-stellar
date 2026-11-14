import { Suspense } from "react";
import { Loading, Screen } from "@/components/ui";
import SharedScreen from "./shared-screen";

export default function Page() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Loading />
        </Screen>
      }
    >
      <SharedScreen />
    </Suspense>
  );
}
