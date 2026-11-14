import { Suspense } from "react";
import { Loading, Screen } from "@/components/ui";
import ProfileScreen from "./profile-screen";

export default function Page() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Loading />
        </Screen>
      }
    >
      <ProfileScreen />
    </Suspense>
  );
}
