import { NextResponse } from 'next/server';

export async function GET() {
  const wpBaseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://woo-catalog-nextjs.local';
  try {
    const res = await fetch(`${wpBaseUrl}/wp-json/hcc/v1/attributes`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error('Error fetching attributes proxy:', err);
  }

  // Fallback default attributes matching reference prototype
  return NextResponse.json({
    success: true,
    data: {
      segments: [
        'Hotel Guestroom', 'Hotel Lobby', 'Restaurant', 'Café', 'Bar & Nightclub', 'Banquet & Events',
        'Resort & Villa', 'Corporate Office', 'Co-working', 'Retail Store', 'Healthcare', 'Education', 'Residential',
        'Outdoor & Poolside', 'Airport & Transit', 'Export / Wholesale',
      ],
      materials: [
        'Solid Sheesham', 'Solid Teak', 'Solid Mango', 'Solid Acacia', 'Engineered Panel', 'MS / Powder Coated Metal',
        'Brass & Bronze', 'Stainless Steel', 'Bone Inlay', 'Marble & Stone', 'Terrazzo', 'Cane & Rattan', 'Rope Weave', 'Resin',
        'Tile Inlay', 'Hand Carving', 'Upholstery Fabric', 'Genuine Leather', 'Vegan Leather', 'Glass', 'Reclaimed Wood',
      ],
      colors: [
        { name: 'Natural Oil', code: '#C8A06A' },
        { name: 'Walnut Stain', code: '#6B4426' },
        { name: 'Ebony Matt', code: '#231F1C' },
        { name: 'Antique Brass', code: '#A98337' },
        { name: 'Bone White', code: '#EFE7DA' },
        { name: 'Forest Lacquer', code: '#20402F' },
        { name: 'Terracotta PU', code: '#B85735' },
        { name: 'Graphite Metal', code: '#4A4E54' },
      ],
    },
  });
}
