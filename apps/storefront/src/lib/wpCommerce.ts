import { ProductItem, MOCK_PRODUCTS, CATEGORIES, SEGMENTS, MATERIALS, FINISHES } from '../data/catalogData';

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
      (p as any).slug?.toLowerCase() === clean ||
      p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean ||
      (p as any).sku?.toLowerCase() === clean
  );

  if (match) {
    productCacheMap.set(clean, match);
    return match;
  }

  return null;

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
  productCacheMap.clear();
}

export async function fetchWpStorefrontData(): Promise<StorefrontDataResult> {
  if (cachedStorefrontData) {
    return cachedStorefrontData;
  }

  try {
    const [resProd, resCat, resAttr] = await Promise.all([
      fetch(getWpEndpoint('/products?per_page=-1'), { next: { tags: ['wp-products'], revalidate: 30 } }).catch(() => null),
      fetch(getWpEndpoint('/categories'), { next: { tags: ['wp-categories'], revalidate: 30 } }).catch(() => null),
      fetch(getWpEndpoint('/attributes'), { next: { tags: ['wp-attributes'], revalidate: 60 } }).catch(() => null),
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
        if (Array.isArray(attrJson.data.segments) && attrJson.data.segments.length > 0) {
          wpSegments = attrJson.data.segments.map(decodeHtmlEntities);
        }
        if (Array.isArray(attrJson.data.materials) && attrJson.data.materials.length > 0) {
          wpMaterials = attrJson.data.materials.map(decodeHtmlEntities);
        }
        if (Array.isArray(attrJson.data.colors) && attrJson.data.colors.length > 0) {
          wpColors = attrJson.data.colors.map((c: any) => ({ name: decodeHtmlEntities(c.name), code: c.code }));
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
          }));
      }
    }

    // 3. Process Products from WordPress WooCommerce
    if (resProd && resProd.ok) {
      const prodJson = await resProd.json().catch(() => null);
      if (prodJson && prodJson.success && Array.isArray(prodJson.data?.products)) {
        isWpConnected = true;
        wpProducts = prodJson.data.products.map((p: any) => {
          const rawCats = Array.isArray(p.categories) ? p.categories : [];
          const catSlugs = rawCats.map((c: any) => c.slug?.toLowerCase()).filter(Boolean);
          const mainCat = rawCats[0];
          const catSlug = mainCat?.slug ? mainCat.slug.toLowerCase() : 'seating';
          const catName = mainCat?.name ? decodeHtmlEntities(mainCat.name) : 'Seating';

          return {
            id: p.slug || `ORB-${p.id}`,
            sku: p.sku || `ORB-${p.id}`,
            name: decodeHtmlEntities(p.name),
            cat: catSlug,
            catName: catName,
            catSlugs: catSlugs.length > 0 ? catSlugs : [catSlug],
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
            badge: p.badge ? (decodeHtmlEntities(p.badge) as any) : (p.onSale ? 'Best Seller' : null),
            image: p.image || '/fallback-product.svg',
            shortDescription: decodeHtmlEntities(p.shortDescription || ''),
            description: decodeHtmlEntities(p.description || ''),
            gallery: Array.isArray(p.gallery) ? p.gallery : [],
          };
        });

        wpProducts.forEach((prod) => {
          if (prod.id) productCacheMap.set(prod.id.toLowerCase(), prod);
          if (prod.sku) productCacheMap.set(prod.sku.toLowerCase(), prod);
        });
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
        isWpConnected: false,
      };
    }

    if (wpProducts.length === 0) {
      wpProducts = MOCK_PRODUCTS;
    }

    cachedStorefrontData = {
      products: wpProducts,
      categories: wpCategories,
      categoryTree: buildCategoryTree(wpCategories),
      segments: wpSegments,
      materials: wpMaterials,
      colors: wpColors,
      isWpConnected: true,
    };

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
      isWpConnected: false,
    };
  }
}

