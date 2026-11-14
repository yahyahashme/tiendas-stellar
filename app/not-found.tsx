import type { Metadata } from "next";
import NotFoundScreen from "./not-found-screen";

export const metadata: Metadata = { title: "Página no encontrada · Relay" };

// Any address the app doesn't have.
export default function NotFound() {
  return <NotFoundScreen />;
}
