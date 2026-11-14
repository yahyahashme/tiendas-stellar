import type { Metadata } from "next";
import ShopsScreen from "./shops-screen";

export const metadata: Metadata = { title: "Tiendas · Relay" };

// The distributor's shops. Everything on it is read in the browser, so the page itself is only the frame.
export default function Page() {
  return <ShopsScreen />;
}
