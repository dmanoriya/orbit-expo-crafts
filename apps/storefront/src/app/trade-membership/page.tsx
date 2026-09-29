import React from 'react';
import type { Metadata } from 'next';
import TradeMembershipClient from './TradeMembershipClient';

import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('trade-membership', {
    title: 'Trade Membership & Architect Program | Orbit Expo Crafts',
    description:
      'Exclusive trade pricing, custom sample boxes, prioritized factory lead times, and dedicated project management for registered architects, interior designers, and procurement managers.',
    canonical: 'https://orbitexpocrafts.com/trade-membership',
    image: '/business/trade-hero-desk.jpg',
    keywords: [
      'Trade Program',
      'Interior Designers Membership',
      'Architects Furniture Sourcing',
      'Wholesale Furniture Trade',
      'Custom Furniture Manufacturing',
      'CAD 3D Models Furniture',
      'Hospitality Procurement',
      'Bespoke Wood Furniture Trade',
    ],
  });
}

export default function TradeMembershipPage() {
  return <TradeMembershipClient />;
}
