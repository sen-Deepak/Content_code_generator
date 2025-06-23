/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig; 