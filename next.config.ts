import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB body limit, well under a typical
      // phone camera photo — raise it to match the app's own image cap.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
