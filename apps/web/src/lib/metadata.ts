import type { Metadata } from "next";
import { buildPageMetadata } from "./seo";
import type { Locale } from "./i18n/locale";

type BuildMetaInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  keywords?: string[];
  locale?: Locale;
};

/** @deprecated Prefer buildPageMetadata from @/lib/seo for new pages. */
export function buildMetadata(input: BuildMetaInput): Metadata {
  return buildPageMetadata(input);
}
