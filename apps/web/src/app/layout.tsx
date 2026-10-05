import type { Metadata } from "next";
import { Fraunces, Manrope, Noto_Sans_KR } from "next/font/google";
import { headers } from "next/headers";
import { GoogleTagHead, shouldRenderGoogleTag } from "@/components/GoogleTag";
import { getLocale } from "@/lib/i18n";
import { PATHNAME_HEADER } from "@/lib/i18n/locale";
import {
  buildPageMetadata,
  homeMetaDescription,
  homeMetaKeywords,
  homeMetaTitle,
} from "@/lib/seo";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildPageMetadata({
    title: homeMetaTitle(locale),
    description: homeMetaDescription(locale),
    path: "/",
    keywords: homeMetaKeywords(locale),
    locale,
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const pathname = (await headers()).get(PATHNAME_HEADER);
  const fontClass = [
    fraunces.variable,
    manrope.variable,
    notoSansKr.variable,
    locale === "ko" ? "locale-ko" : "locale-en",
  ].join(" ");

  return (
    <html lang={locale}>
      <head>{shouldRenderGoogleTag(pathname) ? <GoogleTagHead /> : null}</head>
      <body className={fontClass}>{children}</body>
    </html>
  );
}
