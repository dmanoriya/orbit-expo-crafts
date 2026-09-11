import { ProductItem, WpSeoData, MOCK_PRODUCTS, CATEGORIES, SEGMENTS, MATERIALS, FINISHES, getProductSlug } from '../data/catalogData';

export type { WpSeoData };

export interface WpCategoryItem {
  id: string;
  name: string;
  slug: string;
  wpId?: number;
  parent?: number;
  level?: number;
  count?: number;
  description?: string;
  image?: string;
  facets?: string;
  styles?: string;
  room?: string;
  seo?: WpSeoData;
  children?: WpCategoryItem[];
}

export interface WpColorItem {
  name: string;
  code: string;
}

export interface StorefrontDataResult {
  products: ProductItem[];
  categories: WpCategoryItem[];
  categoryTree: WpCategoryItem[];
  segments: string[];
  materials: string[];
  colors: WpColorItem[];
  types?: string[];
  isWpConnected: boolean;
}

export function buildCategoryTree(categories: WpCategoryItem[]): WpCategoryItem[] {
  const itemMap = new Map<number, WpCategoryItem>();
  const rootItems: WpCategoryItem[] = [];

  categories.forEach((cat) => {
    if (cat.wpId) {
      itemMap.set(cat.wpId, { ...cat, children: [] });
    }
  });

  itemMap.forEach((item) => {
    if (item.parent && itemMap.has(item.parent)) {
      const parentItem = itemMap.get(item.parent)!;
      if (!parentItem.children) parentItem.children = [];
      parentItem.children.push(item);
    } else {
      rootItems.push(item);
    }
  });

  return rootItems;
}

export function getCategorySeoPath(cat: WpCategoryItem | null | undefined, categories: WpCategoryItem[]): string {
  if (!cat || !cat.slug || cat.slug === 'all') return '/collections';
  
  const idMap = new Map<number, WpCategoryItem>();
  categories.forEach((item) => {
    if (item.wpId) idMap.set(item.wpId, item);
  });

  const pathSlugs: string[] = [];
  let current: WpCategoryItem | undefined = cat;

  while (current && current.slug) {
    pathSlugs.unshift(current.slug);
    if (current.parent && idMap.has(current.parent)) {
      current = idMap.get(current.parent);
    } else {
      break;
    }
  }

  return `/collections/${pathSlugs.join('/')}`;
}

