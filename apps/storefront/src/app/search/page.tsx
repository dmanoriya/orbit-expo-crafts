import Link from 'next/link';
import { commerce } from '../../../store.config';
import { Search } from 'lucide-react';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedSearchParams = await searchParams;
  let products: any[] = [];
  let config: any = null;
  const query = resolvedSearchParams?.q || '';

  try {
    const [resProducts, resConfig] = await Promise.all([
      commerce.products.list({ search: query }),
      commerce.config.get(),
    ]);
    products = resProducts.products || [];
    config = resConfig;
  } catch (err) {
    products = [];
  }

  const isPurchasing = config?.purchasingEnabled ?? true;

  return (
    <div className="container">
      <div style={{ maxWidth: '640px', margin: '0 auto 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>Catalog Search</h1>
        <form action="/search" method="GET" style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search products by title, category, or keyword..."
            className="glass-panel"
            style={{ flexGrow: 1, padding: '14px 20px', color: '#fff', fontSize: '1rem' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '14px 28px' }}>
            <Search size={18} />
          </button>
        </form>
      </div>

      {query && (
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '24px' }}>
          Search Results for &ldquo;{query}&rdquo; ({products.length})
        </h2>
      )}

      {products.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Search size={48} className="gradient-text" style={{ margin: '0 auto 16px' }} />
          <h3>No products found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Try searching for &quot;headphones&quot;, &quot;smartwatch&quot;, or &quot;keyboard&quot;</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product: any) => (
            <div key={product.id} className="glass-panel product-card">
              <div className="product-image-wrap">
                <img src={product.image || 'https://via.placeholder.com/400'} alt={product.name} />
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span className="product-price">
                    {config?.currencySymbol || '$'}{product.price.toFixed(2)}
                  </span>
                  <Link href={`/product/${product.slug}`} className={isPurchasing ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    View Item
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
