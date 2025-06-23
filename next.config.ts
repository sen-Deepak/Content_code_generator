import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.creativefuel.io',
        pathname: '/assets/imgs/logo/**',
      },
    ],
  },
};

export default nextConfig;