export function getCategoryBreadcrumbs(cat: WpCategoryItem | null | undefined, categories: WpCategoryItem[]): { name: string; url: string }[] {
  const crumbs: { name: string; url: string }[] = [{ name: 'Collections', url: '/collections' }];
  if (!cat || !cat.slug || cat.slug === 'all') return crumbs;

  const idMap = new Map<number, WpCategoryItem>();
  categories.forEach((item) => {
    if (item.wpId) idMap.set(item.wpId, item);
  });

  const chain: WpCategoryItem[] = [];
  let current: WpCategoryItem | undefined = cat;

  while (current) {
    chain.unshift(current);
    if (current.parent && idMap.has(current.parent)) {
      current = idMap.get(current.parent);
    } else {
      break;
    }
  }

  let accumulatedPath = '/collections';
  chain.forEach((item) => {
    accumulatedPath += `/${item.slug}`;
    crumbs.push({ name: item.name, url: accumulatedPath });
  });

  return crumbs;
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  let decoded = str;
  while (decoded.includes('&amp;')) {
    decoded = decoded.replace(/&amp;/g, '&');
  }
  return decoded
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

const productCacheMap = new Map<string, ProductItem>();
let cachedStorefrontData: StorefrontDataResult | null = null;
let lastCacheTime = 0;

export function getSynchronousProduct(slug?: string): ProductItem | null {
  if (!slug) return null;
  const clean = decodeURIComponent(slug).toLowerCase();

  if (productCacheMap.has(clean)) {
    return productCacheMap.get(clean)!;
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(`p_cache_${clean}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          parsed &&
          (parsed.id?.toLowerCase() === clean ||
            parsed.slug?.toLowerCase() === clean ||
            parsed.sku?.toLowerCase() === clean)
        ) {
          productCacheMap.set(clean, parsed);
          return parsed;
        }
      }
    } catch (e) {}
  }

  // Look in cachedStorefrontData strictly for exact match
  const searchPool = cachedStorefrontData?.products || [];
  const match = searchPool.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      p.slug?.toLowerCase() === clean ||
      getProductSlug(p).toLowerCase() === clean ||
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean ||
      (p as any).sku?.toLowerCase() === clean
  );

  if (match) {
    productCacheMap.set(clean, match);
    return match;
  }

  return null;
}

export function getCachedStorefrontData(): StorefrontDataResult | null {
  return cachedStorefrontData;
}

export function getWpEndpoint(path: string): string {
  if (typeof window !== 'undefined') {
    return `/api/wp${path}`;
  }
  const defaultWp = process.env.NODE_ENV === 'development' ? 'http://woo-catalog-nextjs.local' : 'https://admin.orbitexpocrafts.com';
  const wpBase = (process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL || defaultWp).replace(/\/$/, '');
  return `${wpBase}/wp-json/hcc/v1${path}`;
}

export function clearWpDataCache() {
  cachedStorefrontData = null;
  lastCacheTime = 0;
  productCacheMap.clear();
}

export async function fetchWpStorefrontData(): Promise<StorefrontDataResult> {
  const isDev = process.env.NODE_ENV === 'development';
  const cacheTtlMs = isDev ? 5000 : 30000; // 5s in development for instant local reflection, 30s in production
  const now = Date.now();

  if (cachedStorefrontData && (now - lastCacheTime < cacheTtlMs)) {
    return cachedStorefrontData;
  }

  try {
    const fetchOpts = (tag: string): RequestInit => ({
      next: { tags: [tag], revalidate: isDev ? 0 : 30 },
      ...(isDev ? { cache: 'no-store' as RequestCache } : {}),
    });

    const [resProd, resCat, resAttr] = await Promise.all([
      fetch(getWpEndpoint('/products?per_page=-1'), fetchOpts('wp-products')).catch(() => null),
      fetch(getWpEndpoint('/categories'), fetchOpts('wp-categories')).catch(() => null),
      fetch(getWpEndpoint('/attributes'), fetchOpts('wp-attributes')).catch(() => null),
    ]);

    let wpProducts: ProductItem[] = [];
    let wpCategories: WpCategoryItem[] = [];
    let wpSegments: string[] = SEGMENTS.map(decodeHtmlEntities);
    let wpMaterials: string[] = MATERIALS.map(decodeHtmlEntities);
    let wpColors: WpColorItem[] = FINISHES.map((f) => ({ name: decodeHtmlEntities(f.name), code: f.code }));
    let isWpConnected = false;

    // 1. Process Attributes from WordPress API
    if (resAttr && resAttr.ok) {
      const attrJson = await resAttr.json().catch(() => null);
      if (attrJson && attrJson.success && attrJson.data) {
        if (Array.isArray(attrJson.data)) {
          attrJson.data.forEach((attr: any) => {
            const slug = (attr.slug || '').toLowerCase();
            const opts = Array.isArray(attr.options)
              ? attr.options
                  .map((o: any) => (typeof o === 'string' ? decodeHtmlEntities(o) : decodeHtmlEntities(o.name || o.slug || '')))
                  .filter(Boolean)
              : [];

            if (slug === 'segment' || slug === 'pa_segment' || slug === 'space') {
              if (opts.length > 0) wpSegments = opts;
            } else if (slug === 'material' || slug === 'pa_material' || slug === 'craft') {
              if (opts.length > 0) wpMaterials = opts;
            } else if (slug === 'color' || slug === 'pa_color' || slug === 'finish') {
              if (opts.length > 0) {
                wpColors = opts.map((name: string) => {
                  const match = FINISHES.find((f) => f.name.toLowerCase() === name.toLowerCase());
                  return { name, code: match?.code || '#8A7968' };
                });
              }
            }
          });
        } else if (typeof attrJson.data === 'object') {
          if (Array.isArray(attrJson.data.segments) && attrJson.data.segments.length > 0) {
            wpSegments = attrJson.data.segments.map(decodeHtmlEntities);
          }
          if (Array.isArray(attrJson.data.materials) && attrJson.data.materials.length > 0) {
            wpMaterials = attrJson.data.materials.map(decodeHtmlEntities);
          }
          if (Array.isArray(attrJson.data.colors) && attrJson.data.colors.length > 0) {
            wpColors = attrJson.data.colors.map((c: any) => ({ name: decodeHtmlEntities(c.name), code: c.code || '#8A7968' }));
          }
        }
      }
    }

    // 2. Process Categories from WordPress WooCommerce
    if (resCat && resCat.ok) {
      const catJson = await resCat.json().catch(() => null);
      if (catJson && catJson.success && Array.isArray(catJson.data)) {
        isWpConnected = true;
        wpCategories = catJson.data
          .filter((c: any) => c.slug !== 'uncategorized')
          .map((c: any) => ({
            id: c.slug,
            name: decodeHtmlEntities(c.name),
            slug: c.slug,
            wpId: c.id,
            parent: c.parent ? Number(c.parent) : 0,
            level: c.level !== undefined && c.level !== null ? Number(c.level) : undefined,
            count: c.count || 0,
            description: decodeHtmlEntities(c.description || ''),
            image: c.image || '',
            facets: c.facets || '',
            styles: c.styles || '',
            room: c.room || '',
            seo: c.seo || undefined,
          }));
      }
    }

    // 3. Process Products from WordPress WooCommerce
    if (resProd && resProd.ok) {
      const prodJson = await resProd.json().catch(() => null);
      if (prodJson && prodJson.success && Array.isArray(prodJson.data?.products)) {
        isWpConnected = true;

        // Build category lookup maps for hierarchical ancestor resolution
        const categoryByWpId = new Map<number, WpCategoryItem>();
        const categoryBySlug = new Map<string, WpCategoryItem>();
        wpCategories.forEach((c) => {
          if (c.wpId) categoryByWpId.set(c.wpId, c);
          if (c.slug) categoryBySlug.set(c.slug.toLowerCase(), c);
        });

        const resolveHierarchySlugsAndNames = (
          rawCats: Array<{ id?: number | string; slug?: string; name?: string }>
        ): { slugs: string[]; names: string[] } => {
          const slugsSet = new Set<string>();
          const namesSet = new Set<string>();

          rawCats.forEach((rc) => {
            if (rc.slug) slugsSet.add(rc.slug.toLowerCase());
            if (rc.name) namesSet.add(decodeHtmlEntities(rc.name));

            let currentCat: WpCategoryItem | undefined = rc.id
              ? categoryByWpId.get(Number(rc.id))
              : (rc.slug ? categoryBySlug.get(rc.slug.toLowerCase()) : undefined);

            const visited = new Set<number>();
            while (currentCat) {
              if (currentCat.slug) slugsSet.add(currentCat.slug.toLowerCase());
              if (currentCat.name) namesSet.add(currentCat.name);

              if (currentCat.wpId && visited.has(currentCat.wpId)) break;
              if (currentCat.wpId) visited.add(currentCat.wpId);

              if (currentCat.parent && categoryByWpId.has(currentCat.parent)) {
                currentCat = categoryByWpId.get(currentCat.parent);
              } else {
                break;
              }
            }
          });

          return {
            slugs: Array.from(slugsSet),
            names: Array.from(namesSet),
          };
        };

        const inferFallbackCategory = (name: string): { slug: string; name: string } => {
          const lower = name.toLowerCase();
          for (const catDef of CATEGORIES) {
            for (const t of catDef.types) {
              if (lower.includes(t.toLowerCase())) {
                return { slug: catDef.id, name: catDef.name };
              }
            }
          }
          return { slug: 'furniture', name: 'Furniture' };
        };

        wpProducts = prodJson.data.products.map((p: any) => {
          const rawCats = Array.isArray(p.categories) ? p.categories : [];
          const { slugs: hierarchySlugs, names: hierarchyNames } = resolveHierarchySlugsAndNames(rawCats);

          let mainCat = rawCats[0];
          let catSlug = mainCat?.slug ? mainCat.slug.toLowerCase() : '';
          let catName = mainCat?.name ? decodeHtmlEntities(mainCat.name) : '';

          if (!catSlug) {
            const fallback = inferFallbackCategory(p.name || '');
            catSlug = fallback.slug;
            catName = fallback.name;
            if (!hierarchySlugs.includes(catSlug)) hierarchySlugs.push(catSlug);
            if (!hierarchyNames.includes(catName)) hierarchyNames.push(catName);
          }

          const productSlug = p.slug || getProductSlug({ name: p.name, id: `ORB-${p.id}` });
          const lowerName = decodeHtmlEntities(p.name || '').toLowerCase();
          let detectedType = (p as any).subtype || '';
          if (!detectedType) {
            const allKnownTypes = Array.from(new Set(CATEGORIES.flatMap((c) => c.types))).sort((a, b) => b.length - a.length);
            for (const t of allKnownTypes) {
              if (lowerName.includes(t.toLowerCase())) {
                detectedType = t;
                break;
              }
            }
          }

          return {
              id: p.slug || `ORB-${p.id}`,
              sku: p.sku || `ORB-${p.id}`,
              slug: productSlug,
              name: decodeHtmlEntities(p.name),
              cat: catSlug,
              catName: catName,
              catSlugs: hierarchySlugs.length > 0 ? hierarchySlugs : [catSlug],
              catNames: hierarchyNames.length > 0 ? hierarchyNames : [catName],
              categories: rawCats.map((c: any) => ({
                id: c.id,
                name: decodeHtmlEntities(c.name || ''),
                slug: (c.slug || '').toLowerCase(),
              })),
              type: detectedType || catName || 'Furniture',
              subtype: detectedType || '',
              segment: decodeHtmlEntities(p.segment || p.attributes?.segment?.[0] || 'Hotel Guestroom'),
            segment2: 'Restaurant',
            material: decodeHtmlEntities(p.material || 'Solid Wood'),
            material2: decodeHtmlEntities(p.material2 || 'Brass Detailing'),
            color: decodeHtmlEntities(p.color || 'Natural Oil'),
            availableColors: Array.isArray(p.availableColors) && p.availableColors.length > 0
              ? p.availableColors.map(decodeHtmlEntities)
              : (Array.isArray(p.attributes?.pa_color) ? p.attributes.pa_color.map(decodeHtmlEntities) : [decodeHtmlEntities(p.color || 'Natural Oil')]),
            variations: Array.isArray(p.variations) ? p.variations : [],
            attributes: p.attributes || {},
            moq: p.moq || 1,
            lead: p.leadTime || 21,
            dims: decodeHtmlEntities(p.dimensions ? (Array.isArray(p.dimensions) ? p.dimensions.join(' × ') : p.dimensions) : '58 × 62 × 78 cm — customisable'),
            packing: decodeHtmlEntities(p.packing || 'Export-grade carton, knock-down where possible'),
            leadTimeText: decodeHtmlEntities(p.leadTimeText || `${p.leadTime || 30} working days after sample approval`),
            priceNote: decodeHtmlEntities(p.priceNote || 'Quoted to your spec & quantity'),
            badge: (p.badge && !['none', 'null', ''].includes(String(p.badge).toLowerCase().trim()))
              ? (decodeHtmlEntities(p.badge) as any)
              : (p.onSale ? 'Best Seller' : null),
            is_new: (p.badge && String(p.badge).trim().toLowerCase() === 'new') || Boolean((p as any).is_new),
            onSale: Boolean(p.onSale),
            dateCreated: p.dateCreated || p.date_created || '',
            image: p.image || '/fallback-product.svg',
            shortDescription: decodeHtmlEntities(p.shortDescription || ''),
            description: decodeHtmlEntities(p.description || ''),
            gallery: Array.isArray(p.gallery) ? p.gallery : [],
          };
        });

        // Ensure New Arrivals cohort exists if none explicitly tagged
        const hasNew = wpProducts.some((p) => p.badge === 'New' || p.is_new);
        if (!hasNew && wpProducts.length > 0) {
          const sortedByRecency = [...wpProducts].sort((a, b) => {
            const dateA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
            const dateB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
            if (dateA !== dateB) return dateB - dateA;
            const numA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
            return numB - numA;
          });
          const newCohortIds = new Set(sortedByRecency.slice(0, 24).map((p) => p.id));
          wpProducts = wpProducts.map((p) => {
            if (newCohortIds.has(p.id)) {
              return {
                ...p,
                badge: p.badge || 'New',
                is_new: true,
              };
            }
            return p;
          });
        }

        wpProducts.forEach((prod) => {
          if (prod.id) productCacheMap.set(prod.id.toLowerCase(), prod);
          if (prod.slug) productCacheMap.set(prod.slug.toLowerCase(), prod);
          if (prod.sku) productCacheMap.set(prod.sku.toLowerCase(), prod);
        });

        // Dynamically aggregate all distinct selections across products
        const segSet = new Set<string>(wpSegments);
        const matSet = new Set<string>(wpMaterials);
        const colMap = new Map<string, string>();
        wpColors.forEach((c) => colMap.set(c.name.toLowerCase(), c.code));
        const typeSet = new Set<string>();

        wpProducts.forEach((p) => {
          if (p.segment) segSet.add(p.segment);
          if ((p as any).segment2) segSet.add((p as any).segment2);
          if (Array.isArray((p as any).attributes?.pa_segment)) {
            (p as any).attributes.pa_segment.forEach((s: string) => segSet.add(s));
          }

          if (p.material) matSet.add(p.material);
          if ((p as any).material2) matSet.add((p as any).material2);
          if (Array.isArray((p as any).attributes?.pa_material)) {
            (p as any).attributes.pa_material.forEach((m: string) => matSet.add(m));
          }

          const pCol = p.color;
          if (pCol && !colMap.has(pCol.toLowerCase())) {
            const match = FINISHES.find((f) => f.name.toLowerCase() === pCol.toLowerCase());
            colMap.set(pCol.toLowerCase(), match?.code || '#8A7968');
          }
          if (Array.isArray((p as any).availableColors)) {
            (p as any).availableColors.forEach((c: string) => {
              if (!colMap.has(c.toLowerCase())) {
                const match = FINISHES.find((f) => f.name.toLowerCase() === c.toLowerCase());
                colMap.set(c.toLowerCase(), match?.code || '#8A7968');
              }
            });
          }
          if (Array.isArray((p as any).attributes?.pa_color)) {
            (p as any).attributes.pa_color.forEach((c: string) => {
              if (!colMap.has(c.toLowerCase())) {
                const match = FINISHES.find((f) => f.name.toLowerCase() === c.toLowerCase());
                colMap.set(c.toLowerCase(), match?.code || '#8A7968');
              }
            });
          }

          // Type / Subtype
          if ((p as any).subtype) {
            typeSet.add((p as any).subtype);
          } else {
            const allKnownTypes = Array.from(new Set(CATEGORIES.flatMap((c) => c.types))).sort((a, b) => b.length - a.length);
            const lowerName = (p.name || '').toLowerCase();
            for (const t of allKnownTypes) {
              if (lowerName.includes(t.toLowerCase())) {
                typeSet.add(t);
                break;
              }
            }
          }
        });

        wpSegments = Array.from(segSet).filter(Boolean);
        wpMaterials = Array.from(matSet).filter(Boolean);
        wpColors = Array.from(colMap.entries()).map(([k, code]) => {
          const match = FINISHES.find((f) => f.name.toLowerCase() === k);
          const orig = match?.name || k.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return { name: orig, code };
        });
        (cachedStorefrontData as any) = null;
      }
    }

    // FALLBACK ONLY WHEN WORDPRESS IS OFFLINE/DISCONNECTED
    if (!isWpConnected) {
      return {
        products: MOCK_PRODUCTS,
        categories: [],
        categoryTree: [],
        segments: SEGMENTS.map(decodeHtmlEntities),
        materials: MATERIALS.map(decodeHtmlEntities),
        colors: FINISHES.map((f) => ({ name: decodeHtmlEntities(f.name), code: f.code })),
        types: ['Dining Chair', 'Arm Chair', 'Bar Stool', 'Dining Table', 'Coffee Table', 'Console Table', 'King Bed', 'Sideboard', 'Wall Panel'],
        isWpConnected: false,
      };
    }

    if (wpProducts.length === 0) {
      wpProducts = MOCK_PRODUCTS;
    }

    // Extract types for final response
    const finalTypes = new Set<string>();
    const allKnownTypes = Array.from(new Set(CATEGORIES.flatMap((c) => c.types))).sort((a, b) => b.length - a.length);
    wpProducts.forEach((p) => {
      if ((p as any).subtype) {
        finalTypes.add((p as any).subtype);
      } else {
        const lowerName = (p.name || '').toLowerCase();
        for (const t of allKnownTypes) {
          if (lowerName.includes(t.toLowerCase())) {
            finalTypes.add(t);
            break;
          }
        }
      }
    });

    cachedStorefrontData = {
      products: wpProducts,
      categories: wpCategories,
      categoryTree: buildCategoryTree(wpCategories),
      segments: wpSegments,
      materials: wpMaterials,
      colors: wpColors,
      types: Array.from(finalTypes).sort(),
      isWpConnected: true,
    };
    lastCacheTime = Date.now();

    return cachedStorefrontData;
  } catch (err) {
    console.log('Error fetching WordPress storefront data, using fallback:', err);
    return {
      products: MOCK_PRODUCTS,
      categories: [],
      categoryTree: [],
      segments: SEGMENTS.map(decodeHtmlEntities),
      materials: MATERIALS.map(decodeHtmlEntities),
      colors: FINISHES.map((f) => ({ name: decodeHtmlEntities(f.name), code: f.code })),
      types: ['Dining Chair', 'Arm Chair', 'Bar Stool', 'Dining Table', 'Coffee Table', 'Console Table', 'King Bed', 'Sideboard', 'Wall Panel'],
      isWpConnected: false,
    };
  }
}

export async function fetchWpProductBySlug(slug: string): Promise<{ product: ProductItem | null; gallery: string[]; isWpConnected: boolean }> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase();
  const isDev = process.env.NODE_ENV === 'development';

  // 1. Fetch single product from REST endpoint
  try {
    const res = await fetch(getWpEndpoint(`/products/slug/${cleanSlug}`), {
      next: { tags: ['wp-products', `wp-product-${cleanSlug}`], revalidate: isDev ? 0 : 30 },
      ...(isDev ? { cache: 'no-store' as RequestCache } : {}),
    }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success && json.data) {
        const p = json.data;
        const rawCats = Array.isArray(p.categories) ? p.categories : [];
        const catSlugs = rawCats.map((c: any) => c.slug?.toLowerCase()).filter(Boolean);
        const mainCat = rawCats[0];
        const catSlug = mainCat?.slug ? mainCat.slug.toLowerCase() : 'seating';
        const catName = mainCat?.name ? decodeHtmlEntities(mainCat.name) : 'Seating';

        const productSlug = p.slug || getProductSlug({ name: p.name, id: `ORB-${p.id}` });
        const catNames = rawCats.map((c: any) => decodeHtmlEntities(c.name || '')).filter(Boolean);

        const productItem: ProductItem = {
          id: p.slug || `ORB-${p.id}`,
          sku: p.sku || `ORB-${p.id}`,
          slug: productSlug,
          name: decodeHtmlEntities(p.name),
          cat: catSlug,
          catName: catName,
          catSlugs: catSlugs.length > 0 ? catSlugs : [catSlug],
          catNames: catNames.length > 0 ? catNames : [catName],
          categories: rawCats.map((c: any) => ({
            id: c.id,
            name: decodeHtmlEntities(c.name || ''),
            slug: (c.slug || '').toLowerCase(),
          })),
          type: catName,
          segment: decodeHtmlEntities(p.segment || p.attributes?.segment?.[0] || 'Hotel Guestroom'),
          segment2: 'Restaurant',
          material: decodeHtmlEntities(p.material || 'Solid Wood'),
          material2: decodeHtmlEntities(p.material2 || 'Brass Detailing'),
          color: decodeHtmlEntities(p.color || 'Natural Oil'),
          availableColors: Array.isArray(p.availableColors) && p.availableColors.length > 0
            ? p.availableColors.map(decodeHtmlEntities)
            : (Array.isArray(p.attributes?.pa_color) ? p.attributes.pa_color.map(decodeHtmlEntities) : [decodeHtmlEntities(p.color || 'Natural Oil')]),
          variations: Array.isArray(p.variations) ? p.variations : [],
          attributes: p.attributes || {},
          moq: p.moq || 1,
          lead: p.leadTime || 21,
          dims: decodeHtmlEntities(p.dimensions ? (Array.isArray(p.dimensions) ? p.dimensions.join(' × ') : p.dimensions) : '58 × 62 × 78 cm — customisable'),
          packing: decodeHtmlEntities(p.packing || 'Export-grade carton, knock-down where possible'),
          leadTimeText: decodeHtmlEntities(p.leadTimeText || `${p.leadTime || 30} working days after sample approval`),
          priceNote: decodeHtmlEntities(p.priceNote || 'Quoted to your spec & quantity'),
          badge: (p.badge && !['none', 'null', ''].includes(String(p.badge).toLowerCase().trim()))
            ? (decodeHtmlEntities(p.badge) as any)
            : (p.onSale ? 'Best Seller' : null),
          image: p.image || '/fallback-product.svg',
          shortDescription: decodeHtmlEntities(p.shortDescription || ''),
          description: decodeHtmlEntities(p.description || ''),
          gallery: Array.isArray(p.gallery) ? p.gallery : [],
          seo: p.seo || undefined,
        };
        productCacheMap.set(cleanSlug, productItem);
        if (productItem.slug) productCacheMap.set(productItem.slug.toLowerCase(), productItem);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`p_cache_${cleanSlug}`, JSON.stringify(productItem));
          } catch (e) {}
        }
        const gallery = [productItem.image, ...(p.gallery || [])].filter(Boolean) as string[];
        return { product: productItem, gallery, isWpConnected: true };
      }
    }
  } catch (e) {
    console.log('Single product REST fetch bypass:', e);
  }

  // 2. Fetch full WordPress dataset to match by SKU, ID, or Slug
  const { products, isWpConnected } = await fetchWpStorefrontData();
  const match = products.find(
    (p) =>
      p.id.toLowerCase() === cleanSlug ||
      p.slug?.toLowerCase() === cleanSlug ||
      getProductSlug(p).toLowerCase() === cleanSlug ||
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug ||
      (p as any).sku?.toLowerCase() === cleanSlug
  );

  if (match) {
    const gallery = [match.image, ...(match.gallery || [])].filter(Boolean) as string[];
    return { product: match, gallery, isWpConnected };
  }

  // Clear stale session cache if 404
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(`p_cache_${cleanSlug}`);
    } catch (e) {}
  }
  productCacheMap.delete(cleanSlug);

  return {
    product: null,
    gallery: [],
    isWpConnected,
  };
}

export interface HomepageData {
  hero_eyebrow: string;
  hero_title: string;
  hero_accent: string;
  hero_lede: string;
  hero_bg_mode?: string;
  hero_bg_image?: string;
  hero_bg_color?: string;
  hero_overlay_opacity?: string;
  hero_cta1_text?: string;
  hero_cta1_url?: string;
  hero_cta2_text?: string;
  hero_cta2_url?: string;
  stat1_number: string;
  stat1_label: string;
  stat2_number: string;
  stat2_label: string;
  stat3_number: string;
  stat3_label: string;
  stat4_number: string;
  stat4_label: string;
  track1_title: string;
  track1_desc: string;
  track1_points: string;
  track2_title: string;
  track2_desc: string;
  track2_points: string;
  cat_eyebrow: string;
  cat_title: string;
  cat_desc: string;
  seg_eyebrow: string;
  seg_title: string;
  seg_desc: string;
  feat_eyebrow: string;
  feat_title: string;
  feat_desc: string;
  feat_cta_text?: string;
  feat_cta_url?: string;
  step_eyebrow: string;
  step_title: string;
  step1_title: string;
  step1_desc: string;
  step2_title: string;
  step2_desc: string;
  step3_title: string;
  step3_desc: string;
  step4_title: string;
  step4_desc: string;
  step5_title: string;
  step5_desc: string;
  mat_eyebrow: string;
  mat_title: string;
  mat_desc: string;
  work_title?: string;
  work_card1_eyebrow?: string;
  work_card1_title?: string;
  work_card1_desc?: string;
  work_card1_cta?: string;
  work_card1_url?: string;
  work_card1_image?: string;
  work_card2_eyebrow?: string;
  work_card2_title?: string;
  work_card2_desc?: string;
  work_card2_cta?: string;
  work_card2_url?: string;
  work_card2_image?: string;
  band_title: string;
  band_desc: string;
  band_cta1_text: string;
  band_cta1_url: string;
  band_cta2_text: string;
  band_cta2_url: string;
  new_arrivals_eyebrow?: string;
  new_arrivals_title?: string;
  new_arrivals_desc?: string;
  new_arrivals_cta?: string;
  new_arrivals_url?: string;
}

export const DEFAULT_HOMEPAGE_DATA: HomepageData = {
  hero_eyebrow: 'THE LIVING GALLERY',
  hero_title: 'Objects with a life beyond trends.',
  hero_accent: 'beyond trends.',
  hero_lede: 'Handcrafted furniture and décor, shaped by enduring materials and thoughtful detail.',
  hero_bg_mode: 'image',
  hero_bg_image: '/hero_section_bg.webp',
  hero_bg_color: '#F5F2EC',
  hero_overlay_opacity: '0',
  hero_cta1_text: 'EXPLORE THE COLLECTION',
  hero_cta1_url: '/collections',
  hero_cta2_text: 'DISCOVER OUR CRAFT',
  hero_cta2_url: '/about',
  stat1_number: '3,20,000',
  stat1_label: 'SQ. FT. WORKS',
  stat2_number: '1,400+',
  stat2_label: 'CRAFTSMEN & STAFF',
  stat3_number: '24',
  stat3_label: 'EXPORT MARKETS',
  stat4_number: '98%',
  stat4_label: 'ON-TIME DELIVERY',
  work_title: "Choose How You'd Like to Work With Us",
  work_card1_eyebrow: 'SHOP FURNITURE',
  work_card1_title: 'Individual Pieces, Made to Belong',
  work_card1_desc: 'Discover considered furniture and objects for one room, one corner, or the whole home.',
  work_card1_cta: 'EXPLORE THE COLLECTION',
  work_card1_url: '/furniture',
  work_card1_image: '/Explore_collection.webp',
  work_card2_eyebrow: 'COMPLETE PROJECTS',
  work_card2_title: 'Spaces, Crafted from Brief to Installation',
  work_card2_desc: 'Partner with our project team for custom furniture, material development, production and complete execution.',
  work_card2_cta: 'VISIT THE TRADE DESK',
  work_card2_url: '/discuss-projects',
  work_card2_image: '/Project.webp',
  track1_title: 'Direct contract projects',
  track1_desc: 'Full-scope loose furniture & fixed joinery built to architect specifications.',
  track1_points: "Kiln-dried & anti-borer treated timber\nCustom stain matching & fabric approvals\nCAD/3D shop drawing review\nDoor-to-door freight & logistics",
  track2_title: 'Turnkey plug-in packages',
  track2_desc: 'Pre-engineered room packages for rapid hotel guestroom & restaurant fit-outs.',
  track2_points: "FSC certified wood options\nNo minimum order quantity\n45-day turnaround guarantee\nSite installation support team",
  cat_eyebrow: 'PRODUCT CATEGORIES · DIRECT FACTORY CATALOGUE',
  cat_title: 'Ten categories. Every piece a room needs.',
  cat_desc: 'From solid wood seating to complex bone inlay casegoods — every piece is built to order in our Udaipur and Jodhpur manufacturing facilities.',
  seg_eyebrow: 'PROJECT DOMAINS',
  seg_title: 'Shop the way a project actually gets specified.',
  seg_desc: 'Furniture engineered for commercial spaces with heavy contract use standards.',
  feat_eyebrow: '',
  feat_title: 'A few we are proud of this season.',
  feat_desc: 'Popular baseline designs ready for customization to your project’s material, fabric, and dimensional specifications.',
  feat_cta_text: 'Explore Collection',
  feat_cta_url: '/collections',
  step_eyebrow: 'FACTORY PROCESS',
  step_title: 'Five steps from your drawing to your floor.',
  step1_title: 'Enquiry',
  step1_desc: 'Send drawings, BOQ, or shortlist catalog items for quotation.',
  step2_title: 'Specs',
  step2_desc: 'CAD shop drawings, timber samples, and fabric approvals.',
  step3_title: 'Prototype',
  step3_desc: 'First-piece inspection before bulk production begins.',
  step4_title: 'Manufacture',
  step4_desc: 'Solid wood joinery, finishing, upholstery, and QC.',
  step5_title: 'Delivery',
  step5_desc: 'Export-grade packaging, shipping, and site installation.',
  mat_eyebrow: 'HERITAGE CRAFTS',
  mat_title: 'Twenty-one material vocabularies under one roof.',
  mat_desc: 'Combining traditional Rajasthan woodworking, bone inlay, and metalwork with modern European hardware.',
  band_title: "Tell us what you're building.",
  band_desc: 'Send your BOQ or architectural drawings. Our project desk replies with formal pricing, lead time, and freight within 24 working hours.',
  band_cta1_text: 'Start an enquiry',
  band_cta1_url: '/contact',
  band_cta2_text: 'Explore 2026 collections',
  band_cta2_url: '/collections',
  new_arrivals_eyebrow: 'NEW ARRIVALS',
  new_arrivals_title: 'Fresh from the Rajasthan Workshops',
  new_arrivals_desc: 'Recently finished bespoke archetypes, contemporary additions, and seasonal design debuts ready for contract specification.',
  new_arrivals_cta: 'Explore all new arrivals',
  new_arrivals_url: '/collections?badge=new',
};

export async function fetchWpHomepageData(): Promise<HomepageData> {
  try {
    const res = await fetch(getWpEndpoint('/homepage'), { cache: 'no-store' }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success && json.data) {
        const raw = json.data;
        const cleaned: any = {};
        Object.keys(raw).forEach((k) => {
          cleaned[k] = typeof raw[k] === 'string' ? decodeHtmlEntities(raw[k]) : raw[k];
        });
        return { ...DEFAULT_HOMEPAGE_DATA, ...cleaned };
      }
    }
  } catch (e) {
    console.log('Homepage REST fetch bypass:', e);
  }

  return DEFAULT_HOMEPAGE_DATA;
}

export interface WpBlogPostItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  image: string;
  readTime: string;
  seo?: WpSeoData;
}

export const FALLBACK_JOURNAL_ARTICLES: WpBlogPostItem[] = [
  {
    id: 3426,
    slug: 'seasoning-timber-rajasthan-climate',
    title: 'Precision Kiln-Drying: Why 8-10% Moisture Content Matters for International Export',
    category: 'Timber Engineering',
    date: 'August 18, 2026',
    author: 'Rajeev Sharma',
    readTime: '6 min read',
    image: '/categories/tables.jpg',
    excerpt: 'Solid wood exported from Rajasthan to humid or coastal environments must undergo vacuum kiln-seasoning to prevent warping, checking, or joint distortion across seasonal temperature swings.',
    content: `
      <p>Solid wood exported from Rajasthan to humid or coastal environments must undergo vacuum kiln-seasoning to prevent warping, checking, or joint distortion across seasonal temperature swings.</p>
      <h2>Kiln Seasoning & Moisture Balance</h2>
      <p>In high-grade timber engineering, controlling EMC (Equilibrium Moisture Content) is the single most critical factor for furniture longevity. Our facilities in Udaipur and Jodhpur utilize double-chamber vacuum drying kilns that systematically reduce timber moisture to 8-10%.</p>
      <h3>Key Quality Controls:</h3>
      <ul>
        <li>Pressure impregnation with eco-friendly anti-borer and anti-termite salts.</li>
        <li>Digital moisture probe testing across core and surface points before milling.</li>
        <li>Stress relief steaming cycles to eliminate internal grain tension.</li>
      </ul>
      <h2>Thermal Stabilization Protocols</h2>
      <p>Before precision joinery begins, all seasoned planks undergo a mandatory 72-hour acclimation period in temperature-regulated resting bays. This guarantees that internal cellular equilibrium is achieved prior to CNC spindle milling or mortise-and-tenon construction.</p>
    `,
  },
  {
    id: 3427,
    slug: 'bone-inlay-craft-technique',
    title: 'The Heritage Art of Camel Bone & Mother of Pearl Inlay in Modern Luxury Hospitality',
    category: 'Artisanal Craft',
    date: 'July 24, 2026',
    author: 'Sunil Jha',
    readTime: '8 min read',
    image: '/categories/decor.jpg',
    excerpt: 'Trace the 400-year history of Rajasthani inlay work from royal palaces to contemporary boutique hotel credenzas, mirrors, and accent tables.',
    content: `
      <p>Trace the 400-year history of Rajasthani inlay work from royal palaces to contemporary boutique hotel credenzas, mirrors, and accent tables.</p>
      <h2>Hand-Carved Inlay Precision</h2>
      <p>Every piece of bone or mother-of-pearl inlay furniture begins with hand-carved fragments individually shaped by master artisans. The fragments are hand-set into solid timber frames and encased in high-durability resin binder, creating striking geometric or floral motifs.</p>
      <h2>Modern Hospitality Durability Standards</h2>
      <p>To meet high-traffic commercial hospitality demands, our workshops utilize UV-stabilized clear resins that resist yellowing under ambient light, paired with high-tensile backing substrates that withstand daily housekeeping protocols.</p>
    `,
  },
  {
    id: 3428,
    slug: 'turnkey-hotel-fitout-checklist',
    title: '45-Day Turnkey Room Package Delivery: Engineering Shop Drawings to Site Installation',
    category: 'Turnkey Execution',
    date: 'June 12, 2026',
    author: 'Divya Mehta',
    readTime: '5 min read',
    image: '/categories/beds.jpg',
    excerpt: 'A comprehensive guide for architects and procurement agencies on streamlining pre-engineered room fit-outs with CAD approvals and containerized logistics.',
    content: `
      <p>A comprehensive guide for architects and procurement agencies on streamlining pre-engineered room fit-outs with CAD approvals and containerized logistics.</p>
      <h2>Streamlined Fit-out Engineering</h2>
      <p>From initial mock-up room (MOCK) sign-off to site installation, contract fit-out projects demand precise timeline control. We provide complete 3D shop drawings, hardware specifications, and serialized container packaging for seamless on-site deployment.</p>
      <h2>Parallel Manufacturing Sequencing</h2>
      <p>By running casegoods fabrication, metal finishing, and custom upholstery in parallel dedicated workshops, our team compresses standard 90-day lead times into a reliable 45-day turnkey delivery window.</p>
    `,
  },
  {
    id: 3429,
    slug: 'heavy-contract-durability-standards',
    title: 'Commercial Seating Specification: Martindale Ratings, Anti-Borer Treatment & Joinery Standards',
    category: 'Quality Standards',
    date: 'May 29, 2026',
    author: 'Karan Singhal',
    readTime: '7 min read',
    image: '/categories/seating.jpg',
    excerpt: 'How we engineer contract chairs and banquettes to withstand high-footfall hotel dining, restaurant, and lounge environments without compromising aesthetic finesse.',
    content: `
      <p>How we engineer contract chairs and banquettes to withstand high-footfall hotel dining, restaurant, and lounge environments without compromising aesthetic finesse.</p>
      <h2>Heavy Commercial Joinery</h2>
      <p>Contract chairs require double-doweled or corner-blocked hardwood frames engineered for minimum 50,000+ Martindale rub count upholstery fabrics and high-density combustion-modified foam.</p>
      <h2>Load Testing & Structural Rigidity</h2>
      <p>Every seating archetype is cycle-tested under simulated 150kg drop-impact loads to verify joint integrity before container consolidation and export sign-off.</p>
    `,
  },
  {
    id: 3430,
    slug: 'brass-metal-casting-finishes',
    title: 'Architectural Metalwork & Cast Brass Finishes: Chemical Patinas vs PVD Coatings',
    category: 'Metal & Hardware',
    date: 'May 14, 2026',
    author: 'Orbit Expo Crafts Team',
    readTime: '6 min read',
    image: '/categories/decor.jpg',
    excerpt: 'Understanding durability, maintenance cycles, and hand-rubbed patinas for heavy commercial hardware, table bases, and decorative lighting.',
    content: `
      <p>Understanding durability, maintenance cycles, and hand-rubbed patinas for heavy commercial hardware, table bases, and decorative lighting.</p>
      <h2>Hand-Rubbed Patinas vs PVD</h2>
      <p>Architectural metal components in hospitality environments require specialized protective clear coats or physical vapor deposition (PVD) to prevent oxidation while retaining organic metallic warmth.</p>
    `,
  },
];

function getCategoryFallbackImage(categorySlug?: string): string {
  const cat = (categorySlug || '').toLowerCase();
  if (cat.includes('table')) return '/categories/tables.jpg';
  if (cat.includes('bed') || cat.includes('bedroom')) return '/categories/beds.jpg';
  if (cat.includes('seat') || cat.includes('chair') || cat.includes('sofa')) return '/categories/seating.jpg';
  if (cat.includes('storage') || cat.includes('cabinet')) return '/categories/storage.jpg';
  return '/categories/decor.jpg';
}

export async function fetchWpBlogPosts(): Promise<WpBlogPostItem[]> {
  const isDev = process.env.NODE_ENV === 'development';
  try {
    const res = await fetch(getWpEndpoint('/posts?per_page=20'), {
      next: { tags: ['wp-posts'], revalidate: isDev ? 0 : 60 },
      ...(isDev ? { cache: 'no-store' as RequestCache } : {}),
    });
    if (!res.ok) return FALLBACK_JOURNAL_ARTICLES;

    const json = await res.json();
    if (json && json.success && Array.isArray(json.data?.posts) && json.data.posts.length > 0) {
      return json.data.posts.map((p: any) => {
        const mainCat = p.categories && p.categories.length > 0 ? p.categories[0] : null;
        return {
          id: p.id,
          title: decodeHtmlEntities(p.title || ''),
          slug: p.slug,
          excerpt: decodeHtmlEntities(p.excerpt || '').replace(/<[^>]+>/g, ''),
          content: p.content || '',
          date: p.date ? new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          author: p.author || 'Orbit Expo Crafts Team',
          category: mainCat ? decodeHtmlEntities(mainCat.name) : 'Manufacturing Insights',
          image: p.image || getCategoryFallbackImage(mainCat?.slug),
          readTime: `${Math.max(4, Math.ceil(((p.content || '') + (p.excerpt || '')).split(/\s+/).length / 150))} min read`,
          seo: p.seo || undefined,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching blog posts from WordPress API:', err);
  }
  return FALLBACK_JOURNAL_ARTICLES;
}

export async function fetchWpBlogPostBySlug(slug: string): Promise<WpBlogPostItem | null> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const isDev = process.env.NODE_ENV === 'development';

  // 1. Fetch single post by slug from REST endpoint
  try {
    const res = await fetch(getWpEndpoint(`/posts/slug/${cleanSlug}`), {
      next: { tags: ['wp-posts', `wp-post-${cleanSlug}`], revalidate: isDev ? 0 : 60 },
      ...(isDev ? { cache: 'no-store' as RequestCache } : {}),
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success && json.data) {
        const p = json.data;
        const mainCat = p.categories && p.categories.length > 0 ? p.categories[0] : null;
        return {
          id: p.id,
          title: decodeHtmlEntities(p.title || ''),
          slug: p.slug,
          excerpt: decodeHtmlEntities(p.excerpt || '').replace(/<[^>]+>/g, ''),
          content: p.content || '',
          date: p.date ? new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          author: p.author || 'Orbit Expo Crafts Team',
          category: mainCat ? decodeHtmlEntities(mainCat.name) : 'Manufacturing Insights',
          image: p.image || getCategoryFallbackImage(mainCat?.slug),
          readTime: `${Math.max(4, Math.ceil(((p.content || '') + (p.excerpt || '')).split(/\s+/).length / 150))} min read`,
          seo: p.seo || undefined,
        };
      }
    }
  } catch (err) {
    console.warn('WP Post by slug fetch error:', err);
  }

  // 2. Fallback: search in all posts
  try {
    const all = await fetchWpBlogPosts();
    const match = all.find((p) => p.slug === cleanSlug || String(p.id) === cleanSlug);
    if (match) return match;
  } catch (err) {
    console.warn('WP Post all list fallback error:', err);
  }

  // 3. Fallback: match from local curated articles
  return FALLBACK_JOURNAL_ARTICLES.find((p) => p.slug === cleanSlug || String(p.id) === cleanSlug) || null;
}
