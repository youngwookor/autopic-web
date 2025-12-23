/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://43.200.229.169:8000/:path*',
      },
    ];
  },
};

module.exports = nextConfig;