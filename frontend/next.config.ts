import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const DJANGO = process.env.API_INTERNAL_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Браузер ходит на тот же origin, Next проксирует в Django — httpOnly-cookie работают без CORS.
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_MOCKS === "1") return [];
    return [
      { source: "/api/v1/:path*", destination: `${DJANGO}/api/v1/:path*` },
      { source: "/media/:path*", destination: `${DJANGO}/media/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cts.gg" },
      { protocol: "http", hostname: "localhost", port: "8000" },
    ],
  },
};

export default withNextIntl(nextConfig);
