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
    let wpBase = (process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || 'https://admin.orbitexpocrafts.com').replace(/\/$/, '');
    if (process.env.NODE_ENV === 'production' || wpBase.includes('.local') || wpBase.includes('localhost')) {
      wpBase = 'https://admin.orbitexpocrafts.com';
    }
    return [
      {
        source: '/api/wp/:path*',
        destination: `${wpBase}/wp-json/hcc/v1/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
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
