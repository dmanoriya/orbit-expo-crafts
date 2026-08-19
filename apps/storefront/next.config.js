/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@company/commerce-sdk',
    '@company/commerce-core',
    '@company/commerce-rest',
    '@company/commerce-graphql',
    '@company/commerce-seo',
  ],
  async rewrites() {
    const wpBase = (process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://woo-catalog-nextjs.local').replace(/\/$/, '');
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
