import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { buildMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = buildMetadata({
  title: `${SITE_NAME} — Curated Amazon Deals for US Shoppers`,
  description:
    "DealStoker curates practical Amazon.com products across home, electronics, and outdoor gear — clear picks for US shoppers.",
  path: "/",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable}`}>
        {children}
      </body>
    </html>
  );
}
