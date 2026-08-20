const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  transpilePackages: [
    '@company/commerce-sdk',
    '@company/commerce-core',
    '@company/commerce-rest',
    '@company/commerce-graphql',
    '@company/commerce-seo',
  ],
  async rewrites() {
    const wpBase = (process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://admin.orbitexpocrafts.com').replace(/\/$/, '');
    return [
      {
        source: '/api/wp/:path*',
        destination: `${wpBase}/wp-json/hcc/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
