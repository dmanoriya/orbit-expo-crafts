'use client';

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '../context/FavoritesContext';
import { useEnquiry } from '../context/EnquiryContext';
import { useProductGridConfig } from '../context/ProductGridContext';
import { getProductSlug } from '../data/catalogData';

export interface ProductCardProps {
  product: any;
  className?: string;
  priorityImage?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product: p,
  className = '',
  priorityImage = false,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addEnquiry } = useEnquiry();
  const { gridConfig } = useProductGridConfig();

  const slug = getProductSlug(p);
  const imageUrl = (p as any).img || p.image || (p as any).thumbnail || '/fallback-product.svg';
  const categoryName = p.catName || (p as any).category || p.type || 'FURNITURE';
  const badge = p.badge && p.badge.toLowerCase() !== 'none' ? p.badge : null;
  const isFav = isFavorite(p.id);

  const shadowClass = gridConfig.card_shadow === 'hover_float' ? 'shadow-hover-float' : '';

  const handleEnquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addEnquiry({
      id: p.id,
      name: p.name,
      catName: categoryName,
      q: p.moq || 1,
      image: imageUrl,
      moq: p.moq || 1,
      unitPrice: p.price || 0,
      currency: p.currency || 'INR',
      currencySymbol: p.currencySymbol || '₹',
      material: p.material,
      finish: (p as any).color || (p as any).finish,
      slug: slug,
    });
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: p.id,
      name: p.name,
      catName: categoryName,
      image: imageUrl,
      moq: p.moq || 1,
      material: p.material,
      finish: (p as any).color || (p as any).finish,
      slug: slug,
    });
  };

  return (
    <article className={`card ${shadowClass} ${className}`.trim()}>
      <div className="thumb" style={{ position: 'relative' }}>
        {/* BADGE */}
        {badge && gridConfig.show_badge === 'yes' && (
          <span className={`tag ${badge.toLowerCase() === 'new' ? 'new' : ''}`}>
            {badge}
          </span>
        )}

        {/* FAVOURITE / WISHLIST BUTTON */}
        {gridConfig.show_favorite === 'yes' && (
          <button
            type="button"
            className="card-fav-btn"
            onClick={handleFav}
            title={isFav ? 'Remove from Favourites' : 'Save to Favourites'}
            aria-label={isFav ? 'Remove from Favourites' : 'Save to Favourites'}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isFav ? '#FFFFFF' : 'rgba(255, 255, 255, 0.92)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              display: gridConfig.show_favorite === 'yes' ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={isFav ? '#B85735' : 'none'}
              stroke={isFav ? '#B85735' : '#111111'}
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}

        {/* MAIN PRODUCT IMAGE */}
        <Link href={`/product/${slug}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          <img
            src={imageUrl}
            alt={p.name}
            loading={priorityImage ? 'eager' : 'lazy'}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = (p as any).cat ? `/categories/${(p as any).cat}.jpg` : '/fallback-product.svg';
            }}
          />
        </Link>

        {/* HOVER OVERLAY QUICK ACTIONS */}
        {gridConfig.show_actions === 'yes' && gridConfig.actions_mode === 'hover_overlay' && (
          <div className="acts">
            {gridConfig.show_details_btn === 'yes' && (
              <Link href={`/product/${slug}`} className="btn btn-soft btn-sm btn-details">
                {gridConfig.details_btn_text || 'Details'}
              </Link>
            )}
            {gridConfig.show_enquiry_btn === 'yes' && (
              <button
                type="button"
                className="btn btn-primary btn-sm btn-enquiry"
                onClick={handleEnquiry}
              >
                {gridConfig.enquiry_btn_text || '+ Enquiry'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* CARD BODY */}
      <div className="body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
          {gridConfig.show_category === 'yes' && (
            <span className="meta">{categoryName}</span>
          )}
          {gridConfig.show_made_to_order === 'yes' && (
            <span className="made-to-order-tag">Made-To-Order</span>
          )}
        </div>

        <Link href={`/product/${slug}`}>
          <h4>{p.name}</h4>
        </Link>

        {/* MOQ & PRODUCTION LEAD TIME */}
        {gridConfig.show_moq_lead === 'yes' && (
          <div
            className="card-moq-lead"
            style={{
              display: gridConfig.show_moq_lead === 'yes' ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 12,
              color: 'var(--ink-3)',
            }}
          >
            <span>MOQ: <strong style={{ color: 'var(--ink)' }}>{p.moq || 1} units</strong></span>
            <span>Lead: <strong style={{ color: 'var(--ink)' }}>{p.lead || (p as any).leadTime || 21}d</strong></span>
          </div>
        )}

        {/* PRICE NOTE */}
        {gridConfig.show_price_note === 'yes' && (
          <span className="price-note">
            {gridConfig.price_note_text || 'Price on request'}
          </span>
        )}

        {/* INLINE ACTION BUTTONS (IF MODE IS ALWAYS_VISIBLE) */}
        {gridConfig.show_actions === 'yes' && gridConfig.actions_mode === 'always_visible' && (
          <div
            className="acts-inline"
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid var(--line, #ECE7DE)',
            }}
          >
            {gridConfig.show_details_btn === 'yes' && (
              <Link
                href={`/product/${slug}`}
                className="btn btn-soft btn-sm btn-details"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {gridConfig.details_btn_text || 'Details'}
              </Link>
            )}
            {gridConfig.show_enquiry_btn === 'yes' && (
              <button
                type="button"
                className="btn btn-primary btn-sm btn-enquiry"
                onClick={handleEnquiry}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {gridConfig.enquiry_btn_text || '+ Enquiry'}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
