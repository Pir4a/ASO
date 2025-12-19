import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `experimental.ppr` was merged into `cacheComponents` in newer Next versions.
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
