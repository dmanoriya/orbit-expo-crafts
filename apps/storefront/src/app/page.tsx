import React from 'react';
import { fetchWpStorefrontData, fetchWpHomepageData } from '../lib/wpCommerce';
import HomeClientView from './HomeClientView';
import { Metadata } from 'next';

export const revalidate = 0; // Force SSR dynamic rendering so reloads get fresh backend data instantly!

export async function generateMetadata(): Promise<Metadata> {
  const hpData = await fetchWpHomepageData();
  return {
    title: 'Orbit Expo Crafts | Bespoke Contract Furniture & Architectural Manufacturing',
    description: hpData.hero_lede || 'Direct factory contract furniture manufacturing in Udaipur & Jodhpur for luxury hospitality and commercial projects.',
  };
}

export default async function HomePage() {
  const [storefrontData, homepageData] = await Promise.all([
    fetchWpStorefrontData(),
    fetchWpHomepageData(),
  ]);

  return (
    <HomeClientView
      initialProducts={storefrontData.products}
      initialCategories={storefrontData.categories}
      initialHpData={homepageData}
      isWpConnected={storefrontData.isWpConnected}
    />
  );
}
