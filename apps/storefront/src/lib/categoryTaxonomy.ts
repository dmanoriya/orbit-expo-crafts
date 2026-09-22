import megaTaxonomyData from '../data/mega_menu_taxonomy.json';

export interface TaxonomyCrumb {
  name: string;
  url: string;
}

export interface TaxonomyNode {
  level: 0 | 1 | 2 | 3;
  name: string;
  slug: string;
  pathSlug: string;
  url: string;
  department: string;
  l1Name?: string;
  l2Name?: string;
  l3Name?: string;
  breadcrumbs: TaxonomyCrumb[];
  childTerms: string[];
}

export function slugifyCategory(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export const KNOWN_DEPARTMENTS: Record<string, string> = {
  'furniture': 'Furniture',
  'lighting': 'Lighting',
  'decor': 'Décor',
  'home-decor': 'Décor',
  'mirrors': 'Mirrors',
  'wall-decor-and-mirrors': 'Mirrors',
  'storage': 'Storage',
  'storage-and-organization': 'Storage',
  'outdoor-and-garden': 'Outdoor & Garden',
  'kitchen-and-table-tops': 'Kitchen & Table Tops',
  'kitchen-and-tabletop': 'Kitchen & Table Tops',
  'kids': 'Kids',
  'kids-furniture': 'Kids',
  'kids-and-baby-home': 'Kids',
  'kids-and-pet-home': 'Kids',
};

export function isKnownDepartment(slug: string, dynamicCategories?: Array<{ slug?: string; name?: string }>): boolean {
  if (!slug) return false;
  const lower = slug.toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(KNOWN_DEPARTMENTS, lower)) {
    return true;
  }
  if (Array.isArray(dynamicCategories)) {
    return dynamicCategories.some((c) => c.slug?.toLowerCase().trim() === lower);
  }
  return false;
}

// Pre-build indexed taxonomy map
const pathMap = new Map<string, TaxonomyNode>();
const leafSlugMap = new Map<string, TaxonomyNode>();

function initializeTaxonomy() {
  const tax = megaTaxonomyData as Record<string, Record<string, Record<string, string[]>>>;

  for (const deptName of Object.keys(tax)) {
    const deptSlug = slugifyCategory(deptName);
    const deptUrl = `/${deptSlug}`;
    const deptNode: TaxonomyNode = {
      level: 0,
      name: deptName,
      slug: deptSlug,
      pathSlug: deptSlug,
      url: deptUrl,
      department: deptName,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: deptName, url: deptUrl },
      ],
      childTerms: [deptSlug, deptName.toLowerCase()],
    };
    pathMap.set(deptSlug, deptNode);
    leafSlugMap.set(deptSlug, deptNode);

    const l1Map = tax[deptName] || {};
    for (const l1Name of Object.keys(l1Map)) {
      const l1Slug = slugifyCategory(l1Name);
      const l1Path = `${deptSlug}/${l1Slug}`;
      const l1Url = `/${l1Path}`;
      const l1Node: TaxonomyNode = {
        level: 1,
        name: l1Name,
        slug: l1Slug,
        pathSlug: l1Path,
        url: l1Url,
        department: deptName,
        l1Name,
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: deptName, url: deptUrl },
          { name: l1Name, url: l1Url },
        ],
        childTerms: [l1Slug, l1Name.toLowerCase()],
      };
      pathMap.set(l1Path, l1Node);
      if (!leafSlugMap.has(l1Slug)) leafSlugMap.set(l1Slug, l1Node);
      deptNode.childTerms.push(l1Slug, l1Name.toLowerCase());

      const l2Map = l1Map[l1Name] || {};
      for (const l2Name of Object.keys(l2Map)) {
        const l2Slug = slugifyCategory(l2Name);
        const l2Path = `${deptSlug}/${l1Slug}/${l2Slug}`;
        const l2Url = `/${l2Path}`;
        const l2Node: TaxonomyNode = {
          level: 2,
          name: l2Name,
          slug: l2Slug,
          pathSlug: l2Path,
          url: l2Url,
          department: deptName,
          l1Name,
          l2Name,
          breadcrumbs: [
            { name: 'Home', url: '/' },
            { name: deptName, url: deptUrl },
            { name: l1Name, url: l1Url },
            { name: l2Name, url: l2Url },
          ],
          childTerms: [l2Slug, l2Name.toLowerCase()],
        };
        pathMap.set(l2Path, l2Node);
        if (!leafSlugMap.has(l2Slug)) leafSlugMap.set(l2Slug, l2Node);
        deptNode.childTerms.push(l2Slug, l2Name.toLowerCase());
        l1Node.childTerms.push(l2Slug, l2Name.toLowerCase());

        const l3List = l2Map[l2Name] || [];
        for (const l3Name of l3List) {
          const l3Slug = slugifyCategory(l3Name);
          const l3Path = `${deptSlug}/${l1Slug}/${l2Slug}/${l3Slug}`;
          const l3Url = `/${l3Path}`;
          const l3Node: TaxonomyNode = {
            level: 3,
            name: l3Name,
            slug: l3Slug,
            pathSlug: l3Path,
            url: l3Url,
            department: deptName,
            l1Name,
            l2Name,
            l3Name,
            breadcrumbs: [
              { name: 'Home', url: '/' },
              { name: deptName, url: deptUrl },
              { name: l1Name, url: l1Url },
              { name: l2Name, url: l2Url },
              { name: l3Name, url: l3Url },
            ],
            childTerms: [l3Slug, l3Name.toLowerCase()],
          };
          pathMap.set(l3Path, l3Node);
          leafSlugMap.set(l3Slug, l3Node);
          deptNode.childTerms.push(l3Slug, l3Name.toLowerCase());
          l1Node.childTerms.push(l3Slug, l3Name.toLowerCase());
          l2Node.childTerms.push(l3Slug, l3Name.toLowerCase());
        }
      }
    }
  }

  // Handle combined "kids-and-pet-home" virtual department
  const kidsDept = pathMap.get('kids-and-baby-home');
  const petDept = pathMap.get('pet-home');
  const combinedSlug = 'kids-and-pet-home';
  const combinedUrl = `/${combinedSlug}`;
  pathMap.set(combinedSlug, {
    level: 0,
    name: 'Kids & Pet Home',
    slug: combinedSlug,
    pathSlug: combinedSlug,
    url: combinedUrl,
    department: 'Kids & Pet Home',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Kids & Pet Home', url: combinedUrl },
    ],
    childTerms: [
      combinedSlug,
      'kids & pet home',
      ...(kidsDept?.childTerms || []),
      ...(petDept?.childTerms || []),
    ],
  });

  // Handle "kids-furniture" alias for Kids department
  const kidsBaseDept = pathMap.get('kids') || pathMap.get('kids-and-baby-home') || pathMap.get('kids-and-pet-home');
  if (kidsBaseDept) {
    const kfSlug = 'kids-furniture';
    const kfNode: TaxonomyNode = {
      ...kidsBaseDept,
      name: 'Kids',
      slug: kfSlug,
      pathSlug: kfSlug,
      url: `/${kfSlug}`,
      department: 'Kids',
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Kids', url: `/${kfSlug}` },
      ],
      childTerms: Array.from(new Set([...kidsBaseDept.childTerms, 'kids', 'kids-furniture', 'kids furniture'])),
    };
    pathMap.set(kfSlug, kfNode);
    leafSlugMap.set(kfSlug, kfNode);
  }
}

