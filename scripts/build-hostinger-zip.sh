#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🚀 Building Orbit Expo Crafts Hostinger Production Package in $ROOT_DIR..."

cd "$ROOT_DIR"

# 1. Build Next.js Storefront App
echo "📦 Step 1/5: Building Next.js Storefront for Hostinger Production..."
# Temporarily move .env.local so local WP URL is not baked into the build
if [ -f "$ROOT_DIR/apps/storefront/.env.local" ]; then
  mv "$ROOT_DIR/apps/storefront/.env.local" "$ROOT_DIR/apps/storefront/.env.local.bak"
fi

# Set production env vars during build
export NODE_ENV=production
export NEXT_PUBLIC_WORDPRESS_URL="https://admin.orbitexpocrafts.com"
export WORDPRESS_URL="https://admin.orbitexpocrafts.com"
export NEXT_PUBLIC_SITE_URL="https://orbitexpocrafts.com"
export NEXT_PUBLIC_STORE_NAME="Orbit Expo Crafts"

if [ -f "$ROOT_DIR/apps/storefront/node_modules/.bin/next" ]; then
  (cd "$ROOT_DIR/apps/storefront" && ./node_modules/.bin/next build)
else
  pnpm --filter storefront build
fi

# Restore .env.local for local development
if [ -f "$ROOT_DIR/apps/storefront/.env.local.bak" ]; then
  mv "$ROOT_DIR/apps/storefront/.env.local.bak" "$ROOT_DIR/apps/storefront/.env.local"
fi

# 2. Prepare Clean dist-hostinger Directory
echo "📂 Step 2/5: Synchronizing Standalone Build Files..."
rm -rf "$ROOT_DIR/dist-hostinger"
mkdir -p "$ROOT_DIR/dist-hostinger"

# Copy entire standalone output (including root node_modules and apps/storefront)
cp -rL "$ROOT_DIR/apps/storefront/.next/standalone/"* "$ROOT_DIR/dist-hostinger/"

# 3. Synchronize Static Assets & Public Directory
echo "🔧 Step 3/5: Copying Static Assets & Public Folders..."
mkdir -p "$ROOT_DIR/dist-hostinger/apps/storefront/.next"
mkdir -p "$ROOT_DIR/dist-hostinger/.next"
cp -rL "$ROOT_DIR/apps/storefront/.next/static" "$ROOT_DIR/dist-hostinger/apps/storefront/.next/static"
cp -rL "$ROOT_DIR/apps/storefront/.next/static" "$ROOT_DIR/dist-hostinger/.next/static"

if [ -d "$ROOT_DIR/apps/storefront/public" ]; then
  cp -rL "$ROOT_DIR/apps/storefront/public" "$ROOT_DIR/dist-hostinger/apps/storefront/public"
  cp -rL "$ROOT_DIR/apps/storefront/public" "$ROOT_DIR/dist-hostinger/public"
fi

# Generate production .env configuration for Hostinger
cat << 'EOF' > "$ROOT_DIR/dist-hostinger/.env"
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_WORDPRESS_URL=https://admin.orbitexpocrafts.com
WORDPRESS_URL=https://admin.orbitexpocrafts.com
NEXT_PUBLIC_SITE_URL=https://orbitexpocrafts.com
NEXT_PUBLIC_STORE_NAME=Orbit Expo Crafts
REVALIDATE_SECRET=orbit_expo_crafts_secret_key_2026
EOF

cp "$ROOT_DIR/dist-hostinger/.env" "$ROOT_DIR/dist-hostinger/.env.production"
mkdir -p "$ROOT_DIR/dist-hostinger/apps/storefront"
cp "$ROOT_DIR/dist-hostinger/.env" "$ROOT_DIR/dist-hostinger/apps/storefront/.env"
cp "$ROOT_DIR/dist-hostinger/.env" "$ROOT_DIR/dist-hostinger/apps/storefront/.env.production"

# Create Fail-Safe Root package.json for Hostinger Production
cat << 'EOF' > "$ROOT_DIR/dist-hostinger/package.json"
{
  "name": "orbit-expo-crafts-storefront",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "echo 'Pre-built package ready'"
  },
  "dependencies": {
    "next": "15.5.23"
  }
}
EOF

# Create Universal Root server.js Entrypoint with Multi-Path Fallbacks & Env Loader
cat << 'EOF' > "$ROOT_DIR/dist-hostinger/server.js"
const path = require('path');
const fs = require('fs');

// Auto-load .env if available
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        if (!process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  }
} catch (e) {}

// Production Fallbacks
if (!process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL.includes('.local') || process.env.NEXT_PUBLIC_WORDPRESS_URL.includes('localhost')) {
  process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://admin.orbitexpocrafts.com';
}
if (!process.env.WORDPRESS_URL || process.env.WORDPRESS_URL.includes('.local') || process.env.WORDPRESS_URL.includes('localhost')) {
  process.env.WORDPRESS_URL = 'https://admin.orbitexpocrafts.com';
}
if (!process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL.includes('.local') || process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://orbitexpocrafts.com';
}

