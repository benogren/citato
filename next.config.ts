import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'workoscdn.com',
        port: '',
        pathname: '/images/**',
        search: '',
      },
    ],
  },
}

export default nextConfig;
