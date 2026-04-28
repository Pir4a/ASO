import type { NextConfig } from "next";

// When the API is local (host or Docker dev), the Next.js optimizer can't
// reach `localhost:3001` from inside its own container, and Next 16 also
// refuses private IPs. Bypass the optimizer in that case — the browser
// fetches the media directly (CORP on /api/media/* allows it).
const isLocalApi = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").includes("localhost");

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: isLocalApi,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // GridFS media served by the API (#14). Browser-facing URL is
      // `${NEXT_PUBLIC_API_URL}/media/<id>`, defaulting to localhost in dev.
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/api/media/**",
      },
    ],
  },
};

export default nextConfig;
