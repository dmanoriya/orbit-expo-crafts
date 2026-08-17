import { SEOData, Product } from '@company/commerce-core';

export function buildNextMetadata(seo: SEOData) {
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonical,
    },
    robots: {
      index: !seo.robots?.includes('noindex'),
      follow: !seo.robots?.includes('nofollow'),
    },
    openGraph: {
      title: seo.openGraph?.title || seo.title,
      description: seo.openGraph?.description || seo.description,
      images: seo.openGraph?.image ? [{ url: seo.openGraph.image }] : [],
    },
  };
}

export function buildProductJsonLd(product: Product, storeName: string, currency = 'USD') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image, ...product.gallery],
    description: product.shortDescription,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: product.slug,
      priceCurrency: currency,
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: storeName,
      },
    },
    ...(product.averageRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.ratingCount || 1,
      },
    }),
  };
}