// Initialize on import
initializeTaxonomy();

export interface TaxonomyResolveResult {
  node: TaxonomyNode | null;
  displayName: string;
  level: 0 | 1 | 2 | 3;
  canonicalUrl: string;
  breadcrumbs: TaxonomyCrumb[];
  matchingTerms: string[];
}

/**
 * Resolves any slug array (e.g. ['furniture', 'living-room-furniture', 'sofas-and-seating', 'sofas-and-couches'])
 * to its corresponding taxonomy node and breadcrumb metadata.
 */
export function resolveTaxonomyPath(slugArray: string[]): TaxonomyResolveResult {
  if (!slugArray || slugArray.length === 0) {
    return {
      node: null,
      displayName: 'All Collections & Architectural Designs',
      level: 0,
      canonicalUrl: '/collections',
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Collections', url: '/collections' },
      ],
      matchingTerms: [],
    };
  }

  const cleanSlugs = slugArray.map((s) => slugifyCategory(s));
  const fullPath = cleanSlugs.join('/');

  // 1. Direct path lookup
  if (pathMap.has(fullPath)) {
    const node = pathMap.get(fullPath)!;
    return {
      node,
      displayName: node.name,
      level: node.level,
      canonicalUrl: node.url,
      breadcrumbs: node.breadcrumbs,
      matchingTerms: Array.from(new Set(node.childTerms)),
    };
  }

  // 2. Fallback: Lookup by leaf (last) slug
  const leafSlug = cleanSlugs[cleanSlugs.length - 1];
  if (leafSlugMap.has(leafSlug)) {
    const node = leafSlugMap.get(leafSlug)!;
    return {
      node,
      displayName: node.name,
      level: node.level,
      canonicalUrl: node.url,
      breadcrumbs: node.breadcrumbs,
      matchingTerms: Array.from(new Set(node.childTerms)),
    };
  }

  // 3. Fallback for unmapped or custom slugs: convert slug to human title
  const fallbackTitle = leafSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const fallbackCrumbs: TaxonomyCrumb[] = [
    { name: 'Home', url: '/' },
  ];

  let accumulated = '';
  cleanSlugs.forEach((slug, idx) => {
    accumulated += `/${slug}`;
    const isLast = idx === cleanSlugs.length - 1;
    fallbackCrumbs.push({
      name: isLast
        ? fallbackTitle
        : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url: accumulated,
    });
  });

  return {
    node: null,
    displayName: fallbackTitle,
    level: Math.min(3, Math.max(0, cleanSlugs.length - 1)) as any,
    canonicalUrl: `/${fullPath}`,
    breadcrumbs: fallbackCrumbs,
    matchingTerms: [leafSlug, fallbackTitle.toLowerCase()],
  };
}
