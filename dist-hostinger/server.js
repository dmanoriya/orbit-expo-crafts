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
