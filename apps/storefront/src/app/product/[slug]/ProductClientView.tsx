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
  // Dynamically resolve product colors from WooCommerce backend payload
  const hasExplicitFinish = Boolean(
    ((product as any).availableColors && (product as any).availableColors.length > 0) ||
    (product.color && product.color.trim() !== '' && product.color !== 'Natural Oil')
  );

  const activeColorList: string[] = hasExplicitFinish
    ? ((product as any).availableColors && (product as any).availableColors.length > 0
        ? (product as any).availableColors
        : [product.color!])
    : [];

  const [selectedFinish, setSelectedFinish] = useState(activeColorList[0] || 'Custom to order');
  const [quantity, setQuantity] = useState(initialProduct.moq || 1);
  const [activePrice, setActivePrice] = useState<number | undefined>(initialProduct.price);

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
      if (typeof matchedVar.price === 'number' && matchedVar.price > 0) {
        setActivePrice(matchedVar.price);
      } else {
        setActivePrice(product.price);
      }
    } else {
      setActivePrice(product.price);
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
              {hasExplicitFinish && displaySwatches.length > 0 ? (
                <>
                  <label className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>
                    FINISH — {displaySwatches.length} VARIATION{displaySwatches.length > 1 ? 'S' : ''} ({selectedFinish || displaySwatches[0]?.n})
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
                </>
              ) : (
                <>
                  <label className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                    FINISH — CUSTOMISABLE TO ORDER
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAF7F2', padding: '10px 14px', borderRadius: 4, border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: 15 }}>🎨</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>
                      Raw natural wood, commercial wood stains, or powder-coat finishes customisable to your project spec.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* SPECIFICATION TABLE */}
            <table className="spec-table">
              <tbody>
                <tr>
                  <td>DIMENSIONS (W×D×H)</td>
                  <td>
                    {(() => {
                      if (Array.isArray(product.dims)) {
                        return `${product.dims[0]} × ${product.dims[1]} × ${product.dims[2]} cm — Customisable to order`;
                      }
                      const str = String(product.dims || '').trim();
                      if (!str || str.toLowerCase().includes('custom')) {
                        return 'Customisable to project spec';
                      }
                      return `${str} — Customisable to order`;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td>PRIMARY MATERIAL</td>
                  <td>{product.material || 'Solid Wood'}</td>
                </tr>
                <tr>
                  <td>FINISH / COATING</td>
                  <td>{hasExplicitFinish ? (selectedFinish || product.color) : 'Customisable to project spec'}</td>
                </tr>
                {product.material2 && product.material2.trim() !== '' && product.material2 !== 'None' && product.material2 !== 'Brass Detailing' && (
                  <tr>
                    <td>SECONDARY / DETAIL</td>
                    <td>{product.material2}</td>
                  </tr>
                )}
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
                  <td>INDICATIVE PRICE</td>
                  <td style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    {activePrice && activePrice > 0
                      ? `${product.currencySymbol || '₹'}${activePrice.toLocaleString()} ${product.currency || 'INR'} / unit`
                      : (product.priceNote || 'Quoted to your spec & quantity')}
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
                      id: activeSku || product.id,
                      name: hasExplicitFinish ? `${product.name} (${selectedFinish})` : product.name,
                      catName: product.catName,
                      q: quantity,
                      image: activeImage || product.image,
                      moq: product.moq,
                      material: product.material,
                      finish: hasExplicitFinish ? selectedFinish : 'Custom to order',
                      dims: Array.isArray(product.dims) ? product.dims.join(' × ') + ' cm' : product.dims,
                      unitPrice: activePrice || product.price || 0,
                      currency: product.currency || 'INR',
                      currencySymbol: product.currencySymbol || '₹',
                      slug: product.slug,
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
                      finish: hasExplicitFinish ? selectedFinish : 'Custom to order',
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

      {/* DETAILED SPECIFICATIONS & ARCHITECTURAL OVERVIEW */}
      <section className="blk tight" style={{ borderTop: '1px solid var(--line)', marginTop: 40, paddingTop: 48, paddingBottom: 16 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(28px, 4vw, 56px)', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: FULL DESCRIPTION & DESIGN NOTES */}
            <div>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 12 }}>
                OVERVIEW & CRAFT DETAILS
              </span>
              <h2 className="disp" style={{ fontSize: 'clamp(24px, 2.6vw, 32px)', fontWeight: 400, margin: '0 0 16px', lineHeight: 1.25 }}>
                {product.name}
              </h2>
              <p style={{ color: 'var(--ink-1)', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
                {product.description || product.shortDescription}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                <span style={{ background: '#FAF7F2', border: '1px solid var(--line)', padding: '6px 14px', fontSize: 13, borderRadius: 4, color: 'var(--ink-1)' }}>
                  🪵 <strong>Material:</strong> {product.material || 'Solid Wood'}
                </span>
                {hasExplicitFinish && selectedFinish && selectedFinish !== 'Custom to order' && (
                  <span style={{ background: '#FAF7F2', border: '1px solid var(--line)', padding: '6px 14px', fontSize: 13, borderRadius: 4, color: 'var(--ink-1)' }}>
                    🎨 <strong>Finish:</strong> {selectedFinish}
                  </span>
                )}
                <span style={{ background: '#FAF7F2', border: '1px solid var(--line)', padding: '6px 14px', fontSize: 13, borderRadius: 4, color: 'var(--ink-1)' }}>
                  📐 <strong>Custom Dimensions:</strong> Built to project drawing
                </span>
                <span style={{ background: '#FAF7F2', border: '1px solid var(--line)', padding: '6px 14px', fontSize: 13, borderRadius: 4, color: 'var(--ink-1)' }}>
                  📦 <strong>MOQ:</strong> {product.moq} {product.moq === 1 ? 'unit' : 'units'}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: B2B TRADE & CONTRACT SPECIFICATION CARD */}
            <div style={{ background: '#FAF7F2', border: '1px solid var(--line)', borderRadius: 8, padding: '28px 24px' }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 16 }}>
                HOSPITALITY & CONTRACT MANUFACTURING
              </span>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 16 }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--ink-1)' }}>Custom Finish Matching:</strong>
                    <div style={{ fontSize: 13, marginTop: 2 }}>Wood stains, PU lacquers, and powder coatings customisable to control samples.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 16 }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--ink-1)' }}>Commercial Grade Build:</strong>
                    <div style={{ fontSize: 13, marginTop: 2 }}>Kiln-dried sustainable hardwoods and reinforced joinery engineered for high-traffic environments.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 16 }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--ink-1)' }}>Export Packing:</strong>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{product.packing || 'Export-grade carton, knock-down where possible'}.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 16 }}>✓</span>
                  <div>
                    <strong style={{ color: 'var(--ink-1)' }}>Production Lead Time:</strong>
                    <div style={{ fontSize: 13, marginTop: 2 }}>{product.leadTimeText || `${product.lead} working days after sample approval`}.</div>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

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
