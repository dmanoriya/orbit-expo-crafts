# 🛠️ Hostinger Future Update & Deployment Guide

This guide explains how to make local changes to your Next.js storefront or WooCommerce plugin and deploy them to Hostinger without any errors.

---

## 🛠️ Step 1: Local Development Workflow

When a client requests changes:

1. **Open your project terminal**:
   ```bash
   cd "/Users/divyanshu/Documents/antigravity projects/woo-catalog"
   ```

2. **Start Local Development Server**:
   ```bash
   pnpm dev:storefront
   ```
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Make your code/UI changes in `apps/storefront/src/...`.

---

## 🗜️ Step 2: Single-Command Automated Packaging

When you are ready to deploy your changes to production:

Run this **one command** in your terminal:

```bash
pnpm package:hostinger
```

### What this command automatically does for you:
1. Builds the Next.js Storefront app.
2. Formats standalone production files for Hostinger (`server.js` socket compatibility).
3. Bundles all required runtime Node.js modules (`next`, `@next/env`, `react`, `react-dom`, `sharp`).
4. Prunes source maps and build caches to keep the ZIP light (~170MB).
5. Generates both updated ZIP archives:
   - **Storefront**: `hostinger-nextjs-storefront.zip`
   - **WordPress Plugin**: `wordpress/headless-commerce-core.zip`

---

## 🚀 Step 3: Deploy to Production

### 1. Upload Storefront ZIP to Hostinger:
1. Open **Hostinger hPanel** -> **Websites** -> **`orbitexpocrafts.com`** -> **Deployments** -> **Settings and redeploy**.
2. Upload `hostinger-nextjs-storefront.zip`.
3. Confirm settings:
   - **Framework preset**: `Other`
   - **Node version**: `20.x` or `22.x`
   - **Build command**: `None`
   - **Package Manager**: `npm`
   - **Entry file**: `server.js`
4. Click **Save and redeploy**.

---

### 2. Upload Plugin to WordPress (if WooCommerce/Plugin changes were made):
1. Go to `https://admin.orbitexpocrafts.com/wp-admin` -> **Plugins** -> **Add New** -> **Upload Plugin**.
2. Select `wordpress/headless-commerce-core.zip` -> Click **Install / Replace**.

---

## ⚡ Environment Variables Reference (Hostinger hPanel)

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_WORDPRESS_URL` | `https://admin.orbitexpocrafts.com` |
| `REVALIDATE_SECRET` | `orbit_expo_crafts_secret_key_2026` |
| `NODE_ENV` | `production` |
