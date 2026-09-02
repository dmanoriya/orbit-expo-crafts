import Metadata from 'next';
import { fetchWpStorefrontData, decodeHtmlEntities, getCategorySeoPath } from '../../../lib/wpCommerce';
import CollectionsClient from '../CollectionsClient';

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
    ? data.categories.find((c) => c.slug.toLowerCase() === activeSlug.toLowerCase() || c.id.toLowerCase() === activeSlug.toLowerCase())
    : null;

  const title = activeCategory
    ? `${decodeHtmlEntities(activeCategory.name)} Collections | B2B Wholesale & Custom Manufacturing`
    : 'Collections | Global Furniture, Home Decor & Lifestyle B2B Catalog';

  const description = activeCategory
    ? activeCategory.description || `Explore custom manufactured ${decodeHtmlEntities(activeCategory.name)} for hotels, resorts, commercial projects, and retail.`
    : 'Browse our complete catalog of handcrafted furniture, home decor, lighting, rugs, and architectural hardware.';

  const seoPath = getCategorySeoPath(activeCategory, data.categories);
  const canonicalUrl = `https://orbitexpocrafts.com${seoPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
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
