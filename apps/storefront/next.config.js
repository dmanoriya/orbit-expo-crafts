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
  allowedDevOrigins: ['*'],
  async rewrites() {
    let wpBase = (process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || (process.env.NODE_ENV === 'development' ? 'http://woo-catalog-nextjs.local' : 'https://admin.orbitexpocrafts.com')).replace(/\/$/, '');
    return [
      {
        source: '/api/wp/:path*',
        destination: `${wpBase}/wp-json/hcc/v1/:path*`,
      },
      {
        source: '/wp-content/:path*',
        destination: `${wpBase}/wp-content/:path*`,
      },
      {
        source: '/wp-includes/:path*',
        destination: `${wpBase}/wp-includes/:path*`,
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
