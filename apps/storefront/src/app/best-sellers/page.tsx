import React from 'react';
import { MOCK_PRODUCTS } from '../../data/catalogData';
import { fetchWpStorefrontData } from '../../lib/wpCommerce';
import { BestSellersClient } from './BestSellersClient';

export const metadata = {
  title: 'Bestsellers & Contract Icons — ORBIT Expo Crafts',
  description: 'Explore our most popular and frequently specified contract furniture, bone inlay consoles, teak tables, and handcrafted hospitality pieces.',
};

export const revalidate = 60;

export default async function BestSellersPage() {
  const { products: wpProducts } = await fetchWpStorefrontData();
  const allProducts = wpProducts && wpProducts.length > 0 ? wpProducts : MOCK_PRODUCTS;

  return <BestSellersClient products={allProducts} />;
}
