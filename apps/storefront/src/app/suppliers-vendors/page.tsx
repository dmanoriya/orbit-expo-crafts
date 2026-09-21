import React from 'react';
import type { Metadata } from 'next';
import { fetchBusinessPageConfig } from '../../lib/businessPages';
import BusinessPageLayout from '../../components/business/BusinessPageLayout';

export const revalidate = 60; // Next.js ISR on-demand + 60s fallback

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchBusinessPageConfig('suppliers-vendors');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitexpocrafts.com';
  const canonical = page.seo?.canonical_url
    ? (page.seo.canonical_url.startsWith('http') ? page.seo.canonical_url : `${siteUrl}${page.seo.canonical_url.startsWith('/') ? '' : '/'}${page.seo.canonical_url}`)
    : `${siteUrl}/suppliers-vendors`;

  const ogImage = page.seo?.og_image || page.visual?.image_url || '/business/suppliers-vendors.jpeg';
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;

  return {
    title: page.seo?.title || `${page.tab_label} | Orbit Expo Crafts`,
    description: page.seo?.description || page.page_subtitle,
    keywords: page.seo?.focus_keyword ? page.seo.focus_keyword.split(',').map((k) => k.trim()) : undefined,
    alternates: {
      canonical: canonical,
    },
    openGraph: {
      title: page.seo?.title || page.page_title,
      description: page.seo?.description || page.page_subtitle,
      url: canonical,
      siteName: 'Orbit Expo Crafts',
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: page.page_title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.seo?.title || page.page_title,
      description: page.seo?.description || page.page_subtitle,
      images: [fullOgImage],
    },
    robots: page.seo?.robots || 'index, follow',
  };
}

export default async function SuppliersVendorsPage() {
  const config = await fetchBusinessPageConfig('suppliers-vendors');

  return <BusinessPageLayout config={config} />;
}
