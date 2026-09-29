import React from 'react';
import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';
import { CartClientView } from './CartClientView';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('cart', {
    title: 'Review Shortlisted Specifications | Orbit Expo Crafts',
    description: 'Review your commercial furniture specifications, batch quantities, export crate volume estimates, and proceed to booking.',
    canonical: 'https://orbitexpocrafts.com/cart',
  });
}

export default function CartPage() {
  return <CartClientView />;
}
