#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🚀 Building Orbit Expo Crafts Hostinger Production Package in $ROOT_DIR..."

cd "$ROOT_DIR"

# 1. Build Next.js Storefront App
echo "📦 Step 1/5: Building Next.js Storefront..."
pnpm --filter storefront build

# 2. Sync Standalone Output & Assets to dist-hostinger
echo "📂 Step 2/5: Synchronizing Standalone Build Files..."
mkdir -p "$ROOT_DIR/dist-hostinger/apps/storefront"

rm -rf "$ROOT_DIR/dist-hostinger/apps/storefront/.next"
cp -rL "$ROOT_DIR/apps/storefront/.next/standalone/apps/storefront/.next" "$ROOT_DIR/dist-hostinger/apps/storefront/"
cp -rL "$ROOT_DIR/apps/storefront/.next/static" "$ROOT_DIR/dist-hostinger/apps/storefront/.next/"
cp -rL "$ROOT_DIR/apps/storefront/public" "$ROOT_DIR/dist-hostinger/apps/storefront/"
mkdir -p "$ROOT_DIR/dist-hostinger/apps/storefront/public/_next"
cp -rL "$ROOT_DIR/apps/storefront/.next/static" "$ROOT_DIR/dist-hostinger/apps/storefront/public/_next/"

# 3. Ensure Runtime Node.js Modules Are Dereferenced
echo "🔧 Step 3/5: Dereferencing Node.js Runtime Dependencies..."
mkdir -p "$ROOT_DIR/dist-hostinger/node_modules"
mkdir -p "$ROOT_DIR/dist-hostinger/apps/storefront/node_modules"

cp -rL "$ROOT_DIR/node_modules/next" "$ROOT_DIR/dist-hostinger/node_modules/" 2>/dev/null || true
cp -rL "$ROOT_DIR/node_modules/next" "$ROOT_DIR/dist-hostinger/apps/storefront/node_modules/" 2>/dev/null || true

# 4. Prune Unnecessary Build Cache and Source Maps for Small ZIP Size
echo "✂️ Step 4/5: Pruning Build Caches and Source Maps..."
rm -rf "$ROOT_DIR/dist-hostinger/apps/storefront/.next/cache"
find "$ROOT_DIR/dist-hostinger" -name "*.map" -delete 2>/dev/null || true
find "$ROOT_DIR/dist-hostinger" -type d -name "typescript" -not -path "*/node_modules/next/*" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR/dist-hostinger" -type d -name "turbo" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR/dist-hostinger" -type d -name "@turbo" -exec rm -rf {} + 2>/dev/null || true

# 5. Create Deployable ZIP Archives
echo "🗜️ Step 5/5: Creating ZIP Archives..."
rm -f "$ROOT_DIR/hostinger-nextjs-storefront.zip"
cd "$ROOT_DIR/dist-hostinger" && zip -r "$ROOT_DIR/hostinger-nextjs-storefront.zip" . > /dev/null

rm -f "$ROOT_DIR/wordpress/headless-commerce-core.zip"
cd "$ROOT_DIR/wordpress" && zip -r "$ROOT_DIR/wordpress/headless-commerce-core.zip" headless-commerce-core/ > /dev/null

echo ""
echo "✅ HOSTINGER DEPLOYMENT PACKAGES CREATED SUCCESSFULLY!"
echo "--------------------------------------------------------"
echo "1. Next.js Storefront ZIP : $ROOT_DIR/hostinger-nextjs-storefront.zip"
echo "2. WordPress Plugin ZIP   : $ROOT_DIR/wordpress/headless-commerce-core.zip"
echo "--------------------------------------------------------"
