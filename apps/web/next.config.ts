import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
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
