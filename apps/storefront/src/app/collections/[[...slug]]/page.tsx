import Metadata from 'next';
import { fetchWpStorefrontData, decodeHtmlEntities, getCategorySeoPath, fetchWpSeo, rankMathToMetadata } from '../../../lib/wpCommerce';
import CollectionsClient from '../CollectionsClient';

export const revalidate = 60;

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

  const rootSeo = !activeCategory ? await fetchWpSeo({ slug: 'collections' }) : null;
  const seo = activeCategory?.seo || rootSeo;

  const defaultTitle = activeCategory
    ? `${decodeHtmlEntities(activeCategory.name)} Collections | B2B Wholesale & Custom Manufacturing`
    : 'Contract Furniture & Architectural Collections | Orbit Expo Crafts';

  const defaultDesc = activeCategory
    ? activeCategory.description || `Explore custom manufactured ${decodeHtmlEntities(activeCategory.name)} for hotels, resorts, commercial projects, and retail.`
    : 'Browse our complete catalog of handcrafted contract furniture, architectural joinery, lighting, and artisanal décor engineered for commercial projects.';

  const seoPath = getCategorySeoPath(activeCategory, data.categories);
  const canonicalUrl = seo?.canonical || `https://orbitexpocrafts.com${seoPath}`;
  const ogImage = seo?.openGraph?.image || activeCategory?.image || '/Explore_collection.webp';

  return rankMathToMetadata(seo, {
    title: defaultTitle,
    description: defaultDesc,
    canonical: canonicalUrl,
    image: ogImage,
  });
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
