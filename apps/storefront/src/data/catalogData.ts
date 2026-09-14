export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  types: string[];
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'seating', name: 'Seating', icon: 'i-chair', types: ['Dining Chair', 'Arm Chair', 'Accent Chair', 'Lounge Chair', 'Bar Chair', 'Bar Stool', 'Side Chair', 'Recliner', 'Rocking Chair', 'Outdoor Chair', 'Stool', 'Pouf', 'Nursing Chair', 'Desk Chair'] },
  { id: 'tables', name: 'Tables & Desks', icon: 'i-table', types: ['Dining Table', 'Coffee Table', 'Centre Table', 'Side Table', 'End Table', 'Console Table', 'Bar Table', 'Conference Table', 'Study Desk', 'Reception Desk', 'Drink Table', 'Nesting Table', 'Outdoor Dining Table'] },
  { id: 'sofas', name: 'Sofas & Lounge', icon: 'i-sofa', types: ['Single Seater', 'Two Seater', 'Three Seater', 'Sectional Sofa', 'Chesterfield', 'Sofa cum Bed', 'Chaise Lounge', 'Settee', 'Modular Lounge', 'Banquette', 'Outdoor Sofa'] },
  { id: 'beds', name: 'Beds & Bedroom', icon: 'i-bed', types: ['King Bed', 'Queen Bed', 'Upholstered Bed', 'Storage Bed', 'Day Bed', 'Headboard', 'Bunk Bed', 'Bedside Table', 'Dresser', 'Luggage Rack'] },
  { id: 'storage', name: 'Storage & Casegoods', icon: 'i-cabinet', types: ['Wardrobe', 'Almirah', 'Chest of Drawers', 'Sideboard', 'Buffet', 'Display Cabinet', 'Bar Cabinet', 'TV Unit', 'Bookshelf', 'Shoe Rack', 'Room Divider', 'Minibar Unit'] },
  { id: 'benches', name: 'Benches & Ottomans', icon: 'i-bench', types: ['Upholstered Bench', 'Wooden Bench', 'Storage Bench', 'Dining Bench', 'Garden Bench', 'Ottoman', 'Foot Stool'] },
  { id: 'outdoor', name: 'Outdoor & Poolside', icon: 'i-outdoor', types: ['Outdoor Dining Set', 'Outdoor Sofa', 'Sun Lounger', 'Garden Bench', 'Swing / Jhula', 'Planter', 'Gazebo Seating', 'Cabana', 'Parasol Base'] },
  { id: 'lighting', name: 'Lighting', icon: 'i-lamp', types: ['Pendant', 'Floor Lamp', 'Table Lamp', 'Wall Sconce', 'Chandelier', 'Lampshade', 'Lamp Stand'] },
  { id: 'decor', name: 'Decor & Mirrors', icon: 'i-mirror', types: ['Mirror', 'Wall Panel', 'Wall Cladding', 'Jaali Screen', 'Art Frame', 'Tray', 'Vase Stand', 'Handwoven Panel'] },
  { id: 'fitout', name: 'Fit-out & Counters', icon: 'i-blocks', types: ['Serving Counter', 'Bar Counter', 'Reception Counter', 'Buffet Counter', 'Host Station', 'Trolley / Cart', 'Fixed Joinery', 'Wall Wardrobe'] },
];

export const SEGMENTS = [
  'Hotel Guestroom', 'Hotel Lobby', 'Restaurant', 'Café', 'Bar & Nightclub', 'Banquet & Events',
  'Resort & Villa', 'Corporate Office', 'Co-working', 'Retail Store', 'Healthcare', 'Education', 'Residential',
  'Outdoor & Poolside', 'Airport & Transit', 'Export / Wholesale'
];

export const MATERIALS = [
  'Solid Sheesham', 'Solid Teak', 'Solid Mango', 'Solid Acacia', 'Engineered Panel', 'MS / Powder Coated Metal',
  'Brass & Bronze', 'Stainless Steel', 'Home Decor', 'Lamp and Lighting', 'Marble & Stone', 'Terrazzo', 'Cane & Rattan', 'Rope Weave', 'Resin',
  'Tile Inlay', 'Hand Carving', 'Upholstery Fabric', 'Glass', 'Reclaimed Wood'
];

export const FINISHES = [
  { n: 'Natural Oil', c: '#C8A06A', name: 'Natural Oil', code: '#C8A06A' },
  { n: 'Walnut Stain', c: '#6B4426', name: 'Walnut Stain', code: '#6B4426' },
  { n: 'Ebony Matt', c: '#231F1C', name: 'Ebony Matt', code: '#231F1C' },
  { n: 'Antique Brass', c: '#A98337', name: 'Antique Brass', code: '#A98337' },
  { n: 'Bone White', c: '#EFE7DA', name: 'Bone White', code: '#EFE7DA' },
  { n: 'Forest Lacquer', c: '#20402F', name: 'Forest Lacquer', code: '#20402F' },
  { n: 'Terracotta PU', c: '#B85735', name: 'Terracotta PU', code: '#B85735' },
  { n: 'Graphite Metal', c: '#4A4E54', name: 'Graphite Metal', code: '#4A4E54' }
];

