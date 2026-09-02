import { MetadataRoute } from 'next';
import { fetchWpStorefrontData, getCategorySeoPath } from '../lib/wpCommerce';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://orbitexpocrafts.com';

  // Base pages
  const routes = ['', '/collections', '/turnkey', '/craft', '/journals', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const sfData = await fetchWpStorefrontData();

  // Category pages SEO URLs
  const categoryRoutes = sfData.categories.map((c) => ({
    url: `${baseUrl}${getCategorySeoPath(c, sfData.categories)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: c.level === 0 ? 0.9 : 0.7,
  }));

  // Product pages SEO URLs
  const productRoutes = sfData.products.map((p) => ({
    url: `${baseUrl}/product/${(p as any).slug || p.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...routes, ...categoryRoutes, ...productRoutes];
}
