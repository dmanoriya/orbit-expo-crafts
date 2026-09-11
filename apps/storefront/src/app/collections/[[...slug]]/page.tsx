import Metadata from 'next';
import { fetchWpStorefrontData, decodeHtmlEntities, getCategorySeoPath } from '../../../lib/wpCommerce';
import CollectionsClient from '../CollectionsClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface CollectionsPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: CollectionsPageProps) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const activeSlug = slugArray.length > 0 ? slugArray[slugArray.length - 1] : undefined;

  const data = await fetchWpStorefrontData();
  const activeCategory = activeSlug
    ? data.categories.find((c) => {
        const clean = decodeURIComponent(activeSlug).toLowerCase().trim();
        return c.slug.toLowerCase() === clean || c.id.toLowerCase() === clean || String(c.wpId) === clean;
      }) ||
      (slugArray.slice().reverse().reduce<any>((found, s) => {
        if (found) return found;
        const clean = decodeURIComponent(s).toLowerCase().trim();
        return data.categories.find((c) => c.slug.toLowerCase() === clean || c.id.toLowerCase() === clean || String(c.wpId) === clean) || null;
      }, null))
    : null;

  const seo = activeCategory?.seo;
  const title = seo?.title || (activeCategory
    ? `${decodeHtmlEntities(activeCategory.name)} Collections | B2B Wholesale & Custom Manufacturing`
    : 'Collections | Global Furniture, Home Decor & Lifestyle B2B Catalog');

  const description = seo?.description || (activeCategory
    ? activeCategory.description || `Explore custom manufactured ${decodeHtmlEntities(activeCategory.name)} for hotels, resorts, commercial projects, and retail.`
    : 'Browse our complete catalog of handcrafted furniture, home decor, lighting, rugs, and architectural hardware.');

  const seoPath = getCategorySeoPath(activeCategory, data.categories);
  const canonicalUrl = seo?.canonical || `https://orbitexpocrafts.com${seoPath}`;
  const ogImage = seo?.openGraph?.image || activeCategory?.image || '/Explore_collection.webp';

  const isNoIndex = seo?.robots ? seo.robots.toLowerCase().includes('noindex') : false;
  const isNoFollow = seo?.robots ? seo.robots.toLowerCase().includes('nofollow') : false;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !isNoIndex,
      follow: !isNoFollow,
      googleBot: {
        index: !isNoIndex,
        follow: !isNoFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    keywords: seo?.keywords ? seo.keywords.split(',').map((k: string) => k.trim()) : undefined,
    openGraph: {
      title: seo?.openGraph?.title || title,
      description: seo?.openGraph?.description || description,
      url: canonicalUrl,
      siteName: 'Orbit Expo Crafts',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: activeCategory?.name || 'Collections',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: (seo?.twitter?.card as any) || 'summary_large_image',
      title: seo?.twitter?.title || title,
      description: seo?.twitter?.description || description,
      images: [seo?.twitter?.image || ogImage],
    },
  };
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];

  const data = await fetchWpStorefrontData();

  return (
    <CollectionsClient
      slugArray={slugArray}
      initialProducts={data.products}
      initialCategories={data.categories}
      initialSegments={data.segments}
      initialMaterials={data.materials}
      initialColors={data.colors}
      isWpConnected={data.isWpConnected}
    />
  );
}
