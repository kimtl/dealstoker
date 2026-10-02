import type { NextConfig } from "next";

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
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-eu.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
