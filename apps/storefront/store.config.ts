import { createCommerce } from '@company/commerce-sdk';

export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'Aura Luxe Commerce',
  description: 'High-Performance Headless WooCommerce Commerce Platform',
  wordpressUrl: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080',
  transport: (process.env.NEXT_PUBLIC_COMMERCE_TRANSPORT as 'rest' | 'graphql') || 'rest',
  currency: 'USD',
  currencySymbol: '$',
  supportEmail: 'support@auraluxe.com',
  phone: '+1 (800) 555-AURA',
};

// Global Commerce SDK instance initialized for the storefront
export const commerce = createCommerce({
  endpoint: storeConfig.wordpressUrl,
  transport: storeConfig.transport,
});
