export interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface CheckoutData {
  paymentGateways: PaymentGateway[];
  cartSubtotal: number;
  cartTotal: number;
  currency: string;
}

export interface OrderResult {
  orderId: number;
  orderKey: string;
  status: string;
  total: number;
  currency: string;
  checkoutUrl: string;
}
