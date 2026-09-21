import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchWpStorefrontData } from '../../../lib/wpCommerce';
import { NewArrivalsClient } from './NewArrivalsClient';

export const metadata: Metadata = {
  title: 'New Arrivals — ORBIT Expo Crafts',
  description: 'Discover the latest furniture, lighting, and home décor to bring fresh style and comfort to your space.',
  alternates: {
    canonical: 'https://orbitexpocrafts.com/collections/new-arrivals',
  },
  openGraph: {
    title: 'New Arrivals — ORBIT Expo Crafts',
    description: 'Discover the latest furniture, lighting, and home décor to bring fresh style and comfort to your space.',
    url: 'https://orbitexpocrafts.com/collections/new-arrivals',
    siteName: 'ORBIT Expo Crafts',
    type: 'website',
  },
};

export const revalidate = 60;

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
