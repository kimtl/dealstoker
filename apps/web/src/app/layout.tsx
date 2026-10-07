import type { Metadata } from "next";
import { Fraunces, Manrope, Noto_Sans_KR } from "next/font/google";
import { headers } from "next/headers";
import { GoogleTagHead, shouldRenderGoogleTag } from "@/components/GoogleTag";
import { GoogleTagFallback } from "@/components/GoogleTagFallback";
import { getLocale } from "@/lib/i18n";
import { PATHNAME_HEADER } from "@/lib/i18n/locale";
import { GOOGLE_ADS_ID } from "@/lib/site";
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

  const googleTag = shouldRenderGoogleTag(pathname);

  return (
    <html lang={locale}>
      <head>{googleTag ? <GoogleTagHead /> : null}</head>
      <body className={fontClass}>
        {children}
        {googleTag ? <GoogleTagFallback id={GOOGLE_ADS_ID} /> : null}
      </body>
    </html>
  );
}
