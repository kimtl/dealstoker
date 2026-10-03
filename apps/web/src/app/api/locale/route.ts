import { NextRequest, NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/locale";

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const localeRaw = String(form?.get("locale") || "");
  const redirectTo = String(form?.get("redirect") || "/");
  const locale = isLocale(localeRaw) ? localeRaw : "en";

  let safeRedirect = "/";
  try {
    if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      safeRedirect = redirectTo;
    }
  } catch {
    safeRedirect = "/";
  }

  const response = NextResponse.redirect(new URL(safeRedirect, request.url), 303);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
