import React from 'react';
import { Metadata } from 'next';
import CatalogueClient from '../CatalogueClient';
import { CATEGORIES } from '../../../data/catalogData';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const catObj = CATEGORIES.find((c) => c.id.toLowerCase() === category.toLowerCase());
  const title = catObj ? `${catObj.name} Catalogue | ORBIT Expo Crafts` : `Furniture Catalogue | ORBIT Expo Crafts`;
  const description = catObj
    ? `Explore bespoke B2B ${catObj.name.toLowerCase()} manufactured in Rajasthan for hotels, resorts, restaurants, and export projects.`
    : `Bespoke contract furniture manufacturing for commercial and hospitality projects.`;

  return {
    title,
    description,
    alternates: {
      canonical: `http://127.0.0.1:3001/catalogue/${category}`,
    },
    openGraph: {
      title,
      description,
      url: `http://127.0.0.1:3001/catalogue/${category}`,
      siteName: 'ORBIT Expo Crafts',
    },
  };
}

export default async function CategorySEOPage({ params }: CategoryPageProps) {
  const { category } = await params;
  return <CatalogueClient initialCategory={category} />;
}
