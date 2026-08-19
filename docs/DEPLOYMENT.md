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

### Deploying to Hostinger (Node.js Web Hosting / VPS):

1. **Upload Hostinger Zip File**:
   - Download the generated `hostinger-nextjs-storefront.zip` archive.
   - In Hostinger hPanel -> **Files** -> **File Manager** (or SSH), upload `hostinger-nextjs-storefront.zip` to your Node.js application directory (e.g. `public_html` or `/home/username/nodeapp`).
   - Extract `hostinger-nextjs-storefront.zip`.

2. **Environment Variables**:
   - Open `.env` inside the extracted folder:
     ```env
     NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-domain.com
     NEXT_PUBLIC_SITE_URL=https://your-storefront-domain.com
     PORT=3000
     ```

3. **Hostinger Node.js Setup**:
   - In Hostinger hPanel -> **Node.js**:
     - **Application Root**: `/` (or directory where `server.js` is located)
     - **Application Startup File**: `server.js`
     - **Node.js Version**: 18.x, 20.x, or 22.x
   - Click **Start Application** / **Restart Application**.

---

## 3. GitHub Repository Link
- Repository URL: [https://github.com/dmanoriya/orbit-expo-crafts](https://github.com/dmanoriya/orbit-expo-crafts)
