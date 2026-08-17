# Production Deployment Guide

## 1. WordPress Backend Deployment
1. Upload `wordpress/headless-commerce-core` to `wp-content/plugins/headless-commerce-core`.
2. Activate the plugin in WordPress Admin.
3. Set your Store Mode (e.g. `HEADLESS_STORE` or `HEADLESS_CATALOG`).
4. Enter your Next.js frontend URL for CORS headers.
5. Setup Revalidation Webhook URL (e.g. `https://storefront.com/api/revalidate`) and Secret.

## 2. Next.js Storefront Deployment
Deploy the storefront to Vercel, Netlify, or any Node.js hosting server.

Environment Variables:
```env
NEXT_PUBLIC_STORE_NAME="Aura Luxe Commerce"
NEXT_PUBLIC_WORDPRESS_URL="https://your-wordpress-domain.com"
NEXT_PUBLIC_COMMERCE_TRANSPORT="rest"
```
