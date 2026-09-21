import { createCommerce } from '@company/commerce-sdk';

export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'Orbit Expo Crafts',
  description: 'Bespoke Contract & Trade Furniture Handcrafted in Rajasthan',
  wordpressUrl: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://admin.orbitexpocrafts.com',
  transport: (process.env.NEXT_PUBLIC_COMMERCE_TRANSPORT as 'rest' | 'graphql') || 'rest',
  currency: 'INR',
  currencySymbol: '₹',
  supportEmail: 'sales@orbitexpocrafts.com',
  phone: '+91 99280 22151',
};

// Global Commerce SDK instance initialized for the storefront
export const commerce = createCommerce({
  endpoint: storeConfig.wordpressUrl,
  transport: storeConfig.transport,
});
