import type { NextConfig } from "next";

const apiBase = (process.env.API_BASE_URL || "http://localhost:8080").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  // Prevent next dev from regenerating AGENTS.md / CLAUDE.md in the repo.
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/go/:slug",
        destination: `${apiBase}/go/:slug`,
      },
      {
        source: "/api/backend/:path*",
        destination: `${apiBase}/:path*`,
      },
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
    ],
  },
};

export default nextConfig;
