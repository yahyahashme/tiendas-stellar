import type { Metadata } from "next";
import AdminScreen from "./admin-screen";

export const metadata: Metadata = { title: "Administración · Relay" };

// Relay's own page: the distributors waiting to be approved. Read in the browser, so the page is only the frame.
export default function Page() {
  return <AdminScreen />;
}
