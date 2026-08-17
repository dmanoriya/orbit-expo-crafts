import { SDKConfig, Product, ProductListResponse, ProductCategory, ProductAttribute, Cart, CheckoutData, OrderResult, SEOData, StoreConfig } from '../../commerce-core/src';
import { RestClient } from '../../commerce-rest/src';
import { GraphQLClient } from '../../commerce-graphql/src';

export class CommerceSDK {
  private rest: RestClient;
  private graphql: GraphQLClient;
  private primaryTransport: 'rest' | 'graphql';

  constructor(config: SDKConfig) {
    this.rest = new RestClient(config.endpoint);
    this.graphql = new GraphQLClient(config.endpoint);
    this.primaryTransport = config.transport || 'rest';
  }

  public config = {
    get: async (): Promise<StoreConfig> => {
      try {
        if (this.primaryTransport === 'graphql') {
          return await this.graphql.getConfig();
        }
        return await this.rest.getConfig();
      } catch (err) {
        return await this.rest.getConfig();
      }
    },
  };

  public products = {
    list: async (params: Record<string, any> = {}): Promise<ProductListResponse> => {
      try {
        if (this.primaryTransport === 'graphql') {
          return await this.graphql.getProducts();
        }
        return await this.rest.getProducts(params);
      } catch (err) {
        return await this.rest.getProducts(params);
      }
    },
    getById: async (id: number): Promise<Product> => {
      return await this.rest.getProductById(id);
    },
    getBySlug: async (slug: string): Promise<Product> => {
      try {
        if (this.primaryTransport === 'graphql') {
          return await this.graphql.getProductBySlug(slug);
        }
        return await this.rest.getProductBySlug(slug);
      } catch (err) {
        return await this.rest.getProductBySlug(slug);
      }
    },
  };

  public categories = {
    list: async (): Promise<ProductCategory[]> => {
      return await this.rest.getCategories();
    },
  };

  public attributes = {
    list: async (): Promise<ProductAttribute[]> => {
      return await this.rest.getAttributes();
    },
  };

  public cart = {
    get: async (): Promise<Cart> => {
      return await this.rest.getCart();
    },
    addItem: async (productId: number, quantity = 1, variationId = 0, variation: Record<string, string> = {}): Promise<Cart> => {
      return await this.rest.addToCart(productId, quantity, variationId, variation);
    },
    updateItem: async (key: string, quantity: number): Promise<Cart> => {
      return await this.rest.updateCartItem(key, quantity);
    },
    removeItem: async (key: string): Promise<Cart> => {
      return await this.rest.removeCartItem(key);
    },
    clear: async (): Promise<Cart> => {
      return await this.rest.clearCart();
    },
  };

  public checkout = {
    get: async (): Promise<CheckoutData> => {
      return await this.rest.getCheckoutData();
    },
    placeOrder: async (orderData: any): Promise<OrderResult> => {
      return await this.rest.placeOrder(orderData);
    },
  };

  public customer = {
    login: async (u: string, p: string): Promise<any> => {
      return await this.rest.login(u, p);
    },
    register: async (e: string, p: string, f?: string, l?: string): Promise<any> => {
      return await this.rest.register(e, p, f, l);
    },
    logout: async (): Promise<any> => {
      return await this.rest.logout();
    },
    me: async (): Promise<any> => {
      return await this.rest.getCurrentCustomer();
    },
  };

  public seo = {
    get: async (id: number, type = 'post'): Promise<SEOData> => {
      return await this.rest.getSEO(id, type);
    },
  };
}

export function createCommerce(config: SDKConfig): CommerceSDK {
  return new CommerceSDK(config);
}

export * from '../../commerce-core/src';
