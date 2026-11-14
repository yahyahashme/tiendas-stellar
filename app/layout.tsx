import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { TestnetBand } from "@/components/kit/band";
import { APP_NAME, TAGLINE } from "@/lib/brand";
import "./globals.css";

// Both fonts are downloaded at build time and served from our own domain (Latin subset only).
// Atkinson Hyperlegible Next: every heading and all interface text. One variable file covers 400, 600 and 700.
const sans = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin"], weight: "variable", display: "swap", adjustFontFallback: false });
// IBM Plex Mono: every amount, invoice number, receipt line and ledger column. Never body text.
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: `${APP_NAME} · ${TAGLINE}`,
  description: "Las tiendas pagan a su distribuidor con dólares digitales, en efectivo o en 7 días sin intereses.",
};

// viewportFit "cover" lets the screens use the safe areas (notch, home bar) themselves.
export const viewport: Viewport = { themeColor: "#fffdf8", viewportFit: "cover" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <TestnetBand />
        {children}
      </body>
    </html>
  );
}
