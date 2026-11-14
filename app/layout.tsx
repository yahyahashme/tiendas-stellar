import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { DemoBanner } from "@/components/ui";
import { APP_NAME, TAGLINE } from "@/lib/brand";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} · ${TAGLINE}`,
  description: "Las tiendas pagan a su distribuidor con dólares digitales, en efectivo o en 7 días sin intereses.",
};

export const viewport: Viewport = { themeColor: "#0b4ea2" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
