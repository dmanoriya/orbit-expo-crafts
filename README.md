# Orbit Expo Crafts — Headless Commerce Monorepo

High-performance, luxury architectural furniture & contract specification catalog built with **Next.js 15 (App Router)** and **WooCommerce Headless API**.

## 🚀 Repository Link
GitHub: [https://github.com/dmanoriya/orbit-expo-crafts](https://github.com/dmanoriya/orbit-expo-crafts)

## 🛠️ Monorepo Architecture
- `apps/storefront`: Next.js 15 App Router Headless Storefront & Catalog
- `wordpress/headless-commerce-core`: Native WooCommerce Headless Core Plugin
- `packages/commerce-core`: Shared core types, cart logic & REST adapters
- `packages/commerce-rest`: High-speed REST API client

## ⚙️ Quick Start (Local Development)

```bash
# 1. Install dependencies
pnpm install

# 2. Run Next.js storefront dev server (port 3001)
pnpm --filter storefront dev --port 3001

# 3. Build for production
npx turbo build
```

## 📦 Production Deployment
For complete production deployment instructions for Vercel, Netlify, and WordPress, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
