export interface CartItem {
  key: string;
  productId: number;
  variationId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  total: number;
  image: string;
  variation?: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  taxTotal: number;
  shippingTotal: number;
  appliedCoupons: string[];
  currency: string;
}
