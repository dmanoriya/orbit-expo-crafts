# Reusable High-Performance Headless WooCommerce Commerce Platform

Production-ready, reusable headless WooCommerce architecture monorepo designed to power multiple Next.js commerce projects while keeping WordPress and WooCommerce as the authoritative source of truth.

---

## Key Highlights

- **WooCommerce Core Authority**: Preserves native WooCommerce logic for Products, Cart (`WC_Cart`), Checkout (`WC_Checkout`), Payments (Stripe, PayPal, COD, etc.), Taxes, Shipping, and Extensions.
- **4 Store Modes**:
  - `FULL_STORE`: Native WordPress & WooCommerce theme experience.
  - `CATALOG`: Native catalog mode disabling purchasing and showing quote inquiries.
  - `HEADLESS_STORE`: Next.js 15 decoupled presentation layer with cart, checkout, auth, and orders.
  - `HEADLESS_CATALOG`: Next.js catalog presentation layer without checkout/purchasing.
- **Rank Math & Yoast SEO Synchronization**: Automatic extraction of SEO title, description, canonical, robots, OG metadata, and JSON-LD structured data into Next.js Metadata API.
- **TypeScript Commerce SDK (`@company/commerce-sdk`)**: Framework-independent SDK with transparent REST & GraphQL transport adapters and automatic fallback.
- **High-Performance Caching**: Object cache, Redis invalidation hooks, and Next.js revalidation webhooks.

---

## Monorepo Architecture

```text
headless-commerce/
│
├── apps/
│   └── storefront/              # Next.js 15 App Router Storefront
│
├── packages/
│   ├── commerce-core/           # Domain models, types & store config
│   ├── commerce-rest/           # /wp-json/hcc/v1/ REST transport client
│   ├── commerce-graphql/        # GraphQL transport client & queries
│   ├── commerce-sdk/            # Unified TS Commerce SDK
│   └── commerce-seo/            # Next.js Metadata API & JSON-LD generator
│
└── wordpress/
    └── headless-commerce-core/  # Custom WordPress/WooCommerce PHP Plugin
```

---

## Quick Start Guide

### 1. WordPress Backend Setup
1. Copy `wordpress/headless-commerce-core` to your WordPress `wp-content/plugins/` directory.
2. Activate **Headless Commerce Core** in WordPress Admin -> Plugins.
3. Configure Store Mode, Next.js URL, and Webhooks in **Headless Commerce** admin page.

### 2. Monorepo & Next.js Storefront Setup
```bash
# Install dependencies across all workspace packages
npm install

# Build all monorepo TypeScript packages
npm run build

# Start Next.js Storefront in development mode
npm run dev:storefront
```

---

## SDK Usage Example

```typescript
import { createCommerce } from '@company/commerce-sdk';

const commerce = createCommerce({
  endpoint: 'https://backend-wordpress.com',
  transport: 'rest', // 'rest' | 'graphql'
});

// Fetch Store Configuration & Mode
const config = await commerce.config.get();

// Fetch Products List
const { products } = await commerce.products.list({ per_page: 12 });

// Add Item to Cart
const cart = await commerce.cart.addItem(productId, 1);

// Get Normalized SEO Metadata
const seo = await commerce.seo.get(productId, 'post');
```

---

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
