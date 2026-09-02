'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ProductItem } from '../data/catalogData';
import { useEnquiry } from '../context/EnquiryContext';
import { fetchWpStorefrontData, WpCategoryItem } from '../lib/wpCommerce';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SUGGESTIONS = [
  'Dining Chairs',
  'Teak Wood Tables',
  'Hotel Guestroom Sofas',
  'Bone Inlay Consoles',
  'Outdoor Loungers',
  'Brass Bar Stools',
  'Storage Sideboards',
  'Pendant Lighting',
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { addEnquiry } = useEnquiry();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<WpCategoryItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ProductItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Load recently viewed from localStorage
      try {
        const stored = localStorage.getItem('orbit_recently_viewed');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setRecentlyViewed(parsed.slice(0, 4));
        }
      } catch (e) {
        console.log('Error reading recently viewed:', e);
      }
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Fetch WP products dynamically via wpCommerce
  useEffect(() => {
    async function loadData() {
      const data = await fetchWpStorefrontData();
      setProducts(data.products);
      setCategories(data.categories);
    }
    loadData();
  }, []);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter live matching products
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter((p) => {
      const haystack = [p.name, p.id, p.catName, p.type, p.material, p.material2, p.segment, p.segment2].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, products]);

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
  };

  const handleProductClick = (item: ProductItem) => {
    // Save to recently viewed
    try {
      const existing = recentlyViewed.filter((x) => x.id !== item.id);
      const updated = [item, ...existing].slice(0, 4);
      setRecentlyViewed(updated);
      localStorage.setItem('orbit_recently_viewed', JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving recently viewed:', e);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* MODAL SEARCH HEADER */}
        <div className="search-modal-head">
          <svg className="search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search designs, SKU codes, materials, spaces… (Press ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')} title="Clear search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <button className="close-btn" onClick={onClose} title="Close search (ESC)">
            <kbd>ESC</kbd>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="search-modal-body">
          {/* STATE 1: LIVE SEARCH RESULTS */}
          {query.trim() !== '' ? (
            <div className="results-section">
              <div className="section-title">
                <span>Matching Results ({searchResults.length})</span>
                {searchResults.length > 0 && (
                  <Link href={`/catalogue?search=${encodeURIComponent(query)}`} onClick={onClose} style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 13 }}>
                    View all in Catalogue →
                  </Link>
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="search-results-grid">
                  {searchResults.map((p) => (
                    <div key={p.id} className="search-result-item">
                      <Link href={`/product/${p.id}`} onClick={() => handleProductClick(p)} className="result-thumb">
                        <img src={p.image} alt={p.name} />
                      </Link>
                      <div className="result-info">
                        <span className="mono" style={{ fontSize: 10, color: 'var(--brand)' }}>{p.id} · {p.catName}</span>
                        <Link href={`/product/${p.id}`} onClick={() => handleProductClick(p)}>
                          <h5>{p.name}</h5>
                        </Link>
                        <small>{p.material} · MOQ {p.moq} units · {p.lead}d lead</small>
                      </div>
                      <button
                        className="btn btn-soft btn-sm"
                        onClick={() =>
                          addEnquiry({
                            id: p.id,
                            name: p.name,
                            catName: p.catName,
                            q: p.moq,
                            image: p.image,
                            moq: p.moq,
                          })
                        }
                      >
                        + Enquiry
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>No products found matching &quot;<b>{query}</b>&quot;.</p>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)', display: 'block', marginTop: 4 }}>
                    Try searching by material (&quot;Sheesham&quot;, &quot;Brass&quot;) or category (&quot;Seating&quot;, &quot;Tables&quot;). We also manufacture custom drawings to spec.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* STATE 2: DEFAULT SUGGESTIONS & RECENTLY VIEWED */
            <div className="default-search-view">
              {/* POPULAR SUGGESTIONS */}
              <div className="suggestions-section">
                <span className="section-label mono">Popular Searches & Categories</span>
                <div className="suggestion-chips">
                  {POPULAR_SUGGESTIONS.map((term) => (
                    <button key={term} className="suggestion-chip" onClick={() => handleSuggestionClick(term)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.5-4.5" />
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>

                <div className="cat-quick-strip" style={{ marginTop: 20 }}>
                  <span className="section-label mono" style={{ marginBottom: 10, display: 'block' }}>Browse Categories</span>
                  <div className="cat-quick-chips">
                    {categories.slice(0, 8).map((c) => (
                      <Link href={`/catalogue/${c.id}`} key={c.id} onClick={onClose} className="cat-quick-chip">
                        {c.name} {c.count ? `(${c.count})` : ''}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* RECENTLY VIEWED PRODUCTS */}
              {recentlyViewed.length > 0 && (
                <div className="recently-viewed-section" style={{ marginTop: 28 }}>
                  <span className="section-label mono">Recently Viewed</span>
                  <div className="recent-grid">
                    {recentlyViewed.map((p) => (
                      <Link href={`/product/${p.id}`} key={p.id} onClick={() => handleProductClick(p)} className="recent-card">
                        <div className="recent-thumb">
                          <img src={p.image} alt={p.name} />
                        </div>
                        <h6>{p.name}</h6>
                        <small>{p.catName}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="search-modal-foot">
          <span>Tip: Press <kbd>Cmd</kbd> + <kbd>K</kbd> or <kbd>Ctrl</kbd> + <kbd>K</kbd> anywhere to trigger quick search</span>
          <Link href="/catalogue" onClick={onClose} style={{ color: 'var(--brand)', fontWeight: 600 }}>
            Open Full Catalogue →
          </Link>
        </div>
      </div>
    </div>
  );
};
