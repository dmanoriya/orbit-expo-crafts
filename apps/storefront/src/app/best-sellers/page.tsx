import { Metadata } from 'next';
import { fetchWpStorefrontData } from '../../lib/wpCommerce';
import { BestSellersClient } from './BestSellersClient';

export const metadata: Metadata = {
  title: 'Bestsellers & Contract Icons — ORBIT Expo Crafts',
  description: 'Explore our most popular and frequently specified contract furniture, bone inlay consoles, teak tables, and handcrafted hospitality pieces.',
};

export const revalidate = 60;

export default async function BestSellersPage() {
  const data = await fetchWpStorefrontData();

  return (
    <BestSellersClient
      products={data.products}
      categories={data.categories}
      segments={data.segments}
      materials={data.materials}
      colors={data.colors}
      isWpConnected={data.isWpConnected}
    />
  );
}
