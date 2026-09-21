'use client';

import React from 'react';
import CollectionsClient from '../CollectionsClient';
import { ProductItem } from '../../../data/catalogData';
import { WpCategoryItem, WpColorItem } from '../../../lib/wpCommerce';

export interface NewArrivalsClientProps {
  products?: ProductItem[];
  categories?: WpCategoryItem[];
  segments?: string[];
  materials?: string[];
  colors?: WpColorItem[];
  isWpConnected?: boolean;
}

export const NewArrivalsClient: React.FC<NewArrivalsClientProps> = ({
  products,
  categories,
  segments,
  materials,
  colors,
  isWpConnected,
}) => {
  return (
    <CollectionsClient
      basePath="/collections/new-arrivals"
      pageTitle="New Arrivals"
      pageDescription="Discover the latest furniture, lighting, and home décor to bring fresh style and comfort to your space."
      defaultBadgeFilter="new"
      initialProducts={products}
      initialCategories={categories}
      initialSegments={segments}
      initialMaterials={materials}
      initialColors={colors}
      isWpConnected={isWpConnected}
    />
  );
};

export default NewArrivalsClient;
