import React from 'react';
import type { Metadata } from 'next';
import { fetchBusinessPageConfig } from '../../lib/businessPages';
import BusinessPageLayout from '../../components/business/BusinessPageLayout';

import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchBusinessPageConfig('influencers-marketing');
  return fetchWpPageMetadata('influencers-marketing', {
    title: page.seo?.title || `${page.tab_label} | Orbit Expo Crafts`,
    description: page.seo?.description || page.page_subtitle,
    canonical: 'https://orbitexpocrafts.com/influencers-marketing',
    image: page.seo?.og_image || page.visual?.image_url || '/business/influencers-marketing.jpeg',
    keywords: page.seo?.focus_keyword ? page.seo.focus_keyword.split(',').map((k) => k.trim()) : undefined,
  });
}

export default async function InfluencersMarketingPage() {
  const config = await fetchBusinessPageConfig('influencers-marketing');

  return <BusinessPageLayout config={config} />;
}
