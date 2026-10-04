import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_HOSTS } from "./src/lib/images";

const nextConfig: NextConfig = {
  // Prevent next dev from regenerating AGENTS.md / CLAUDE.md in the repo.
  agentRules: false,
  // Smaller production image for Railway / Docker.
  output: "standalone",
  // /api/backend/* and /go/* are handled by App Router route handlers so
  // API_BASE_URL is read at runtime (rewrites bake destinations at build time).
  async rewrites() {
    return [
      // Serve pure application/xml — avoid Next MetadataRoute HTML edge cases
      // that trigger Google "Sitemap appears to be an HTML page".
      { source: "/sitemap.xml", destination: "/api/sitemap" },
      // Same for robots.txt — always plain text for Search Console / Naver.
      { source: "/robots.txt", destination: "/api/robots" },
    ];
  },
  images: {
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
