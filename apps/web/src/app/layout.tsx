import type { Metadata } from "next";
import { Fraunces, Manrope, Noto_Sans_KR } from "next/font/google";
import { buildMetadata } from "@/lib/metadata";
import { getLocale } from "@/lib/i18n";
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

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-kr",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const fontClass = [
    fraunces.variable,
    manrope.variable,
    notoSansKr.variable,
    locale === "ko" ? "locale-ko" : "locale-en",
  ].join(" ");

  return (
    <html lang={locale}>
      <body className={fontClass}>{children}</body>
    </html>
  );
}
