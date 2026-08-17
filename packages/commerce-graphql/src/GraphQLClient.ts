import { Product, ProductListResponse, SEOData, StoreConfig } from '@company/commerce-core';

export class GraphQLClient {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint.replace(/\/$/, '') + '/wp-json/hcc/v1/graphql';
  }

  async query<T>(queryStr: string, variables: Record<string, any> = {}): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: queryStr, variables }),
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || json.errors) {
      throw new Error(json.errors?.[0]?.message || `GraphQL Error: ${res.status}`);
    }
    return json.data as T;
  }

  async getConfig(): Promise<StoreConfig> {
    const res = await this.query<{ storeConfig: StoreConfig }>(`
      query GetStoreConfig {
        storeConfig {
          name
          storeMode
          purchasingEnabled
          currency
        }
      }
    `);
    return res.storeConfig;
  }

  async getProducts(): Promise<ProductListResponse> {
    const res = await this.query<{ products: Product[] }>(`
      query GetProducts {
        products {
          id
          name
          slug
          price
          stockStatus
          image
        }
      }
    `);
    return {
      products: res.products || [],
      total: res.products?.length || 0,
      pages: 1,
      page: 1,
      per_page: 12,
    };
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const res = await this.query<{ product: Product }>(
      `
      query GetProductBySlug($slug: String!) {
        product(slug: $slug) {
          id
          name
          slug
          price
          description
          stockStatus
          image
          seo {
            title
            description
            canonical
            robots
          }
        }
      }
    `,
      { slug }
    );
    return res.product;
  }
}
