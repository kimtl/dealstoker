import type { Metadata } from "next";
import { buildPageMetadata } from "./seo";

type BuildMetaInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  keywords?: string[];
};

/** @deprecated Prefer buildPageMetadata from @/lib/seo for new pages. */
export function buildMetadata(input: BuildMetaInput): Metadata {
  return buildPageMetadata(input);
}
