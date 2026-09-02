import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { buildMetadata } from "@/lib/metadata";
import { homeMetaDescription, homeMetaTitle } from "@/lib/seo";
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
  title: homeMetaTitle(),
  description: homeMetaDescription(),
  path: "/",
  keywords: [
    "Amazon deals",
    "best Amazon deals today",
    "Amazon price drops",
    "US Amazon discounts",
    SITE_NAME,
  ],
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
