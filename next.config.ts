import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // KiotViet CDNs (allow any subdomain)
      {
        protocol: "https",
        hostname: "**.kiotviet.vn",
      },
      // gaolamthuy CDN(s)
      {
        protocol: "https",
        hostname: "**.gaolamthuy.vn",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
