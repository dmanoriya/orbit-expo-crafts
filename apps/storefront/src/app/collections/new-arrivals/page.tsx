import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchWpStorefrontData, fetchWpPageMetadata } from '../../../lib/wpCommerce';
import { NewArrivalsClient } from './NewArrivalsClient';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('new-arrivals', {
    title: 'New Arrivals | Orbit Expo Crafts',
    description: 'Discover the latest handcrafted furniture, lighting, and architectural décor from our Rajasthan workshops.',
    canonical: 'https://orbitexpocrafts.com/collections/new-arrivals',
  });
}

export default async function NewArrivalsPage() {
  const data = await fetchWpStorefrontData();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" />}>
      <NewArrivalsClient
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
