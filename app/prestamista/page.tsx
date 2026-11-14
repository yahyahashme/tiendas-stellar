import type { Metadata } from "next";
import LenderScreen from "./lender-screen";

export const metadata: Metadata = { title: "Prestamistas · Relay" };

// The lenders' page: the credit pool and the demo lender's place in it. Read in the browser, so the page is only the frame.
export default function Page() {
  return <LenderScreen />;
}
