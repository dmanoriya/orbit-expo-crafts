'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FINISHES, ProductItem, MOCK_PRODUCTS } from '../../../data/catalogData';
import { useEnquiry } from '../../../context/EnquiryContext';
import { fetchWpProductBySlug, fetchWpStorefrontData, getSynchronousProduct } from '../../../lib/wpCommerce';
import SampleCadModal from '../../../components/SampleCadModal';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
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

  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [allProducts, setAllProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string>('/fallback-product.svg');
  const [activeSku, setActiveSku] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState(FINISHES[0].n);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // AUTO SCROLL TO TOP & ASYNC REVALIDATION (NON-BLOCKING FAST RENDER)
  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
    let isMounted = true;

    if (slug) {
      const syncProd = getSynchronousProduct(slug);
      if (syncProd) {
        setProduct(syncProd);
        setActiveSku(syncProd.sku || syncProd.id || '');
        setQuantity(syncProd.moq || 1);
        const gal = [syncProd.image, ...(syncProd.gallery || [])].filter(Boolean) as string[];
        setGalleryImages(gal);
        setActiveImage(syncProd.image || '/fallback-product.svg');
        setLoading(false);
      }
    }

    async function loadProduct() {
      if (!slug) return;

      // 1. Fetch single product API immediately for fast response
      fetchWpProductBySlug(slug).then((res) => {
        if (!isMounted) return;
        if (res.product) {
          setProduct(res.product);
          setActiveSku(res.product.sku || res.product.id || '');
          setQuantity((prev) => (prev === 1 ? res.product!.moq || 1 : prev));
          setGalleryImages(res.gallery);
          setActiveImage((prev) =>
            prev && prev !== '/fallback-product.svg'
              ? prev
              : res.gallery[0] || res.product?.image || '/fallback-product.svg'
          );
        }
        setLoading(false);
      });

      // 2. Fetch full catalog in background for related items
      fetchWpStorefrontData()
        .then((sfData) => {
          if (!isMounted || !sfData) return;
          if (sfData.products.length > 0) {
            setAllProducts(sfData.products);
          }
        })
        .catch(() => null);
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!mounted || loading) {
    return (
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 80, minHeight: '75vh' }}>
        {/* BREADCRUMB SKELETON */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
          <div className="skeleton" style={{ height: 11, width: 42, borderRadius: 3 }} />
          <span style={{ color: 'var(--line)', fontSize: 11 }}>/</span>
          <div className="skeleton" style={{ height: 11, width: 75, borderRadius: 3 }} />
          <span style={{ color: 'var(--line)', fontSize: 11 }}>/</span>
          <div className="skeleton" style={{ height: 11, width: 60, borderRadius: 3 }} />
          <span style={{ color: 'var(--line)', fontSize: 11 }}>/</span>
          <div className="skeleton" style={{ height: 11, width: 110, borderRadius: 3 }} />
        </div>

        {/* PDP GRID SKELETON */}
        <div className="pd" style={{ paddingBottom: 60 }}>
          {/* LEFT GALLERY SKELETON */}
          <div className="gallery">
            <div className="main skeleton" style={{ width: '100%', aspectRatio: '4/3', borderRadius: 'var(--r-md)', minHeight: 380 }} />
            <div className="strip" style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ width: 64, height: 64, borderRadius: 'var(--r-sm)' }} />
              ))}
            </div>
          </div>

          {/* RIGHT SPECS SKELETON */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 3 }} />
            <div className="skeleton" style={{ height: 38, width: '80%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 15, width: '95%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 15, width: '70%', borderRadius: 4 }} />

            <div style={{ margin: '12px 0 16px' }}>
              <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 3, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="skeleton" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                ))}
              </div>
            </div>

            <div className="skeleton" style={{ height: 50, width: '100%', borderRadius: 'var(--r-md)', marginTop: 8 }} />
            <div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 'var(--r-md)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wrap" style={{ padding: '100px 28px', textAlign: 'center', minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: 12 }}>
          404 ERROR
        </span>
        <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 16, fontWeight: 400 }}>
          Product Not Found
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, maxWidth: 460, marginBottom: 32, lineHeight: 1.6 }}>
          The product you are looking for has been removed, deleted, or is no longer available in our catalogue.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/catalogue" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            BROWSE CATALOGUE
          </Link>
          <Link href="/" className="btn btn-outline" style={{ padding: '12px 24px' }}>
            BACK TO HOME
          </Link>
        </div>
      </div>
    );
  }

  const related = allProducts
    .filter((x) => String(x.id) !== String(product.id) && (x.cat === product.cat || x.catName === product.catName))
    .slice(0, 12);

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
        <Link href="/">HOME</Link> / <Link href="/catalogue">CATALOGUE</Link> /{' '}
        <Link href={`/catalogue/${product.cat}`}>{product.catName.toUpperCase()}</Link> / {product.name.toUpperCase()}
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
          {galleryImages.length > 1 && (
            <div className="strip">
              {galleryImages.map((img, idx) => (
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

          {/* FINISHES SECTION (DYNAMICALLY FETCHED FROM WOOCOMMERCE BACKEND) */}
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

          {/* SPECIFICATION TABLE MATCHING REFERENCE IMAGE */}
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
                + Add to Enquiry List
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

          {/* 3 TRUST CARDS BELOW ACTION CARD */}
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
      {related.length > 0 && (
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
              {related.map((p) => (
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
          </div>
        </section>
      )}

      {/* MULTI-STEP SAMPLE & CAD REQUEST MODAL */}
      <SampleCadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestType={modalType}
        productName={product.name}
        productImage={activeImage || product.image}
        productMoq={product.moq}
        initialFinish={selectedFinish}
      />
    </div>
  );
}
