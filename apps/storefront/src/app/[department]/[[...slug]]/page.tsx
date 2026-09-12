import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

  if (!isKnownDepartment(department)) {
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

  if (!isKnownDepartment(department)) {
    notFound();
  }

  const slugArray = [department, ...(slug || [])];
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
