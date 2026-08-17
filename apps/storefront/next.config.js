/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@company/commerce-sdk',
    '@company/commerce-core',
    '@company/commerce-rest',
    '@company/commerce-graphql',
    '@company/commerce-seo',
  ],
  async rewrites() {
    return [
      {
        source: '/api/wp/:path*',
        destination: 'http://woo-catalog-nextjs.local/wp-json/hcc/v1/:path*',
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
