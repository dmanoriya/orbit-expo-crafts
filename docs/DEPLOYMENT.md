# Orbit Expo Crafts — Production Deployment Guide

## 1. WordPress Backend Deployment

1. **Plugin Installation**:
   - Upload the `headless-commerce-core.zip` plugin file or copy the folder `wordpress/headless-commerce-core` to your WordPress server under `/wp-content/plugins/`.
   - Log in to your WordPress Dashboard (`/wp-admin`) -> **Plugins** -> **Installed Plugins** -> Activate **Headless Commerce Core**.

2. **Plugin Configuration**:
   - Go to **Headless Commerce** -> **Settings** in the WordPress Admin sidebar.
   - **Frontend Store URL**: Enter your Next.js storefront production domain (e.g. `https://orbitexpocrafts.com`).
   - Save changes. This automatically sets up CORS security, RankMath/Yoast SEO REST endpoints, and custom form submission handlers.

---

## 2. Next.js Storefront Deployment (Vercel / Netlify / VPS)

### Deploying to Vercel (Recommended):

1. **Connect GitHub Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import your GitHub repository: `dmanoriya/orbit-expo-crafts`.
   - Select **Root Directory**: `apps/storefront` (or keep `./` with Root Directory set to `apps/storefront`).
   - Build Command: `npx turbo build` (or `pnpm build`).
   - Output Directory: `.next`.

2. **Environment Variables**:
   In your Vercel Project Settings -> **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-domain.com
   NEXT_PUBLIC_SITE_URL=https://your-storefront-domain.com
   ```

3. **Click Deploy**. Vercel will build and deploy your storefront.

---

## 3. GitHub Repository Link
- Repository URL: [https://github.com/dmanoriya/orbit-expo-crafts](https://github.com/dmanoriya/orbit-expo-crafts)
