'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ProductItem, getProductSlug } from '../../data/catalogData';
import { useEnquiry } from '../../context/EnquiryContext';
import { useFavorites } from '../../context/FavoritesContext';

interface BestSellersClientProps {
  products: ProductItem[];
}

const FILTER_TABS = [
  { id: 'all', label: 'All Bestsellers' },
  { id: 'seating', label: 'Lounge & Seating' },
  { id: 'tables', label: 'Dining & Tables' },
  { id: 'storage', label: 'Casegoods & Storage' },
  { id: 'decor', label: 'Decor & Inlay' },
  { id: 'lighting', label: 'Lighting' },
];

export const BestSellersClient: React.FC<BestSellersClientProps> = ({ products }) => {
  const { addEnquiry } = useEnquiry();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [addedId, setAddedId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'all') return products;
    return products.filter((p) => {
      const cat = (p.cat || '').toLowerCase();
      const type = (p.type || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      if (selectedFilter === 'seating') return cat.includes('seating') || type.includes('chair') || type.includes('sofa');
      if (selectedFilter === 'tables') return cat.includes('table') || type.includes('table') || type.includes('desk');
      if (selectedFilter === 'storage') return cat.includes('storage') || type.includes('cabinet') || type.includes('sideboard');
      if (selectedFilter === 'decor') return cat.includes('decor') || cat.includes('mirror') || name.includes('inlay');
      if (selectedFilter === 'lighting') return cat.includes('lighting') || type.includes('lamp') || type.includes('pendant');
      return true;
    });
  }, [products, selectedFilter]);

  const handleAdd = (p: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    addEnquiry({
      id: p.id,
      name: p.name,
      catName: p.catName,
      q: p.moq || 1,
      image: p.image,
      moq: p.moq,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <div className="wrap" style={{ padding: '36px 20px 80px' }}>
      {/* BREADCRUMBS */}
      <div className="crumbs" style={{ marginBottom: 24 }}>
        <Link href="/">Home</Link> / <span style={{ fontWeight: 600 }}>Best Sellers</span>
      </div>

      {/* HERO SECTION */}
      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 36, marginBottom: 36 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 12 }}>
          CONTRACT ICONS & SIGNATURE PIECES
        </span>
        <h1 className="disp" style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}>
          Bestselling Designs
        </h1>
        <p style={{ fontSize: 16.5, color: 'var(--ink-2)', maxWidth: '65ch', marginTop: 14, lineHeight: 1.6 }}>
          Our most specified contract furniture, handcrafted bone inlay consoles, solid timber tables, and architectural seating pieces commissioned for boutique hotels and luxury residences worldwide.
        </p>

        {/* FILTER TABS */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                  border: isActive ? '1px solid #111111' : '1px solid var(--line)',
                  background: isActive ? '#111111' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#444444',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '32px 24px',
        }}
      >
        {filteredProducts.map((p) => {
          const productSlug = getProductSlug(p);
          return (
            <div
              key={p.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              className="bestseller-card"
            >
              <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3', background: '#F4F2EB' }}>
                <Link href={`/product/${productSlug}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                  <img
                    src={p.image || '/categories/tables.jpg'}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
                    loading="lazy"
                  />
                </Link>
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(17, 17, 17, 0.88)',
                    color: '#FFFFFF',
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 4,
                    pointerEvents: 'none',
                  }}
                >
                  Bestseller
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite({
                      id: p.id,
                      name: p.name,
                      catName: p.catName || p.cat,
                      image: p.image,
                      moq: p.moq,
                      material: p.material,
                      finish: (p as any).finish || (p as any).color,
                      slug: getProductSlug(p),
                    });
                  }}
                  title={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                  aria-label={isFavorite(p.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: isFavorite(p.id) ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    transition: 'all 0.2s ease',
                    zIndex: 3,
                  }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill={isFavorite(p.id) ? '#B85735' : 'none'}
                    stroke={isFavorite(p.id) ? '#B85735' : '#111111'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 11.5, textTransform: 'uppercase', color: 'var(--ink-3)', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {p.catName || p.cat}
                </div>
                <span className="made-to-order-tag">Made-To-Order</span>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.35 }}>
                  <Link href={`/product/${productSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {p.name}
                  </Link>
                </h3>

                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 14 }}>
                  <span>{p.material || 'Solid Hardwood'}</span>
                  {p.segment && <span> &bull; {p.segment}</span>}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 14, borderTop: '1px solid #F0ECE4' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
                    MOQ: {p.moq || 1} pcs
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAdd(p, e)}
                    style={{
                      background: addedId === p.id ? '#2E7D32' : '#111111',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 14px',
                      fontSize: 12.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {addedId === p.id ? '✓ Added' : '+ Add to Enquiry'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
