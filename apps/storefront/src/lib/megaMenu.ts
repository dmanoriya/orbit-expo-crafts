import megaTaxonomyData from '../data/mega_menu_taxonomy.json';

export interface MegaMenuNavItem {
  id: string;
  name: string;
  slug: string;
  href: string;
  hasSubmenu: boolean;
  deptKey?: string;
  isTurnkey?: boolean;
}

export type MegaMenuTaxonomy = Record<string, Record<string, Record<string, string[]>>>;

export interface MegaMenuData {
  navItems: MegaMenuNavItem[];
  taxonomy: MegaMenuTaxonomy;
  updatedAt?: number;
}

export const DEFAULT_NAV_CATEGORIES: MegaMenuNavItem[] = [
  { id: 'nav_new_arrivals', name: 'New Arrivals', slug: 'new-arrivals', href: '/collections/new-arrivals', hasSubmenu: false },
  { id: 'nav_furniture', name: 'Furniture', slug: 'furniture', href: '/furniture', hasSubmenu: true, deptKey: 'Furniture' },
  { id: 'nav_lighting', name: 'Lighting', slug: 'lighting', href: '/lighting', hasSubmenu: true, deptKey: 'Lighting' },
  { id: 'nav_decor', name: 'Décor', slug: 'decor', href: '/decor', hasSubmenu: true, deptKey: 'Décor' },
  { id: 'nav_mirrors', name: 'Mirrors', slug: 'mirrors', href: '/mirrors', hasSubmenu: true, deptKey: 'Mirrors' },
  { id: 'nav_storage', name: 'Storage', slug: 'storage', href: '/storage', hasSubmenu: true, deptKey: 'Storage' },
  { id: 'nav_outdoor', name: 'Outdoor & Garden', slug: 'outdoor-and-garden', href: '/outdoor-and-garden', hasSubmenu: false, deptKey: 'Outdoor & Garden' },
  { id: 'nav_kitchen', name: 'Kitchen & Table Tops', slug: 'kitchen-and-table-tops', href: '/kitchen-and-table-tops', hasSubmenu: false, deptKey: 'Kitchen & Table Tops' },
  { id: 'nav_kids', name: 'Kids', slug: 'kids-furniture', href: '/kids-furniture', hasSubmenu: false, deptKey: 'Kids' },
];

export const DEFAULT_MEGA_MENU_DATA: MegaMenuData = {
  navItems: DEFAULT_NAV_CATEGORIES,
  taxonomy: megaTaxonomyData as unknown as MegaMenuTaxonomy,
  updatedAt: 0,
};

function getCandidateBases(): string[] {
  const custom = (process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || '').replace(/\/$/, '');
  const list: string[] = [];

  if (custom) list.push(custom);

  const defaults = [
    'http://woo-catalog-nextjs.local',
    'https://admin.orbitexpocrafts.com',
  ];

  for (const def of defaults) {
    if (!list.includes(def)) list.push(def);
  }

  return list;
}

/**
 * Fetch dynamic mega menu configuration from WordPress backend with candidate failover and ISR tag
 */
export async function getMegaMenuData(): Promise<MegaMenuData> {
  const candidates = getCandidateBases();
  const isDev = process.env.NODE_ENV === 'development';

  for (const base of candidates) {
    try {
      const targetUrl = `${base}/wp-json/hcc/v1/mega-menu`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(targetUrl, {
        headers: {
          Accept: 'application/json',
        },
        ...(isDev
          ? { cache: 'no-store' }
          : { next: { tags: ['mega-menu'], revalidate: 60 } }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text().catch(() => '');
        try {
          const data = JSON.parse(text);
          if (data && Array.isArray(data.navItems) && data.taxonomy && typeof data.taxonomy === 'object') {
            return {
              navItems: data.navItems,
              taxonomy: data.taxonomy,
              updatedAt: data.updatedAt || Date.now(),
            };
          }
        } catch {
          // JSON parse failed, try next candidate
        }
      }
    } catch {
      // Network/timeout error -> try next candidate
    }
  }

  // Return resilient local fallback if all backends fail
  return DEFAULT_MEGA_MENU_DATA;
}
