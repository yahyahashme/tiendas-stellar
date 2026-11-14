import type { Metadata } from "next";
import type { ReactNode } from "react";

/** The component samples are for the team: nothing in the app links to them, and search engines are told not to list them. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SistemaLayout({ children }: { children: ReactNode }) {
  return children;
}