process.env.PORT = process.env.PORT || process.env.PORT_APP || 3000;
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

const possiblePaths = [
  path.join(__dirname, 'apps/storefront/server.js'),
  path.join(__dirname, 'nodejs/apps/storefront/server.js'),
  path.join(__dirname, '../apps/storefront/server.js'),
];

let targetServer = null;
for (const p of possiblePaths) {
  if (p !== __filename && fs.existsSync(p)) {
    targetServer = p;
    break;
  }
}

if (targetServer) {
  require(targetServer);
} else {
  console.error('Next.js standalone server not found at', possiblePaths);
}
EOF

# 4. Create Full DUPLICATE nodejs/ Directory Structure for Hostinger hbuilds Runner
echo "⚙️ Step 4/5: Creating Hostinger hbuilds nodejs/ Structure..."
mkdir -p "$ROOT_DIR/dist-hostinger/nodejs"

cp -rL "$ROOT_DIR/dist-hostinger/apps" "$ROOT_DIR/dist-hostinger/nodejs/" 2>/dev/null || true
cp -rL "$ROOT_DIR/dist-hostinger/node_modules" "$ROOT_DIR/dist-hostinger/nodejs/" 2>/dev/null || true
cp -rL "$ROOT_DIR/dist-hostinger/.next" "$ROOT_DIR/dist-hostinger/nodejs/" 2>/dev/null || true
cp -rL "$ROOT_DIR/dist-hostinger/package.json" "$ROOT_DIR/dist-hostinger/nodejs/package.json" 2>/dev/null || true
cp -rL "$ROOT_DIR/dist-hostinger/.env" "$ROOT_DIR/dist-hostinger/nodejs/.env" 2>/dev/null || true
cp -rL "$ROOT_DIR/dist-hostinger/.env.production" "$ROOT_DIR/dist-hostinger/nodejs/.env.production" 2>/dev/null || true

if [ -d "$ROOT_DIR/dist-hostinger/public" ]; then
  cp -rL "$ROOT_DIR/dist-hostinger/public" "$ROOT_DIR/dist-hostinger/nodejs/public"
fi

cat << 'EOF' > "$ROOT_DIR/dist-hostinger/nodejs/server.js"
const path = require('path');
const fs = require('fs');

// Auto-load .env if available
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        if (!process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  }
} catch (e) {}

// Production Fallbacks
if (!process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL.includes('.local') || process.env.NEXT_PUBLIC_WORDPRESS_URL.includes('localhost')) {
  process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://admin.orbitexpocrafts.com';
}
if (!process.env.WORDPRESS_URL || process.env.WORDPRESS_URL.includes('.local') || process.env.WORDPRESS_URL.includes('localhost')) {
  process.env.WORDPRESS_URL = 'https://admin.orbitexpocrafts.com';
}
if (!process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL.includes('.local') || process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://orbitexpocrafts.com';
}

process.env.PORT = process.env.PORT || process.env.PORT_APP || 3000;
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

const possiblePaths = [
  path.join(__dirname, 'apps/storefront/server.js'),
  path.join(__dirname, '../apps/storefront/server.js'),
  path.join(__dirname, '../../apps/storefront/server.js'),
];

let targetServer = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    targetServer = p;
    break;
  }
}

if (targetServer) {
  require(targetServer);
} else {
  console.error('Next.js standalone server not found at', possiblePaths);
}
EOF

# Prune unnecessary build cache and source maps
rm -rf "$ROOT_DIR/dist-hostinger/apps/storefront/.next/cache" 2>/dev/null || true
rm -rf "$ROOT_DIR/dist-hostinger/nodejs/apps/storefront/.next/cache" 2>/dev/null || true
find "$ROOT_DIR/dist-hostinger" -name "*.map" -delete 2>/dev/null || true

# 5. Create Deployable ZIP Archives
echo "🗜️ Step 5/5: Creating ZIP Archives..."
rm -f "$ROOT_DIR/hostinger-nextjs-storefront.zip"
cd "$ROOT_DIR/dist-hostinger" && zip -r "$ROOT_DIR/hostinger-nextjs-storefront.zip" . > /dev/null

rm -f "$ROOT_DIR/wordpress/headless-commerce-core.zip"
cd "$ROOT_DIR/wordpress" && zip -r "$ROOT_DIR/wordpress/headless-commerce-core.zip" headless-commerce-core/ > /dev/null
cp -f "$ROOT_DIR/wordpress/headless-commerce-core.zip" "$ROOT_DIR/headless-commerce-core.zip"

echo ""
echo "✅ HOSTINGER DEPLOYMENT PACKAGES CREATED SUCCESSFULLY!"
echo "--------------------------------------------------------"
echo "1. Next.js Storefront ZIP : $ROOT_DIR/hostinger-nextjs-storefront.zip"
echo "2. WordPress Plugin ZIP   : $ROOT_DIR/headless-commerce-core.zip"
echo "   (Also at)              : $ROOT_DIR/wordpress/headless-commerce-core.zip"
echo "--------------------------------------------------------"

