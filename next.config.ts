import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "shanfaglobal.com",
      },
      {
        protocol: "http",
        hostname: "shanfaglobal.com",
      },
    ],
  },
};

export default nextConfig;
