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
  { id: 'nav_home_decor', name: 'Home Decor', slug: 'home-decor', href: '/home-decor', hasSubmenu: true, deptKey: 'Home Decor' },
  { id: 'nav_wall_decor', name: 'Wall Decor & Mirrors', slug: 'wall-decor-and-mirrors', href: '/wall-decor-and-mirrors', hasSubmenu: true, deptKey: 'Wall Decor & Mirrors' },
  { id: 'nav_lighting', name: 'Lighting', slug: 'lighting', href: '/lighting', hasSubmenu: true, deptKey: 'Lighting' },
  { id: 'nav_rugs', name: 'Rugs & Floor Coverings', slug: 'rugs-and-floor-coverings', href: '/rugs-and-floor-coverings', hasSubmenu: true, deptKey: 'Rugs & Floor Coverings' },
  { id: 'nav_storage', name: 'Storage & Organization', slug: 'storage-and-organization', href: '/storage-and-organization', hasSubmenu: true, deptKey: 'Storage & Organization' },
  { id: 'nav_kitchen', name: 'Kitchen & Tabletop', slug: 'kitchen-and-tabletop', href: '/kitchen-and-tabletop', hasSubmenu: true, deptKey: 'Kitchen & Tabletop' },
  { id: 'nav_outdoor', name: 'Outdoor & Garden', slug: 'outdoor-and-garden', href: '/outdoor-and-garden', hasSubmenu: true, deptKey: 'Outdoor & Garden' },
  { id: 'nav_kids_pet', name: 'Kids & Pet Home', slug: 'kids-and-pet-home', href: '/collections/kids-and-pet-home', hasSubmenu: true, deptKey: 'Kids & Pet Home' },
];

export const DEFAULT_MEGA_MENU_DATA: MegaMenuData = {
  navItems: DEFAULT_NAV_CATEGORIES,
  taxonomy: megaTaxonomyData as unknown as MegaMenuTaxonomy,
  updatedAt: 0,
};

/**
 * Fetch dynamic mega menu configuration from WordPress backend with Next.js ISR tag
 */
export async function getMegaMenuData(): Promise<MegaMenuData> {
  const wpUrl =
    process.env.WORDPRESS_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_URL ||
    'https://admin.orbitexpocrafts.com';

  try {
    const res = await fetch(`${wpUrl.replace(/\/+$/, '')}/wp-json/hcc/v1/mega-menu`, {
      next: { tags: ['mega-menu'], revalidate: 86400 },
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return DEFAULT_MEGA_MENU_DATA;
    }

    const data = await res.json();

    if (data && Array.isArray(data.navItems) && data.taxonomy && typeof data.taxonomy === 'object') {
      return {
        navItems: data.navItems,
        taxonomy: data.taxonomy,
        updatedAt: data.updatedAt || Date.now(),
      };
    }

    return DEFAULT_MEGA_MENU_DATA;
  } catch (err) {
    // Return resilient local fallback on network error
    return DEFAULT_MEGA_MENU_DATA;
  }
}
