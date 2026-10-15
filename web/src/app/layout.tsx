import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Providers } from "@/components/common/Providers";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geist = localFont({ src: "./fonts/Geist-Variable.woff2", variable: "--font-geist", weight: "100 900", display: "swap" });
const geistMono = localFont({ src: "./fonts/GeistMono-Variable.woff2", variable: "--font-geist-mono", weight: "100 900", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://agroyachay.ginit.dev"),
  title: { default: "AgroYachay", template: "%s · AgroYachay" },
  description:
    "An open-source IoT and large-language-model platform supporting agronomic and economic decision-making for Andean smallholders.",
  applicationName: "AgroYachay",
  openGraph: {
    title: "AgroYachay",
    description:
      "An open-source IoT and large-language-model platform supporting agronomic and economic decision-making for Andean smallholders.",
    url: "https://agroyachay.ginit.dev",
    siteName: "AgroYachay",
    images: ["/images/hero.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
