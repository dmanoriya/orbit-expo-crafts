import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchWpStorefrontData } from '../../lib/wpCommerce';
import { BestSellersClient } from './BestSellersClient';

export const metadata: Metadata = {
  title: 'The Pieces Everyone Loves — ORBIT Expo Crafts',
  description: 'A curated selection of our most sought-after furniture and décor. Crafted in solid wood and thoughtfully detailed with natural textures, each piece brings character, warmth and enduring style to contemporary spaces.',
};

export const revalidate = 60;

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
