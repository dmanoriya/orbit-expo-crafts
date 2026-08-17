import { MetadataRoute } from 'next';
import { CATEGORIES, MOCK_PRODUCTS } from '../data/catalogData';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'http://127.0.0.1:3001';

  // Base pages
  const routes = ['', '/catalogue', '/turnkey', '/craft', '/about', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Category pages SEO URLs
  const categoryRoutes = CATEGORIES.map((c) => ({
    url: `${baseUrl}/catalogue/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Product pages SEO URLs
  const productRoutes = MOCK_PRODUCTS.map((p) => ({
    url: `${baseUrl}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...routes, ...categoryRoutes, ...productRoutes];
}
