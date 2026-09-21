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
      pageTitle="The Pieces Everyone Loves"
      pageDescription="A curated selection of our most sought-after furniture and décor. Crafted in solid wood and thoughtfully detailed with natural textures, each piece brings character, warmth and enduring style to contemporary spaces."
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
