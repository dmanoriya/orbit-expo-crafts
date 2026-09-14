import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../apps/storefront/src/data');

const candidateBases = [
  process.env.WORDPRESS_URL,
  process.env.NEXT_PUBLIC_WORDPRESS_URL,
  'http://woo-catalog-nextjs.local',
  'https://admin.orbitexpocrafts.com',
].filter(Boolean);

async function fetchFromCandidates(subPath) {
  for (const base of candidateBases) {
    try {
      const url = `${base.replace(/\/$/, '')}/wp-json/hcc/v1${subPath}`;
      console.log(`Checking ${url}...`);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          console.log(`✓ Fetched successfully from ${base}`);
          return json.data;
        }
      }
    } catch {
      // try next candidate
    }
  }
  throw new Error(`Failed to fetch ${subPath} from all candidate WordPress endpoints`);
}

async function run() {
  console.log('🔄 Syncing catalog snapshots from WordPress...');

  const products = await fetchFromCandidates('/products?per_page=-1');
  fs.writeFileSync(path.join(dataDir, 'products-snapshot.json'), JSON.stringify(products, null, 2));
  console.log(`✓ Saved ${products.products?.length || 0} products to products-snapshot.json`);

  const categories = await fetchFromCandidates('/categories');
  fs.writeFileSync(path.join(dataDir, 'categories-snapshot.json'), JSON.stringify(categories, null, 2));
  console.log(`✓ Saved ${categories?.length || 0} categories to categories-snapshot.json`);

  const attributes = await fetchFromCandidates('/attributes');
  fs.writeFileSync(path.join(dataDir, 'attributes-snapshot.json'), JSON.stringify(attributes, null, 2));
  console.log(`✓ Saved ${attributes?.length || 0} attributes to attributes-snapshot.json`);

  console.log('✨ All snapshots synchronized successfully!');
}

run().catch((err) => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
