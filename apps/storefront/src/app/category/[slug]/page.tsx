import { redirect } from 'next/navigation';
import { fetchWpStorefrontData } from '../../../lib/wpCommerce';
import { isKnownDepartment } from '../../../lib/categoryTaxonomy';

interface CategorySlugProps {
  params: Promise<{ slug: string }>;
}

export default async function CategorySlugRedirect({ params }: CategorySlugProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

  // Query live WooCommerce categories
  const data = await fetchWpStorefrontData();
  const directMatch = data.categories.find((c) => c.slug.toLowerCase() === cleanSlug);

  if (directMatch) {
    if (isKnownDepartment(directMatch.slug, data.categories)) {
      redirect(`/${directMatch.slug}`);
    }
    redirect(`/collections/${directMatch.slug}`);
  }

  // Check if this is an alias or was renamed (e.g. 'kids' -> 'kids-furniture')
  const aliasMatch = data.categories.find((c) => {
    const cSlug = c.slug.toLowerCase();
    const cName = c.name.toLowerCase();
    if (cleanSlug === 'kids' && (cSlug === 'kids-furniture' || cName.includes('kid'))) return true;
    if (cleanSlug === 'decor' && (cSlug === 'home-decor' || cName.includes('decor'))) return true;
    if (cleanSlug === 'mirrors' && (cSlug === 'wall-decor-and-mirrors' || cName.includes('mirror'))) return true;
    if (cleanSlug === 'storage' && (cSlug === 'storage-and-organization' || cName.includes('storage'))) return true;
    return cSlug.includes(cleanSlug) || cName === cleanSlug;
  });

  if (aliasMatch) {
    if (isKnownDepartment(aliasMatch.slug, data.categories)) {
      redirect(`/${aliasMatch.slug}`);
    }
    redirect(`/collections/${aliasMatch.slug}`);
  }

  if (isKnownDepartment(cleanSlug)) {
    redirect(`/${cleanSlug}`);
  }

  redirect(`/collections/${cleanSlug}`);
}
