import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { fetchWpStorefrontData, decodeHtmlEntities } from '../../../lib/wpCommerce';
import { isKnownDepartment, resolveTaxonomyPath } from '../../../lib/categoryTaxonomy';
import CollectionsClient from '../../collections/CollectionsClient';

export const revalidate = 60;

interface DepartmentPageProps {
  params: Promise<{
    department: string;
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: DepartmentPageProps): Promise<Metadata> {
  const resolved = await params;
  const { department, slug } = resolved;

  const data = await fetchWpStorefrontData();
  const isKnown = isKnownDepartment(department, data.categories);

  if (!isKnown) {
    return {
      title: 'Page Not Found | Orbit Expo Crafts',
    };
  }

  const slugArray = [department, ...(slug || [])];
  const taxonomy = resolveTaxonomyPath(slugArray);

  const title = `${taxonomy.displayName} Collections | Orbit Expo Crafts B2B Wholesale & Custom Manufacturing`;
  const description = `Explore custom manufactured ${taxonomy.displayName} engineered for luxury hotels, resorts, commercial fit-outs, and architectural interior projects.`;
  const canonicalUrl = `https://orbitexpocrafts.com${taxonomy.canonicalUrl}`;

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

export default async function DepartmentCategoryPage({ params }: DepartmentPageProps) {
  const resolved = await params;
  const { department, slug } = resolved;

  const data = await fetchWpStorefrontData();
  const dLower = department.toLowerCase().trim();
  const matchedCategory = data.categories.find((c) => c.slug.toLowerCase() === dLower);

  // If department was renamed in WooCommerce (e.g. 'kids' -> 'kids-furniture'), seamlessly redirect
  if (!matchedCategory) {
    const renamedCat = data.categories.find((c) => {
      const cSlug = c.slug.toLowerCase();
      const cName = c.name.toLowerCase();
      if (dLower === 'kids' && (cSlug === 'kids-furniture' || cName.includes('kid'))) return true;
      if (dLower === 'decor' && (cSlug === 'home-decor' || cName.includes('decor'))) return true;
      if (dLower === 'mirrors' && (cSlug === 'wall-decor-and-mirrors' || cName.includes('mirror'))) return true;
      if (dLower === 'storage' && (cSlug === 'storage-and-organization' || cName.includes('storage'))) return true;
      return false;
    });

    if (renamedCat && renamedCat.slug.toLowerCase() !== dLower) {
      redirect(`/${renamedCat.slug}${slug && slug.length > 0 ? `/${slug.join('/')}` : ''}`);
    }
  }

  const isKnown = isKnownDepartment(department, data.categories) || !!matchedCategory;

  if (!isKnown) {
    notFound();
  }

  const slugArray = [department, ...(slug || [])];

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
