'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FINISHES, ProductItem, getProductSlug } from '../../../data/catalogData';
import { useEnquiry } from '../../../context/EnquiryContext';
import { useFavorites } from '../../../context/FavoritesContext';
import SampleCadModal from '../../../components/SampleCadModal';

interface ProductClientViewProps {
  initialProduct: ProductItem;
  initialGallery: string[];
  relatedProducts: ProductItem[];
}

export default function ProductClientView({
  initialProduct,
  initialGallery,
  relatedProducts,
}: ProductClientViewProps) {
  const { addEnquiry } = useEnquiry();
  const { isFavorite, toggleFavorite } = useFavorites();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sample' | 'cad'>('sample');

  const openSampleModal = () => {
    setModalType('sample');
    setIsModalOpen(true);
  };

  const openCadModal = () => {
    setModalType('cad');
    setIsModalOpen(true);
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const product = initialProduct;
  const [activeImage, setActiveImage] = useState<string>(
    initialGallery[0] || initialProduct.image || '/fallback-product.svg'
  );
  const [activeSku, setActiveSku] = useState<string>(
    initialProduct.sku || initialProduct.id || ''
  );
  const [selectedFinish, setSelectedFinish] = useState(FINISHES[0].n);
  const [quantity, setQuantity] = useState(initialProduct.moq || 1);

  // Dynamically resolve product colors from WooCommerce backend payload
  const activeColorList = (product as any).availableColors && (product as any).availableColors.length > 0
    ? (product as any).availableColors
    : product.color ? [product.color] : FINISHES.map((f) => f.n);

  const displaySwatches = activeColorList.map((colorName: string) => {
    const matched = FINISHES.find((f) => f.n.toLowerCase() === colorName.toLowerCase());
    return {
      n: colorName,
      c: matched ? matched.c : '#C4A482',
    };
  });

  const handleFinishSelect = (colorName: string) => {
    setSelectedFinish(colorName);
    const variations = (product as any)?.variations || [];
    const matchedVar = variations.find(
      (v: any) => v.color?.toLowerCase() === colorName.toLowerCase() || v.colorSlug?.toLowerCase() === colorName.toLowerCase().replace(/\s+/g, '-')
    );
    if (matchedVar) {
      if (matchedVar.image) {
        setActiveImage(matchedVar.image);
      }
      if (matchedVar.sku) {
        setActiveSku(matchedVar.sku);
      }
    }
  };

  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem('orbit_recently_viewed');
      const existing: any[] = raw ? JSON.parse(raw) : [];
      const item = {
        id: product.id,
        name: product.name,
        catName: product.catName,
        image: activeImage || product.image || '/fallback-product.svg',
        slug: getProductSlug(product),
      };
      const filtered = existing.filter((x: any) => String(x.id) !== String(product.id));
      const updated = [item, ...filtered].slice(0, 8);
      localStorage.setItem('orbit_recently_viewed', JSON.stringify(updated));
      setRecentProducts(filtered.slice(0, 4));
    } catch (err) {
      console.error('Error saving recently viewed:', err);
    }
  }, [product.id, activeImage]);

  return (
    <div className="wrap">
      {/* BREADCRUMBS */}
      <div className="crumbs">
        <Link href="/">HOME</Link> / <Link href="/collections">COLLECTIONS</Link> /{' '}
        <Link href={`/collections/${product.cat}`}>{product.catName.toUpperCase()}</Link> / {product.name.toUpperCase()}
      </div>

      {/* PDP TOP ROW: MAIN IMAGE STRETCHED TO MATCH RIGHT SPECS + ACTION CARD */}
      <div className="pdp-layout-wrap" style={{ paddingBottom: 40 }}>
        <div className="pdp-top-grid">
          {/* LEFT: MAIN PRODUCT IMAGE */}
          <div className="gallery-main" style={{ position: 'relative' }}>
            {product.badge && (
              <span className={`tag ${product.badge === 'New' ? 'new' : ''}`}>
                {product.badge}
              </span>
            )}
            <img
              src={activeImage || product.image}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = product.cat ? `/categories/${product.cat}.jpg` : '/fallback-product.svg';
              }}
            />
          </div>

          {/* RIGHT SPECS & QUOTE ACTION */}
          <div className="pdp-info-col">
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
              {activeSku || product.sku || product.id} · {product.catName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, marginBottom: 2 }}>
              <span className="made-to-order-tag">Made-To-Order</span>
            </div>
            <h1 className="disp" style={{ fontSize: 'clamp(28px, 3.2vw, 40px)', margin: '6px 0 14px', fontWeight: 400, lineHeight: 1.15 }}>
              {product.name}
            </h1>

            <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              {product.shortDescription || product.description || `Built to order in solid wood with custom detailing. Specified most often for resort villas and commercial projects. Dimensions, finish and upholstery are all changeable.`}
            </p>

            {/* FINISHES SECTION */}
            <div className="pdp-finish-section" style={{ marginBottom: 24 }}>
              <label className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>
                FINISH — {displaySwatches.length} VARIATIONS ({selectedFinish || displaySwatches[0]?.n})
              </label>
              <div className="swatches" style={{ margin: 0 }}>
                {displaySwatches.map((f: any) => (
                  <button
                    key={f.n}
                    className={`sw ${selectedFinish === f.n ? 'on' : ''}`}
                    style={{ background: f.c }}
                    title={f.n}
                    onClick={() => handleFinishSelect(f.n)}
                  />
                ))}
              </div>
            </div>

            {/* SPECIFICATION TABLE */}
            <table className="spec-table">
              <tbody>
                <tr>
                  <td>DIMENSIONS (W×D×H)</td>
                  <td>
                    {Array.isArray(product.dims)
                      ? `${product.dims[0]} × ${product.dims[1]} × ${product.dims[2]} cm — customisable`
                      : (product.dims.includes('customisable') ? product.dims : `${product.dims} — customisable`)}
                  </td>
                </tr>
                <tr>
                  <td>PRIMARY MATERIAL</td>
                  <td>{product.material}</td>
                </tr>
                <tr>
                  <td>SECONDARY / DETAIL</td>
                  <td>{product.material2 || 'Brass Detailing'}</td>
                </tr>
                <tr>
                  <td>MINIMUM ORDER</td>
                  <td>{product.moq} {product.moq === 1 ? 'unit' : 'units'}</td>
                </tr>
                <tr>
                  <td>LEAD TIME</td>
                  <td>{product.leadTimeText || `${product.lead} working days after sample approval`}</td>
                </tr>
                <tr>
                  <td>PACKING</td>
                  <td>{product.packing || 'Export-grade carton, knock-down where possible'}</td>
                </tr>
                <tr>
                  <td>PRICE</td>
                  <td style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    {product.priceNote || 'Quoted to your spec & quantity'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ACTION BOX CONTAINER CARD */}
            <div className="pdp-action-card">
              <div className="pdp-actions-row">
                <div className="qty-mini pdp-qty-picker">
                  <button
                    type="button"
                    style={{
                      width: 28,
                      height: 44,
                      fontSize: 16,
                      opacity: quantity <= (product.moq || 1) ? 0.35 : 1,
                      cursor: quantity <= (product.moq || 1) ? 'not-allowed' : 'pointer',
                    }}
                    disabled={quantity <= (product.moq || 1)}
                    onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="pdp-qty-val">{quantity}</span>
                  <button
                    type="button"
                    style={{ width: 28, height: 44, fontSize: 16 }}
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary pdp-enquiry-btn"
                  onClick={() =>
                    addEnquiry({
                      id: product.id,
                      name: `${product.name} (${selectedFinish})`,
                      catName: product.catName,
                      q: quantity,
                      image: activeImage || product.image,
                      moq: product.moq,
                    })
                  }
                >
                  + Add to Enquiry
                </button>

                <button
                  type="button"
                  className="pdp-fav-btn"
                  onClick={() =>
                    toggleFavorite({
                      id: product.id,
                      name: product.name,
                      catName: product.catName,
                      image: activeImage || product.image,
                      moq: product.moq,
                      material: product.material,
                      finish: selectedFinish,
                      slug: getProductSlug(product),
                    })
                  }
                  title={isFavorite(product.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                  aria-label={isFavorite(product.id) ? 'Remove from Favourites' : 'Save to Favourites'}
                  style={{
                    border: isFavorite(product.id) ? '1.5px solid #B85735' : '1px solid var(--line)',
                    background: isFavorite(product.id) ? '#FDF6F3' : '#FFFFFF',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={isFavorite(product.id) ? '#B85735' : 'none'}
                    stroke={isFavorite(product.id) ? '#B85735' : '#111111'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              <div className="pdp-sub-links">
                <button className="sub-link-btn" onClick={openSampleModal}>
                  🎨 Request finish samples
                </button>
                <button className="sub-link-btn" onClick={openCadModal}>
                  📐 Ask for a CAD block
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PDP BOTTOM ROW: THUMBNAILS ON LEFT, TRUST CARDS ON RIGHT */}
        <div className="pdp-bottom-grid">
          {/* LEFT: THUMBNAILS STRIP */}
          <div className="gallery-strip">
            {initialGallery.length > 1 &&
              initialGallery.map((img, idx) => (
                <button
                  key={idx}
                  className={activeImage === img ? 'on' : ''}
                  onClick={() => setActiveImage(img)}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = product.cat ? `/categories/${product.cat}.jpg` : '/fallback-product.svg';
                    }}
                  />
                </button>
              ))}
          </div>

          {/* RIGHT: TRUST CARDS */}
          <div className="pdp-trust-grid">
            <div className="pdp-trust-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Prototype before bulk</span>
            </div>

            <div className="pdp-trust-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>Door-to-door freight</span>
            </div>

            <div className="pdp-trust-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 7 0 6-4.5 11-10 11z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <span>FSC & low-VOC options</span>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS CAROUSEL */}
      {relatedProducts.length > 0 && (
        <section className="blk tight" style={{ borderTop: '1px solid var(--line)', marginTop: 20, paddingTop: 48 }}>
          <div className="sec-head" style={{ marginBottom: 24, alignItems: 'center' }}>
            <div>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>
                ALSO IN {product.catName.toUpperCase()}
              </span>
              <h2 className="disp" style={{ fontSize: 32, marginTop: 4 }}>
                Pieces that sit well with this.
              </h2>
            </div>

            <div className="carousel-nav-btns">
              <button className="carousel-arrow" onClick={scrollLeft} aria-label="Previous products">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <button className="carousel-arrow" onClick={scrollRight} aria-label="Next products">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>

          <div className="rel-carousel-wrapper">
            <div className="rel-carousel-track" ref={carouselRef}>
              {relatedProducts.map((p) => (
                <article key={p.id} className="card">
                  <div className="thumb">
                    {p.badge && p.badge.toLowerCase() !== 'none' && (
                      <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>
                        {p.badge}
                      </span>
                    )}
                    <Link href={`/product/${getProductSlug(p)}`}>
                      <img
                        src={p.image || '/fallback-product.svg'}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = p.cat ? `/categories/${p.cat}.jpg` : '/fallback-product.svg';
                        }}
                      />
                    </Link>
                    <div className="acts">
                      <Link href={`/product/${getProductSlug(p)}`} className="btn btn-soft btn-sm">
                        Details
                      </Link>
                    </div>
                  </div>
                  <div className="body">
                    <span className="meta">{p.catName || p.type || 'FURNITURE'}</span>
                    <span className="made-to-order-tag">Made-To-Order</span>
                    <Link href={`/product/${getProductSlug(p)}`}>
                      <h4>{p.name}</h4>
                    </Link>
                    <span className="price-note">Price on request</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECENTLY VIEWED PRODUCTS SECTION (EXACT SAME PROD-GRID CARDS AS ABOVE) */}
      {recentProducts.length > 0 && (
        <section className="blk tight" style={{ borderTop: '1px solid var(--line)', marginTop: 40, paddingTop: 48 }}>
          <div className="sec-head" style={{ marginBottom: 24 }}>
            <div>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>
                YOUR BROWSING HISTORY
              </span>
              <h2 className="disp" style={{ fontSize: 32, marginTop: 4 }}>
                Recently Viewed
              </h2>
            </div>
          </div>
          <div className="pdp-recent-grid">
            {recentProducts.map((p) => (
              <article key={p.id} className="card">
                <div className="thumb">
                  <Link href={`/product/${getProductSlug(p)}`}>
                    <img src={p.image || '/fallback-product.svg'} alt={p.name} loading="lazy" />
                  </Link>
                  <div className="acts">
                    <Link href={`/product/${getProductSlug(p)}`} className="btn btn-soft btn-sm">
                      Details
                    </Link>
                  </div>
                </div>
                <div className="body">
                  <span className="meta">{p.catName || p.type || 'FURNITURE'}</span>
                  <span className="made-to-order-tag">Made-To-Order</span>
                  <Link href={`/product/${getProductSlug(p)}`}>
                    <h4>{p.name}</h4>
                  </Link>
                  <span className="price-note">Price on request</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* MULTI-STEP SAMPLE & CAD REQUEST MODAL */}
      {isModalOpen && (
        <SampleCadModal
          key={modalType}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          requestType={modalType}
          productName={product?.name || 'Selected Product'}
          productImage={activeImage || product?.image || '/fallback-product.svg'}
          productMoq={product?.moq || 1}
          initialFinish={selectedFinish}
        />
      )}
    </div>
  );
}
