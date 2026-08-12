import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    ".z.ai",
    "localhost",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kdvk6qpeh2rybiyp.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
};

export default nextConfig;
