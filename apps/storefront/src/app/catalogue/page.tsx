import React, { Suspense } from 'react';
import { Metadata } from 'next';
import CatalogueClient from './CatalogueClient';

export const metadata: Metadata = {
  title: 'Contract Furniture Catalogue | ORBIT Expo Crafts',
  description: 'Browse our complete catalog of contract seating, tables, sofas, beds, casegoods, lighting, and outdoor furniture for hotels, resorts, and commercial projects.',
  alternates: {
    canonical: 'http://127.0.0.1:3001/catalogue',
  },
  openGraph: {
    title: 'Contract Furniture Catalogue | ORBIT Expo Crafts',
    description: 'Bespoke contract furniture manufacturing for commercial and hospitality projects.',
    url: 'http://127.0.0.1:3001/catalogue',
    siteName: 'ORBIT Expo Crafts',
  },
};

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: '60px 28px' }}>Loading Catalogue...</div>}>
      <CatalogueClient />
    </Suspense>
  );
}
