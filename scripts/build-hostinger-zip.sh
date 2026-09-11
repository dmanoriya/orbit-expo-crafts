#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "🚀 Building Orbit Expo Crafts Hostinger Production Package in $ROOT_DIR..."

cd "$ROOT_DIR"

# 1. Build Next.js Storefront App
echo "📦 Step 1/5: Building Next.js Storefront..."
if [ -f "$ROOT_DIR/apps/storefront/node_modules/.bin/next" ]; then
  (cd "$ROOT_DIR/apps/storefront" && ./node_modules/.bin/next build)
else
  pnpm --filter storefront build
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

# Create Universal Root server.js Entrypoint with Multi-Path Fallbacks
cat << 'EOF' > "$ROOT_DIR/dist-hostinger/server.js"
const path = require('path');
const fs = require('fs');

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

if [ -d "$ROOT_DIR/dist-hostinger/public" ]; then
  cp -rL "$ROOT_DIR/dist-hostinger/public" "$ROOT_DIR/dist-hostinger/nodejs/public"
fi

cat << 'EOF' > "$ROOT_DIR/dist-hostinger/nodejs/server.js"
const path = require('path');
const fs = require('fs');

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

echo ""
echo "✅ HOSTINGER DEPLOYMENT PACKAGES CREATED SUCCESSFULLY!"
echo "--------------------------------------------------------"
echo "1. Next.js Storefront ZIP : $ROOT_DIR/hostinger-nextjs-storefront.zip"
echo "2. WordPress Plugin ZIP   : $ROOT_DIR/wordpress/headless-commerce-core.zip"
echo "--------------------------------------------------------"
