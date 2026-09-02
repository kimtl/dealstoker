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

export const metadata: Metadata = {
  ...buildMetadata({
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
  }),
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
};

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
