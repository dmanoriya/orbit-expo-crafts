import { Product, ProductListResponse, ProductCategory, ProductAttribute, Cart, CheckoutData, OrderResult, SEOData, StoreConfig } from '@company/commerce-core';

export class RestClient {
  private baseUrl: string;

  constructor(endpoint: string) {
    this.baseUrl = endpoint.replace(/\/$/, '') + '/wp-json/hcc/v1';
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `REST Error: ${res.status}`);
    }
    return json.data as T;
  }

  async getConfig(): Promise<StoreConfig> {
    return this.request<StoreConfig>('/config');
  }

  async getProducts(params: Record<string, any> = {}): Promise<ProductListResponse> {
    const query = new URLSearchParams(params).toString();
    return this.request<ProductListResponse>(`/products?${query}`);
  }

  async getProductById(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<Product> {
    return this.request<Product>(`/products/slug/${slug}`);
  }

  async getCategories(): Promise<ProductCategory[]> {
    return this.request<ProductCategory[]>('/categories');
  }

  async getAttributes(): Promise<ProductAttribute[]> {
    return this.request<ProductAttribute[]>('/attributes');
  }

  async getCart(): Promise<Cart> {
    return this.request<Cart>('/cart');
  }

  async addToCart(productId: number, quantity = 1, variationId = 0, variation: Record<string, string> = {}): Promise<Cart> {
    return this.request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, variationId, variation }),
    });
  }

  async updateCartItem(key: string, quantity: number): Promise<Cart> {
    return this.request<Cart>(`/cart/items/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(key: string): Promise<Cart> {
    return this.request<Cart>(`/cart/items/${key}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<Cart> {
    return this.request<Cart>('/cart', {
      method: 'DELETE',
    });
  }

  async getCheckoutData(): Promise<CheckoutData> {
    return this.request<CheckoutData>('/checkout');
  }

  async placeOrder(orderData: any): Promise<OrderResult> {
    return this.request<OrderResult>('/checkout', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async login(username: string, password: string): Promise<any> {
    return this.request<any>('/customers/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<any> {
    return this.request<any>('/customers/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async logout(): Promise<any> {
    return this.request<any>('/customers/logout', {
      method: 'POST',
    });
  }

  async getCurrentCustomer(): Promise<any> {
    return this.request<any>('/customers/me');
  }

  async getSEO(id: number, type = 'post'): Promise<SEOData> {
    return this.request<SEOData>(`/seo?id=${id}&type=${type}`);
  }
}