export async function fetchWpProductBySlug(slug: string): Promise<{ product: ProductItem | null; gallery: string[]; isWpConnected: boolean }> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase();

  // 1. Fetch single product from REST endpoint
  try {
    const res = await fetch(getWpEndpoint(`/products/slug/${cleanSlug}`), { next: { tags: ['wp-products', `wp-product-${cleanSlug}`], revalidate: 86400 } }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success && json.data) {
        const p = json.data;
        const rawCats = Array.isArray(p.categories) ? p.categories : [];
        const catSlugs = rawCats.map((c: any) => c.slug?.toLowerCase()).filter(Boolean);
        const mainCat = rawCats[0];
        const catSlug = mainCat?.slug ? mainCat.slug.toLowerCase() : 'seating';
        const catName = mainCat?.name ? decodeHtmlEntities(mainCat.name) : 'Seating';

        const productItem: ProductItem = {
          id: p.slug || `ORB-${p.id}`,
          sku: p.sku || `ORB-${p.id}`,
          name: decodeHtmlEntities(p.name),
          cat: catSlug,
          catName: catName,
          catSlugs: catSlugs.length > 0 ? catSlugs : [catSlug],
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
          badge: p.badge ? (decodeHtmlEntities(p.badge) as any) : (p.onSale ? 'Best Seller' : null),
          image: p.image || '/fallback-product.svg',
          shortDescription: decodeHtmlEntities(p.shortDescription || ''),
          description: decodeHtmlEntities(p.description || ''),
          gallery: Array.isArray(p.gallery) ? p.gallery : [],
        };
        productCacheMap.set(cleanSlug, productItem);
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
  band_title: string;
  band_desc: string;
  band_cta1_text: string;
  band_cta1_url: string;
  band_cta2_text: string;
  band_cta2_url: string;
}

export const DEFAULT_HOMEPAGE_DATA: HomepageData = {
  hero_eyebrow: 'DIRECT FACTORY · UDAIPUR & JODHPUR · EST. 2011',
  hero_title: 'Furniture that arrives project-ready.',
  hero_accent: 'project-ready.',
  hero_lede: 'We engineer and build loose furniture, casegoods, lighting and fixed joinery to project drawings for luxury hotels, resorts, fine dining and international export projects.',
  hero_bg_mode: 'image',
  hero_bg_image: '/fallback-product.svg',
  hero_bg_color: '#181512',
  hero_overlay_opacity: '85',
  stat1_number: '3,20,000',
  stat1_label: 'SQ. FT. WORKS',
  stat2_number: '1,400+',
  stat2_label: 'CRAFTSMEN & STAFF',
  stat3_number: '24',
  stat3_label: 'EXPORT MARKETS',
  stat4_number: '98%',
  stat4_label: 'ON-TIME DELIVERY',
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
  feat_eyebrow: 'EXPORT READY',
  feat_title: 'A few we are proud of this season.',
  feat_desc: 'Popular baseline designs ready for customization to your project’s material, fabric, and dimensional specifications.',
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
  band_cta1_text: 'Start an enquiry →',
  band_cta1_url: '/contact',
  band_cta2_text: 'Explore 2026 catalogue',
  band_cta2_url: '/catalogue',
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
}

export async function fetchWpBlogPosts(): Promise<WpBlogPostItem[]> {
  try {
    const res = await fetch(getWpEndpoint('/posts?per_page=20'), { next: { tags: ['wp-posts'], revalidate: 60 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (json && json.success && Array.isArray(json.data?.posts)) {
      return json.data.posts.map((p: any) => ({
        id: p.id,
        title: decodeHtmlEntities(p.title || ''),
        slug: p.slug,
        excerpt: decodeHtmlEntities(p.excerpt || '').replace(/<[^>]+>/g, ''),
        content: p.content || '',
        date: p.date ? new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
        author: p.author || 'Orbit Expo Crafts Team',
        category: p.categories && p.categories.length > 0 ? decodeHtmlEntities(p.categories[0].name) : 'Manufacturing Insights',
        image: p.image || '/categories/tables.jpg',
        readTime: '5 min read',
      }));
    }
  } catch (err) {
    console.error('Error fetching blog posts from WordPress API:', err);
  }
  return [];
}
