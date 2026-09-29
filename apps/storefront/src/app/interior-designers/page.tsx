import React from 'react';
import type { Metadata } from 'next';
import { fetchBusinessPageConfig } from '../../lib/businessPages';
import BusinessPageLayout from '../../components/business/BusinessPageLayout';

import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchBusinessPageConfig('interior-designers');
  return fetchWpPageMetadata('interior-designers', {
    title: page.seo?.title || `${page.tab_label} | Orbit Expo Crafts`,
    description: page.seo?.description || page.page_subtitle,
    canonical: 'https://orbitexpocrafts.com/interior-designers',
    image: page.seo?.og_image || page.visual?.image_url || '/business/architects-interior-designers.jpeg',
    keywords: page.seo?.focus_keyword ? page.seo.focus_keyword.split(',').map((k) => k.trim()) : undefined,
  });
}

export default async function InteriorDesignersPage() {
  const config = await fetchBusinessPageConfig('interior-designers');

  return <BusinessPageLayout config={config} />;
}
