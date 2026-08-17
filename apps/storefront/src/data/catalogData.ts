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
  'Brass & Bronze', 'Stainless Steel', 'Bone Inlay', 'Marble & Stone', 'Terrazzo', 'Cane & Rattan', 'Rope Weave', 'Resin',
  'Tile Inlay', 'Hand Carving', 'Upholstery Fabric', 'Genuine Leather', 'Vegan Leather', 'Glass', 'Reclaimed Wood'
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

export interface ProductItem {
  id: string;
  sku?: string;
  name: string;
  cat: string;
  catName: string;
  catSlugs?: string[];
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
  badge?: 'New' | 'Best Seller' | 'Export Ready' | null;
  image?: string;
  shortDescription?: string;
  description?: string;
  gallery?: string[];
}

export const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: 'ORB-1001',
    sku: 'ORB-1001',
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
  {
    id: 'ORB-1002',
    sku: 'ORB-1002',
    name: 'Chittor Console Table',
    cat: 'tables',
    catName: 'Tables & Desks',
    catSlugs: ['tables'],
    type: 'Console Table',
    segment: 'Hotel Lobby',
    segment2: 'Resort & Villa',
    material: 'Bone Inlay',
    material2: 'Brass & Bronze',
    moq: 2,
    lead: 30,
    dims: [140, 40, 76],
    badge: null,
    image: '/categories/tables.jpg',
  },
  {
    id: 'ORB-1003',
    sku: 'ORB-1003',
    name: 'Amrai Velvet Sofa',
    cat: 'sofas',
    catName: 'Sofas & Lounge',
    catSlugs: ['sofas'],
    type: 'Three Seater',
    segment: 'Hotel Lobby',
    segment2: 'Bar & Nightclub',
    material: 'Upholstery Fabric',
    material2: 'Solid Acacia',
    moq: 2,
    lead: 25,
    dims: [210, 88, 80],
    badge: 'New',
    image: '/categories/sofas.jpg',
  },
  {
    id: 'ORB-1004',
    sku: 'ORB-1004',
    name: 'Jaisalmer Canopy Bed',
    cat: 'beds',
    catName: 'Beds & Bedroom',
    catSlugs: ['beds'],
    type: 'King Bed',
    segment: 'Hotel Guestroom',
    segment2: 'Resort & Villa',
    material: 'Solid Sheesham',
    material2: 'Brass & Bronze',
    moq: 4,
    lead: 35,
    dims: [198, 203, 210],
    badge: null,
    image: '/categories/beds.jpg',
  },
  {
    id: 'ORB-1005',
    sku: 'ORB-1005',
    name: 'Ranakpur Sideboard Cabinet',
    cat: 'storage',
    catName: 'Storage & Casegoods',
    catSlugs: ['storage'],
    type: 'Sideboard',
    segment: 'Restaurant',
    segment2: 'Hotel Guestroom',
    material: 'Solid Mango',
    material2: 'Hand Carving',
    moq: 3,
    lead: 28,
    dims: [160, 45, 85],
    badge: 'Best Seller',
    image: '/categories/storage.jpg',
  },
  {
    id: 'ORB-1006',
    sku: 'ORB-1006',
    name: 'Udaipur Brass Dome Pendant',
    cat: 'lighting',
    catName: 'Lighting',
    catSlugs: ['lighting'],
    type: 'Pendant',
    segment: 'Bar & Nightclub',
    segment2: 'Restaurant',
    material: 'Brass & Bronze',
    material2: 'MS / Powder Coated Metal',
    moq: 10,
    lead: 14,
    dims: [45, 45, 40],
    badge: null,
    image: '/categories/lighting.jpg',
  },
  {
    id: 'ORB-1007',
    sku: 'ORB-1007',
    name: 'Mehrangarh Outdoor Sofa',
    cat: 'outdoor',
    catName: 'Outdoor & Poolside',
    catSlugs: ['outdoor'],
    type: 'Outdoor Sofa',
    segment: 'Outdoor & Poolside',
    segment2: 'Resort & Villa',
    material: 'Rope Weave',
    material2: 'MS / Powder Coated Metal',
    moq: 6,
    lead: 24,
    dims: [180, 80, 72],
    badge: null,
    image: '/categories/outdoor.jpg',
  },
  {
    id: 'ORB-1008',
    sku: 'ORB-1008',
    name: 'Jaipur Carved Arch Mirror',
    cat: 'decor',
    catName: 'Decor & Mirrors',
    catSlugs: ['decor'],
    type: 'Mirror',
    segment: 'Hotel Guestroom',
    segment2: 'Hotel Lobby',
    material: 'Hand Carving',
    material2: 'Glass',
    moq: 5,
    lead: 15,
    dims: [90, 5, 150],
    badge: null,
    image: '/categories/decor.jpg',
  },
];
