export interface ProductVariation {
  id: number;
  sku: string;
  price: number;
  regularPrice: number;
  inStock: boolean;
  attributes: Record<string, string>;
  image: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  parent?: number;
  image?: string;
}

export interface ProductAttributeOption {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  options: ProductAttributeOption[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  type: string;
  sku: string;
  price: number;
  regularPrice: number;
  salePrice: number;
  onSale: boolean;
  stockStatus: string;
  inStock: boolean;
  shortDescription: string;
  description?: string;
  image: string;
  gallery: string[];
  categories: ProductCategory[];
  variations?: ProductVariation[];
  averageRating: number;
  ratingCount: number;
  seo?: any;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}
