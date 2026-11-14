import type { Metadata } from "next";
import DriversScreen from "./drivers-screen";

export const metadata: Metadata = { title: "Motoristas · Relay" };

// The distributor's drivers. Everything on it is read in the browser, so the page itself is only the frame.
export default function Page() {
  return <DriversScreen />;
}
