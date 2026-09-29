import React from 'react';
import type { Metadata } from 'next';
import { fetchBusinessPageConfig } from '../../lib/businessPages';
import BusinessPageLayout from '../../components/business/BusinessPageLayout';

import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export const revalidate = 60; // Next.js ISR on-demand + 60s fallback

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchBusinessPageConfig('suppliers-vendors');
  return fetchWpPageMetadata('suppliers-vendors', {
    title: page.seo?.title || `${page.tab_label} | Orbit Expo Crafts`,
    description: page.seo?.description || page.page_subtitle,
    canonical: 'https://orbitexpocrafts.com/suppliers-vendors',
    image: page.seo?.og_image || page.visual?.image_url || '/business/suppliers-vendors.jpeg',
    keywords: page.seo?.focus_keyword ? page.seo.focus_keyword.split(',').map((k) => k.trim()) : undefined,
  });
}

export default async function SuppliersVendorsPage() {
  const config = await fetchBusinessPageConfig('suppliers-vendors');

  return <BusinessPageLayout config={config} />;
}
