'use client';

import React from 'react';
import CollectionsClient from '../collections/CollectionsClient';
import { ProductItem } from '../../data/catalogData';
import { WpCategoryItem, WpColorItem } from '../../lib/wpCommerce';

export interface BestSellersClientProps {
  products?: ProductItem[];
  categories?: WpCategoryItem[];
  segments?: string[];
  materials?: string[];
  colors?: WpColorItem[];
  isWpConnected?: boolean;
}

export const BestSellersClient: React.FC<BestSellersClientProps> = ({
  products,
  categories,
  segments,
  materials,
  colors,
  isWpConnected,
}) => {
  return (
    <CollectionsClient
      basePath="/best-sellers"
      pageTitle="Bestselling Designs"
      pageEyebrow="CONTRACT ICONS & SIGNATURE PIECES"
      pageDescription="Our most specified contract furniture, handcrafted bone inlay consoles, solid timber tables, and architectural seating pieces commissioned for boutique hotels and luxury residences worldwide."
      defaultBadgeFilter="bestseller"
      initialProducts={products}
      initialCategories={categories}
      initialSegments={segments}
      initialMaterials={materials}
      initialColors={colors}
      isWpConnected={isWpConnected}
    />
  );
};

export default BestSellersClient;
