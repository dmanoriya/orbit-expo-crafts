import React from 'react';
import type { Metadata } from 'next';
import TradeMembershipClient from './TradeMembershipClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Trade Program | For Interior Designers & Architects | Orbit Expo Crafts',
  description:
    'Join the Orbit Expo Crafts Trade Program. Long-term alliance-based membership for licensed interior designers, architects, decorators, and hospitality procurement professionals with exclusive trade pricing, custom manufacturing, CAD assets, and swatch kits.',
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
  alternates: {
    canonical: 'https://orbitexpocrafts.com/trade-membership',
  },
  openGraph: {
    title: 'Trade Program for Interior Designers & Architects | Orbit Expo Crafts',
    description:
      'Access wholesale trade pricing, bespoke customization, 3D CAD assets, and physical swatch kits. Apply for long-term trade alliance membership.',
    url: 'https://orbitexpocrafts.com/trade-membership',
    siteName: 'Orbit Expo Crafts',
    images: [
      {
        url: '/business/trade-hero-desk.jpg',
        width: 1200,
        height: 630,
        alt: 'Orbit Expo Crafts Trade Membership Program',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trade Program for Interior Designers & Architects | Orbit Expo Crafts',
    description:
      'Access wholesale trade pricing, bespoke customization, 3D CAD assets, and physical swatch kits. Apply for long-term trade alliance membership.',
    images: ['/business/trade-hero-desk.jpg'],
  },
};

export default function TradeMembershipPage() {
  return <TradeMembershipClient />;
}
