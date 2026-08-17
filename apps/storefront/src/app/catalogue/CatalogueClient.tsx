'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CATEGORIES, SEGMENTS, MATERIALS, FINISHES, ProductItem, MOCK_PRODUCTS } from '../../data/catalogData';
import { useEnquiry } from '../../context/EnquiryContext';
import { fetchWpStorefrontData, getCachedStorefrontData, WpCategoryItem, WpColorItem } from '../../lib/wpCommerce';
import ProductSkeletonGrid from '../../components/ProductSkeletonGrid';

interface CatalogueClientProps {
  initialCategory?: string;
}

export default function CatalogueClient({ initialCategory }: CatalogueClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addEnquiry } = useEnquiry();

  const activeCategoryParam = initialCategory || searchParams.get('cat') || 'all';

  const [catFilter, setCatFilter] = useState(activeCategoryParam);
  const [segFilter, setSegFilter] = useState(searchParams.get('seg') || 'all');
  const [matFilter, setMatFilter] = useState(searchParams.get('mat') || 'all');
  const [colorFilter, setColorFilter] = useState(searchParams.get('color') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const initialCache = getCachedStorefrontData();

  const [products, setProducts] = useState<ProductItem[]>(
    initialCache ? initialCache.products : MOCK_PRODUCTS
  );
  const [categories, setCategories] = useState<WpCategoryItem[]>(
    initialCache ? initialCache.categories : []
  );
  const [segmentsList, setSegmentsList] = useState<string[]>(
    initialCache && initialCache.segments.length > 0 ? initialCache.segments : SEGMENTS
  );
  const [materialsList, setMaterialsList] = useState<string[]>(
    initialCache && initialCache.materials.length > 0 ? initialCache.materials : MATERIALS
  );
  const [colorsList, setColorsList] = useState<WpColorItem[]>(
    initialCache && initialCache.colors.length > 0 ? initialCache.colors : FINISHES
  );
  const [isWpConnected, setIsWpConnected] = useState(initialCache ? initialCache.isWpConnected : false);
  const [loading, setLoading] = useState(!initialCache);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFiltersCount =
    (catFilter !== 'all' ? 1 : 0) +
    (segFilter !== 'all' ? 1 : 0) +
    (matFilter !== 'all' ? 1 : 0) +
    (colorFilter !== 'all' ? 1 : 0);

  const handleClearAllFilters = () => {
    setCatFilter('all');
    setSegFilter('all');
    setMatFilter('all');
    setColorFilter('all');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('cat');
    params.delete('seg');
    params.delete('mat');
    params.delete('color');
    const path = initialCategory ? `/catalogue/${initialCategory}` : '/catalogue';
    const query = params.toString();
    router.replace(query ? `${path}?${query}` : path, { scroll: false });
  };

  // DYNAMIC RE-SYNC WHEN URL OR PARAMS CHANGE
  useEffect(() => {
    const cat = initialCategory || searchParams.get('cat') || 'all';
    const seg = searchParams.get('seg') || 'all';
    const mat = searchParams.get('mat') || 'all';
    const col = searchParams.get('color') || 'all';
    setCatFilter(cat);
    setSegFilter(seg);
    setMatFilter(mat);
    setColorFilter(col);
  }, [initialCategory, searchParams]);

  useEffect(() => {
    async function loadData() {
      const data = await fetchWpStorefrontData();
      setProducts(data.products);
      setCategories(data.categories);
      if (data.segments && data.segments.length > 0) setSegmentsList(data.segments);
      if (data.materials && data.materials.length > 0) setMaterialsList(data.materials);
      if (data.colors && data.colors.length > 0) setColorsList(data.colors);
      setIsWpConnected(data.isWpConnected);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSelectCat = (slug: string) => {
    setCatFilter(slug);
    if (slug === 'all') {
      router.push('/catalogue');
    } else {
      router.push(`/catalogue/${slug}`);
    }
  };

  const handleSelectSeg = (seg: string) => {
    setSegFilter(seg);
    const params = new URLSearchParams(searchParams.toString());
    if (seg === 'all') {
      params.delete('seg');
    } else {
      params.set('seg', seg);
    }
    router.push(`/catalogue?${params.toString()}`);
  };

  const handleSelectMat = (mat: string) => {
    setMatFilter(mat);
    const params = new URLSearchParams(searchParams.toString());
    if (mat === 'all') {
      params.delete('mat');
    } else {
      params.set('mat', mat);
    }
    router.push(`/catalogue?${params.toString()}`);
  };

  const handleSelectColor = (col: string) => {
    setColorFilter(col);
    const params = new URLSearchParams(searchParams.toString());
    if (col === 'all') {
      params.delete('color');
    } else {
      params.set('color', col);
    }
    router.push(`/catalogue?${params.toString()}`);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category matching (checks catSlugs or cat)
      if (catFilter !== 'all') {
        const matchesCategory = p.catSlugs
          ? p.catSlugs.some((s) => s.toLowerCase() === catFilter.toLowerCase())
          : p.cat.toLowerCase() === catFilter.toLowerCase();
        if (!matchesCategory) return false;
      }

      // Segment matching
      if (segFilter !== 'all' && p.segment !== segFilter && (p as any).segment2 !== segFilter) return false;

      // Material matching
      if (matFilter !== 'all' && p.material !== matFilter && (p as any).material2 !== matFilter) return false;

      // Color matching (checks availableColors, attributes, variations, or primary color)
      if (colorFilter !== 'all') {
        const pColors: string[] = (p as any).availableColors || (p as any).attributes?.pa_color || (p.color ? [p.color] : []);
        const matchesColor = pColors.some((c: string) => c.toLowerCase() === colorFilter.toLowerCase());
        if (!matchesColor) return false;
      }

      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const availCols = (p as any).availableColors ? (p as any).availableColors.join(' ') : (p as any).color || '';
        const haystack = [p.name, p.id, p.type, p.catName, p.material, (p as any).material2, p.segment, availCols].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, catFilter, segFilter, matFilter, colorFilter, searchQuery]);

  const activeCategory = categories.find((c) => c.id.toLowerCase() === catFilter.toLowerCase());

  return (
    <div className="wrap" style={{ paddingBottom: 80 }}>
      {/* CRUMBS & HEADER */}
      <div className="crumbs">
        <Link href="/">Home</Link> / <Link href="/catalogue">Catalogue</Link> {activeCategory ? ` / ${activeCategory.name}` : ''}
      </div>

      <div className="cat-hero" style={{ margin: '16px 0 32px' }}>
        <div>
          <h2 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '0 0 8px' }}>
            {catFilter === 'all' ? 'All Furniture & Architectural Elements' : `${catFilter.toUpperCase()} Collection`}
          </h2>
          <p>
            Everything is made to order. Sizes, finishes, fabrics and quantities are all variable — which is why we quote rather than list a price.
          </p>
        </div>
        <span className="pill-note" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'var(--surface-2)', padding: '8px 16px', borderRadius: 'var(--r-pill)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Quote-first · no online payment
        </span>
      </div>

      {/* FILTER DRAWER BACKDROP (MOBILE & TABLET) */}
      <div
        className={`filter-drawer-backdrop ${isMobileFilterOpen ? 'open' : ''}`}
        onClick={() => setIsMobileFilterOpen(false)}
      />

      {/* CATALOGUE LAYOUT */}
      <div className="cat-layout">
        {/* FILTERS SIDEBAR (RESPONSIVE DRAWER ON TABLETS & MOBILES) */}
        <aside className={`filters ${isMobileFilterOpen ? 'drawer-open' : ''}`}>
          {/* DRAWER HEADER (MOBILE/TABLET ONLY) */}
          <div className="filter-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h4>Filter Designs</h4>
              {activeFiltersCount > 0 && (
                <button className="clear-all-btn" onClick={handleClearAllFilters}>
                  Reset ({activeFiltersCount})
                </button>
              )}
            </div>
            <button className="close-btn" onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters">
              ✕
            </button>
          </div>

          {/* DRAWER CONTENT */}
          <div className="filter-drawer-content">
            <div className="fgroup">
              <h5>Category</h5>
              <button
                className={`fopt ${catFilter === 'all' ? 'on' : ''}`}
                onClick={() => handleSelectCat('all')}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`fopt ${catFilter.toLowerCase() === c.id.toLowerCase() ? 'on' : ''}`}
                  onClick={() => handleSelectCat(c.id)}
                >
                  {c.name} {c.count ? `(${c.count})` : ''}
                </button>
              ))}
            </div>

            <div className="fgroup">
              <h5>Space / Segment</h5>
              <button
                className={`fopt ${segFilter === 'all' ? 'on' : ''}`}
                onClick={() => handleSelectSeg('all')}
              >
                All spaces
              </button>
              {segmentsList.map((s) => (
                <button
                  key={s}
                  className={`fopt ${segFilter === s ? 'on' : ''}`}
                  onClick={() => handleSelectSeg(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="fgroup">
              <h5>Material / Craft</h5>
              <button
                className={`fopt ${matFilter === 'all' ? 'on' : ''}`}
                onClick={() => handleSelectMat('all')}
              >
                All materials
              </button>
              {materialsList.map((m) => (
                <button
                  key={m}
                  className={`fopt ${matFilter === m ? 'on' : ''}`}
                  onClick={() => handleSelectMat(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="fgroup">
              <h5>Color / Finish</h5>
              <button
                className={`fopt ${colorFilter === 'all' ? 'on' : ''}`}
                onClick={() => handleSelectColor('all')}
              >
                All finishes
              </button>
              {colorsList.map((col) => (
                <button
                  key={col.name}
                  className={`fopt ${colorFilter === col.name ? 'on' : ''}`}
                  onClick={() => handleSelectColor(col.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: col.code, border: '1px solid rgba(0,0,0,0.15)' }} />
                  {col.name}
                </button>
              ))}
            </div>
          </div>

          {/* DRAWER FOOTER (MOBILE/TABLET ONLY) */}
          <div className="filter-drawer-footer">
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Show {filteredProducts.length} Designs
            </button>
          </div>
        </aside>

        {/* MAIN PRODUCT GRID */}
        <div>
          {/* TOOLBAR SEARCH & FILTER BUTTON */}
          <div className="toolbar">
            <button
              className="filter-toggle-btn"
              onClick={() => setIsMobileFilterOpen(true)}
              aria-label="Open filter options"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filter & Refine</span>
              {activeFiltersCount > 0 && (
                <span className="filter-count-badge">{activeFiltersCount}</span>
              )}
            </button>

            <div className="searchbox">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
              </svg>
              <input
                placeholder="Search designs, codes, materials…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="mono" style={{ color: 'var(--ink-3)' }}>
              {filteredProducts.length} designs
            </span>
          </div>

          {/* GRID */}
          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : filteredProducts.length > 0 ? (
            <div className="prod-grid">
              {filteredProducts.map((p) => (
                <article key={p.id} className="card">
                  <div className="thumb">
                    {p.badge && (
                      <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>
                        {p.badge}
                      </span>
                    )}
                    <Link href={`/product/${p.id}`}>
                      <img src={p.image || `/categories/${p.cat || 'seating'}.jpg`} alt={p.name} loading="lazy" />
                    </Link>
                    <div className="acts">
                      <Link href={`/product/${p.id}`} className="btn btn-soft btn-sm">
                        Details
                      </Link>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          addEnquiry({
                            id: p.id,
                            name: p.name,
                            catName: p.catName,
                            q: p.moq,
                            image: p.image || '/fallback-product.svg',
                            moq: p.moq,
                          })
                        }
                      >
                        + Enquiry
                      </button>
                    </div>
                  </div>
                  <div className="body">
                    <Link href={`/product/${p.id}`}>
                      <h4>{p.name}</h4>
                    </Link>
                    <span className="price-note">Price on request</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
              </svg>
              <h4 className="disp" style={{ fontSize: 24 }}>No designs match that combination</h4>
              <p style={{ margin: '8px 0 18px', color: 'var(--ink-2)' }}>
                We very likely still make it — we build to drawing.
              </p>
              <Link href="/contact" className="btn btn-primary">
                Ask our project desk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