export interface WpSeoData {
  provider?: string;
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  keywords?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  schema?: Record<string, any>;
}

export interface ProductItem {
  id: string;
  sku?: string;
  slug?: string;
  name: string;
  cat: string;
  catName: string;
  catSlugs?: string[];
  catNames?: string[];
  categories?: Array<{ id: number | string; name: string; slug: string }>;
  type: string;
  segment: string;
  segment2?: string;
  material: string;
  material2?: string;
  color?: string;
  availableColors?: string[];
  variations?: Array<{ id: number; sku?: string; price?: number; color: string; colorSlug?: string; image: string }>;
  attributes?: Record<string, string[]>;
  moq: number;
  lead: number;
  dims: [number, number, number] | string;
  packing?: string;
  leadTimeText?: string;
  priceNote?: string;
  price?: number;
  regularPrice?: number;
  salePrice?: number;
  currency?: string;
  currencySymbol?: string;
  badge?: 'New' | 'Best Seller' | 'Export Ready' | null;
  is_new?: boolean;
  onSale?: boolean;
  dateCreated?: string;
  image?: string;
  shortDescription?: string;
  description?: string;
  gallery?: string[];
  seo?: WpSeoData;
}

export function getProductSlug(p: { slug?: string; name?: string; id?: string }): string {
  if (p.slug && p.slug.trim()) return p.slug.trim().toLowerCase();
  if (p.name) {
    const clean = p.name
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (clean) return clean;
  }
  return p.id || 'product';
}

import productsSnapshot from './products-snapshot.json';

const rawSnapshotProducts: any[] = Array.isArray((productsSnapshot as any)?.products)
  ? (productsSnapshot as any).products
  : [];

export const MOCK_PRODUCTS: ProductItem[] = rawSnapshotProducts.length > 0
  ? rawSnapshotProducts.map((p: any) => {
      const cats = Array.isArray(p.categories) ? p.categories : [];
      const firstCat = cats[0];
      const catSlug = firstCat?.slug ? firstCat.slug.toLowerCase() : 'furniture';
      const catName = firstCat?.name || 'Furniture';
      const catSlugs = cats.map((c: any) => (c.slug ? c.slug.toLowerCase() : '')).filter(Boolean);
      if (!catSlugs.includes(catSlug)) catSlugs.push(catSlug);

      return {
        id: String(p.id).startsWith('ORB-') ? String(p.id) : `ORB-${p.id}`,
        sku: p.sku || `ORB-${p.id}`,
        slug: p.slug || getProductSlug({ name: p.name, id: `ORB-${p.id}` }),
        name: p.name,
        cat: catSlug,
        catName: catName,
        catSlugs: catSlugs.length > 0 ? catSlugs : [catSlug],
        type: p.subtype || p.type || 'Furniture',
        segment: p.segment || 'Hotel Guestroom',
        segment2: p.segment2 || 'Resort & Villa',
        material: p.material || 'Solid Wood',
        material2: p.material2 || '',
        moq: p.moq || 1,
        lead: p.leadTime || 21,
        dims: Array.isArray(p.dims) ? p.dims : [60, 60, 80],
        badge: p.badge || null,
        is_new: !!p.is_new,
        image: p.image || '/fallback-product.svg',
        gallery: Array.isArray(p.gallery) ? p.gallery : [],
        price: p.price || 0,
        regularPrice: p.regularPrice || 0,
        salePrice: p.salePrice || 0,
        currency: p.currency || 'INR',
        currencySymbol: p.currencySymbol || '₹',
        color: p.color || '',
        availableColors: Array.isArray(p.availableColors) ? p.availableColors : [],
        variations: Array.isArray(p.variations) ? p.variations : [],
      };
    })
  : [
      {
        id: 'ORB-1001',
        sku: 'ORB-1001',
        slug: 'marwar-dining-chair',
        name: 'Marwar Dining Chair',
        cat: 'seating',
        catName: 'Seating',
        catSlugs: ['seating'],
        type: 'Dining Chair',
        segment: 'Restaurant',
        segment2: 'Hotel Guestroom',
        material: 'Solid Teak',
        material2: 'Cane & Rattan',
        moq: 12,
        lead: 21,
        dims: [48, 52, 86],
        badge: 'Best Seller',
        image: '/categories/seating.jpg',
      },
    ];
