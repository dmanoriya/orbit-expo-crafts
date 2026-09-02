'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { SEGMENTS, MATERIALS, FINISHES, ProductItem, MOCK_PRODUCTS } from '../../data/catalogData';
import { useEnquiry } from '../../context/EnquiryContext';
import {
  fetchWpStorefrontData,
  getCachedStorefrontData,
  WpCategoryItem,
  WpColorItem,
  getCategorySeoPath,
  getCategoryBreadcrumbs,
} from '../../lib/wpCommerce';
import ProductSkeletonGrid from '../../components/ProductSkeletonGrid';
import Pagination from '../../components/Pagination';

interface CollectionsClientProps {
  slugArray?: string[];
  initialProducts?: ProductItem[];
  initialCategories?: WpCategoryItem[];
  initialSegments?: string[];
  initialMaterials?: string[];
  initialColors?: WpColorItem[];
  isWpConnected?: boolean;
}

const ITEMS_PER_PAGE = 24;

export default function CollectionsClient({
  slugArray = [],
  initialProducts,
  initialCategories,
  initialSegments,
  initialMaterials,
  initialColors,
  isWpConnected: initialWpConnected,
}: CollectionsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addEnquiry } = useEnquiry();

  const activeCategorySlug = slugArray.length > 0 ? slugArray[slugArray.length - 1] : 'all';

  const [segFilter, setSegFilter] = useState(searchParams.get('seg') || 'all');
  const [matFilter, setMatFilter] = useState(searchParams.get('mat') || 'all');
  const [colorFilter, setColorFilter] = useState(searchParams.get('color') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const initialCache = getCachedStorefrontData();

  const [products, setProducts] = useState<ProductItem[]>(
    initialProducts || (initialCache ? initialCache.products : MOCK_PRODUCTS)
  );
  const [categories, setCategories] = useState<WpCategoryItem[]>(
    initialCategories || (initialCache ? initialCache.categories : [])
  );
  const [segmentsList, setSegmentsList] = useState<string[]>(
    initialSegments || (initialCache && initialCache.segments.length > 0 ? initialCache.segments : SEGMENTS)
  );
  const [materialsList, setMaterialsList] = useState<string[]>(
    initialMaterials || (initialCache && initialCache.materials.length > 0 ? initialCache.materials : MATERIALS)
  );
  const [colorsList, setColorsList] = useState<WpColorItem[]>(
    initialColors || (initialCache && initialCache.colors.length > 0 ? initialCache.colors : FINISHES)
  );
  const [isWpConnected, setIsWpConnected] = useState(
    initialWpConnected ?? (initialCache ? initialCache.isWpConnected : false)
  );
  const [loading, setLoading] = useState(!initialProducts && !initialCache);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const gridRef = useRef<HTMLDivElement>(null);

  // Sync state when search params or URL slug changes
  useEffect(() => {
    setSegFilter(searchParams.get('seg') || 'all');
    setMatFilter(searchParams.get('mat') || 'all');
    setColorFilter(searchParams.get('color') || 'all');
    const p = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(isNaN(p) ? 1 : p);
  }, [searchParams, slugArray]);

  useEffect(() => {
    async function loadData() {
      if (initialProducts && initialProducts.length > 0) {
        setLoading(false);
        return;
      }
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
  }, [initialProducts]);

  // Find active category item
  const activeCategory = useMemo(() => {
    if (activeCategorySlug === 'all') return null;
    return categories.find(
      (c) => c.slug.toLowerCase() === activeCategorySlug.toLowerCase() || c.id.toLowerCase() === activeCategorySlug.toLowerCase()
    );
  }, [categories, activeCategorySlug]);

  // Automatically expand active category's ancestors in the accordion
  useEffect(() => {
    if (!activeCategory || categories.length === 0) return;

    const idMap = new Map<number, WpCategoryItem>();
    categories.forEach((c) => {
      if (c.wpId) idMap.set(c.wpId, c);
    });

    const newExpanded: Record<string, boolean> = { ...expandedCats };
    let current: WpCategoryItem | undefined = activeCategory;
    while (current) {
      newExpanded[current.slug] = true;
      if (current.parent && idMap.has(current.parent)) {
        current = idMap.get(current.parent);
      } else {
        break;
      }
    }
    setExpandedCats(newExpanded);
  }, [activeCategory, categories]);

  // Get descendant category slugs set for deep matching
  const activeCategorySlugsSet = useMemo(() => {
    const set = new Set<string>();
    if (!activeCategory) return set;

    set.add(activeCategory.slug.toLowerCase());
    set.add(activeCategory.id.toLowerCase());

    if (activeCategory.wpId) {
      const queue = [activeCategory.wpId];
      const childrenMap = new Map<number, WpCategoryItem[]>();
      categories.forEach((item) => {
        if (item.parent) {
          const list = childrenMap.get(item.parent) || [];
          list.push(item);
          childrenMap.set(item.parent, list);
        }
      });

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const kids = childrenMap.get(currentId) || [];
        kids.forEach((k) => {
          set.add(k.slug.toLowerCase());
          set.add(k.id.toLowerCase());
          if (k.wpId) queue.push(k.wpId);
        });
      }
    }
    return set;
  }, [activeCategory, categories]);

  const activeFiltersCount =
    (activeCategorySlug !== 'all' ? 1 : 0) +
    (segFilter !== 'all' ? 1 : 0) +
    (matFilter !== 'all' ? 1 : 0) +
    (colorFilter !== 'all' ? 1 : 0);

  const handleClearAllFilters = () => {
    setSegFilter('all');
    setMatFilter('all');
    setColorFilter('all');
    setSearchQuery('');
    router.push('/collections');
  };

  const handleSelectSeg = (seg: string) => {
    setSegFilter(seg);
    const params = new URLSearchParams(searchParams.toString());
    if (seg === 'all') params.delete('seg');
    else params.set('seg', seg);
    const basePath = getCategorySeoPath(activeCategory, categories);
    router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
  };

  const handleSelectMat = (mat: string) => {
    setMatFilter(mat);
    const params = new URLSearchParams(searchParams.toString());
    if (mat === 'all') params.delete('mat');
    else params.set('mat', mat);
    const basePath = getCategorySeoPath(activeCategory, categories);
    router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
  };

  const handleSelectColor = (col: string) => {
    setColorFilter(col);
    const params = new URLSearchParams(searchParams.toString());
    if (col === 'all') params.delete('color');
    else params.set('color', col);
    const basePath = getCategorySeoPath(activeCategory, categories);
    router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
  };

  // Filter products by category, segment, material, color & text search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter (match current category or any descendant category)
      if (activeCategorySlug !== 'all' && activeCategory) {
        const prodCatSlug = (p.cat || '').toLowerCase();
        const prodCatName = (p.catName || '').toLowerCase();
        const isDirectMatch = activeCategorySlugsSet.has(prodCatSlug) || activeCategorySlugsSet.has(prodCatName);
        if (!isDirectMatch) return false;
      }

      // Space / Segment
      if (segFilter !== 'all') {
        const prodSeg = (p.segment || '').toLowerCase();
        if (prodSeg !== segFilter.toLowerCase()) return false;
      }

      // Material
      if (matFilter !== 'all') {
        const prodMat = (p.material || '').toLowerCase();
        const prodMat2 = ((p as any).material2 || '').toLowerCase();
        const targetMat = matFilter.toLowerCase();
        if (!prodMat.includes(targetMat) && !prodMat2.includes(targetMat)) return false;
      }

      // Color / Finish
      if (colorFilter !== 'all') {
        const availCols = ((p as any).availableColors || []).map((c: string) => c.toLowerCase());
        const mainCol = (p as any).color ? (p as any).color.toLowerCase() : '';
        const targetCol = colorFilter.toLowerCase();
        const match = availCols.some((c: string) => c.includes(targetCol)) || mainCol.includes(targetCol);
        if (!match) return false;
      }

      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const availCols = ((p as any).availableColors || []).join(' ').toLowerCase();
        const haystack = [p.name, p.id, p.type, p.catName, p.material, (p as any).material2, p.segment, availCols].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [products, activeCategorySlug, activeCategory, activeCategorySlugsSet, segFilter, matFilter, colorFilter, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) params.set('page', String(newPage));
    else params.delete('page');

    const basePath = getCategorySeoPath(activeCategory, categories);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });

    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleExpandCat = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const crumbs = getCategoryBreadcrumbs(activeCategory, categories);

  // Organize categories into 4-level tree for sidebar
  const categoryTree = useMemo(() => {
    const itemMap = new Map<number, WpCategoryItem & { childrenNode: WpCategoryItem[] }>();
    const roots: (WpCategoryItem & { childrenNode: WpCategoryItem[] })[] = [];

    categories.forEach((cat) => {
      if (cat.wpId) {
        itemMap.set(cat.wpId, { ...cat, childrenNode: [] });
      }
    });

    itemMap.forEach((item) => {
      if (item.parent && itemMap.has(item.parent)) {
        itemMap.get(item.parent)!.childrenNode.push(item);
      } else {
        roots.push(item);
      }
    });

    return roots;
  }, [categories]);

  // Recursive Category Sidebar Item Component
  const RenderCategoryNode = ({ item, depth = 0 }: { item: WpCategoryItem & { childrenNode?: WpCategoryItem[] }; depth?: number }) => {
    const isSelected = activeCategorySlug.toLowerCase() === item.slug.toLowerCase();
    const hasChildren = item.childrenNode && item.childrenNode.length > 0;
    const isExpanded = !!expandedCats[item.slug];
    const seoUrl = getCategorySeoPath(item, categories);

    return (
      <div key={item.id || item.slug} style={{ marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href={seoUrl}
            className={`fopt ${isSelected ? 'on' : ''}`}
            style={{
              flex: 1,
              fontWeight: depth === 0 ? 600 : depth === 1 ? 500 : 400,
              paddingLeft: depth > 0 ? depth * 12 : 0,
              fontSize: depth === 0 ? 14 : 13,
            }}
          >
            {item.name} {item.count ? `(${item.count})` : ''}
          </Link>
          {hasChildren && (
            <button
              onClick={(e) => toggleExpandCat(item.slug, e)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: 12,
                color: 'var(--ink-2)',
              }}
              aria-label="Toggle subcategories"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div style={{ marginLeft: depth > 0 ? 8 : 4, borderLeft: '1px solid var(--border-color, #E2DDD5)', paddingLeft: 6 }}>
            {item.childrenNode!.map((child) => (
              <RenderCategoryNode key={child.id || child.slug} item={child as any} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="wrap" style={{ paddingBottom: 80 }}>
      {/* SEO BREADCRUMBS */}
      <div className="crumbs" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '16px 0' }}>
        <Link href="/">Home</Link>
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.url}>
            <span>/</span>
            {idx === crumbs.length - 1 ? (
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{crumb.name}</span>
            ) : (
              <Link href={crumb.url}>{crumb.name}</Link>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* COLLECTION HERO HEADER */}
      <div className="cat-hero" style={{ margin: '16px 0 32px' }}>
        <div>
          <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '0 0 8px', textTransform: 'capitalize' }}>
            {activeCategory ? `${activeCategory.name} Collections` : 'All Collections & Architectural Designs'}
          </h1>
          <p style={{ maxWidth: 720, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            {activeCategory?.description ||
              'Explore handcrafted bespoke furniture, lighting, rugs, and decor elements engineered for luxury hospitality, commercial fit-outs, and high-end residential projects.'}
          </p>
        </div>
        <span
          className="pill-note"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            background: 'var(--surface-2)',
            padding: '8px 16px',
            borderRadius: 'var(--r-pill)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Direct B2B Manufacturing · Quote-First Catalog
        </span>
      </div>

      {/* FILTER DRAWER BACKDROP (MOBILE/TABLET) */}
      <div
        className={`filter-drawer-backdrop ${isMobileFilterOpen ? 'open' : ''}`}
        onClick={() => setIsMobileFilterOpen(false)}
      />

      {/* MAIN CATALOGUE LAYOUT */}
      <div className="cat-layout">
        {/* SIDEBAR FILTERS */}
        <aside className={`filters ${isMobileFilterOpen ? 'drawer-open' : ''}`}>
          <div className="filter-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h4>Filter Collections</h4>
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

          <div className="filter-drawer-content">
            {/* CATEGORIES ACCORDION TREE */}
            <div className="fgroup">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h5>Department / Category</h5>
                {activeCategorySlug !== 'all' && (
                  <Link href="/collections" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'underline' }}>
                    View All
                  </Link>
                )}
              </div>

              <Link
                href="/collections"
                className={`fopt ${activeCategorySlug === 'all' ? 'on' : ''}`}
                style={{ fontWeight: 600, marginBottom: 6 }}
              >
                All Departments & Categories
              </Link>

              {categoryTree.map((dept) => (
                <RenderCategoryNode key={dept.id || dept.slug} item={dept} depth={0} />
              ))}
            </div>

            {/* SEGMENT / SPACE */}
            <div className="fgroup">
              <h5>Space / Segment</h5>
              <button className={`fopt ${segFilter === 'all' ? 'on' : ''}`} onClick={() => handleSelectSeg('all')}>
                All spaces
              </button>
              {segmentsList.map((s) => (
                <button key={s} className={`fopt ${segFilter === s ? 'on' : ''}`} onClick={() => handleSelectSeg(s)}>
                  {s}
                </button>
              ))}
            </div>

            {/* MATERIAL / CRAFT */}
            <div className="fgroup">
              <h5>Material & Craft</h5>
              <button className={`fopt ${matFilter === 'all' ? 'on' : ''}`} onClick={() => handleSelectMat('all')}>
                All materials
              </button>
              {materialsList.map((m) => (
                <button key={m} className={`fopt ${matFilter === m ? 'on' : ''}`} onClick={() => handleSelectMat(m)}>
                  {m}
                </button>
              ))}
            </div>

            {/* COLOR / FINISH */}
            <div className="fgroup">
              <h5>Color & Finish</h5>
              <button className={`fopt ${colorFilter === 'all' ? 'on' : ''}`} onClick={() => handleSelectColor('all')}>
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

          <div className="filter-drawer-footer">
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsMobileFilterOpen(false)}>
              Show {filteredProducts.length} Designs
            </button>
          </div>
        </aside>

        {/* MAIN PRODUCT DISPLAY */}
        <div ref={gridRef} style={{ scrollMarginTop: 100 }}>
          {/* SEARCH TOOLBAR */}
          <div className="toolbar">
            <button className="filter-toggle-btn" onClick={() => setIsMobileFilterOpen(true)} aria-label="Open filter options">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filter & Refine</span>
              {activeFiltersCount > 0 && <span className="filter-count-badge">{activeFiltersCount}</span>}
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

          {/* PRODUCT GRID */}
          {loading ? (
            <ProductSkeletonGrid count={8} />
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="prod-grid">
                {paginatedProducts.map((p) => (
                  <article key={p.id} className="card">
                    <div className="thumb">
                      {p.badge && <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>{p.badge}</span>}
                      <Link href={`/product/${(p as any).slug || p.id}`}>
                        <img src={(p as any).img || p.image} alt={p.name} loading="lazy" />
                      </Link>
                    </div>

                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span className="code mono">{p.id}</span>
                        {p.catName && (
                          <Link href={`/collections/${p.cat}`} className="pill" style={{ fontSize: 11 }}>
                            {p.catName}
                          </Link>
                        )}
                      </div>

                      <h3 className="name">
                        <Link href={`/product/${(p as any).slug || p.id}`}>{p.name}</Link>
                      </h3>

                      <div className="meta-list" style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                        {p.material && <div>Material: {p.material}</div>}
                        {p.segment && <div>Segment: {p.segment}</div>}
                      </div>

                      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        <Link href={`/product/${(p as any).slug || p.id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                          View Details
                        </Link>
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            addEnquiry({
                              id: p.id,
                              name: p.name,
                              image: (p as any).img || p.image,
                              q: 1,
                            })
                          }
                          style={{ padding: '8px 12px' }}
                          title="Add to Shortlist"
                        >
                          + Quote
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="no-results" style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface-1)', borderRadius: 'var(--r-lg)' }}>
              <h3>No matching designs found</h3>
              <p style={{ color: 'var(--ink-2)', margin: '8px 0 20px' }}>Try resetting your category or material filters.</p>
              <button className="btn btn-primary" onClick={handleClearAllFilters}>
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
