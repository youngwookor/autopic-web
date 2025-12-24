import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://43.200.229.169:8000/:path*',
      },
    ];
  },
};

export default nextConfig;