import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchWpStorefrontData, fetchWpPageMetadata } from '../../lib/wpCommerce';
import { BestSellersClient } from './BestSellersClient';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('best-sellers', {
    title: 'Best Selling Contract Furniture | Orbit Expo Crafts',
    description: 'Explore our most sought-after contract furniture and architectural décor for luxury hospitality and commercial projects.',
    canonical: 'https://orbitexpocrafts.com/best-sellers',
  });
}

export default async function BestSellersPage() {
  const data = await fetchWpStorefrontData();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" />}>
      <BestSellersClient
        products={data.products}
        categories={data.categories}
        segments={data.segments}
        materials={data.materials}
        colors={data.colors}
        isWpConnected={data.isWpConnected}
      />
    </Suspense>
  );
}
