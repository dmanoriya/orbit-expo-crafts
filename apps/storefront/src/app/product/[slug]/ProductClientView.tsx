'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { FINISHES, ProductItem } from '../../../data/catalogData';
import { useEnquiry } from '../../../context/EnquiryContext';
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

  return (
    <div className="wrap">
      {/* BREADCRUMBS */}
      <div className="crumbs">
        <Link href="/">HOME</Link> / <Link href="/collections">COLLECTIONS</Link> /{' '}
        <Link href={`/collections/${product.cat}`}>{product.catName.toUpperCase()}</Link> / {product.name.toUpperCase()}
      </div>

      {/* PDP GRID */}
      <div className="pd" style={{ paddingBottom: 60 }}>
        {/* LEFT GALLERY */}
        <div className="gallery">
          <div className="main" style={{ position: 'relative' }}>
            {product.badge && (
              <span className={`tag ${product.badge === 'New' ? 'new' : ''}`}>
                {product.badge}
              </span>
            )}
            <img src={activeImage || product.image} alt={product.name} />
          </div>
          {initialGallery.length > 1 && (
            <div className="strip">
              {initialGallery.map((img, idx) => (
                <button
                  key={idx}
                  className={activeImage === img ? 'on' : ''}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`${product.name} view ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className="note" style={{ marginTop: 18, fontSize: 13, color: 'var(--ink-2)', background: 'var(--surface-2)', padding: '14px 18px', borderRadius: 'var(--r-md)' }}>
            Real factory photography. Made-to-order contract specification with downloadable CAD/3D block files for architects & specifiers.
          </div>
        </div>

        {/* RIGHT SPECS & QUOTE ACTION */}
        <div>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
            {activeSku || product.sku || product.id} · {product.catName}
          </span>
          <h1 className="disp" style={{ fontSize: 38, margin: '8px 0 14px', fontWeight: 400 }}>
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
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="qty-mini" style={{ height: 44, padding: '0 4px', background: '#fff' }}>
                <button
                  style={{
                    width: 32,
                    height: 44,
                    fontSize: 16,
                    opacity: quantity <= (product.moq || 1) ? 0.35 : 1,
                    cursor: quantity <= (product.moq || 1) ? 'not-allowed' : 'pointer',
                  }}
                  disabled={quantity <= (product.moq || 1)}
                  onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                >
                  -
                </button>
                <span style={{ fontSize: 15, padding: '0 12px' }}>{quantity}</span>
                <button style={{ width: 32, height: 44, fontSize: 16 }} onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1, justifyContent: 'center', height: 44 }}
                onClick={() =>
                  addEnquiry({
                    id: product.id,
                    name: `${product.name} (${selectedFinish})`,
                    catName: product.catName,
                    q: quantity,
                    image: product.image,
                    moq: product.moq,
                  })
                }
              >
                + Add to Enquiry
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

          {/* TRUST CARDS */}
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
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
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
                    {p.badge && (
                      <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>
                        {p.badge}
                      </span>
                    )}
                    <Link href={`/product/${p.id}`}>
                      <img src={p.image || '/fallback-product.svg'} alt={p.name} loading="lazy" />
                    </Link>
                    <div className="acts">
                      <Link href={`/product/${p.id}`} className="btn btn-soft btn-sm">
                        Details
                      </Link>
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
