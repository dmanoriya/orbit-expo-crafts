'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SEGMENTS, MATERIALS, MOCK_PRODUCTS, ProductItem } from '../data/catalogData';
import { useEnquiry } from '../context/EnquiryContext';
import {
  fetchWpStorefrontData,
  fetchWpHomepageData,
  WpCategoryItem,
  HomepageData,
  DEFAULT_HOMEPAGE_DATA,
} from '../lib/wpCommerce';

interface HomeClientViewProps {
  initialProducts: ProductItem[];
  initialCategories: WpCategoryItem[];
  initialHpData: HomepageData;
  isWpConnected: boolean;
}

export default function HomeClientView({
  initialProducts,
  initialCategories,
  initialHpData,
  isWpConnected: initialWpConnected,
}: HomeClientViewProps) {
  const { addEnquiry } = useEnquiry();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts || MOCK_PRODUCTS);
  const [categories, setCategories] = useState<WpCategoryItem[]>(initialCategories || []);
  const [hpData, setHpData] = useState<HomepageData>(initialHpData || DEFAULT_HOMEPAGE_DATA);
  const [isWpConnected, setIsWpConnected] = useState(initialWpConnected);

  // Client-side re-sync on client mount for soft navigations
  useEffect(() => {
    async function refreshData() {
      const [sfData, homepageConfig] = await Promise.all([
        fetchWpStorefrontData(),
        fetchWpHomepageData(),
      ]);
      setProducts(sfData.products);
      setCategories(sfData.categories);
      setIsWpConnected(sfData.isWpConnected);
      setHpData(homepageConfig);
    }
    refreshData();
  }, []);

  const featured = products.slice(0, 6);

  // Helper to split bullet points string into array
  const parsePoints = (str: string) =>
    str
      ? str
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

  const track1Points = parsePoints(hpData.track1_points);
  const track2Points = parsePoints(hpData.track2_points);

  // Fallback 10 categories matching prototype
  const fallbackCategories = [
    { id: 'seating', name: 'Seating & Chairs', count: 42, desc: 'Dining, lounge & accent chairs', image: '/categories/seating.jpg' },
    { id: 'tables', name: 'Tables & Dining', count: 28, desc: 'Dining, coffee & side tables', image: '/categories/tables.jpg' },
    { id: 'sofas', name: 'Sofas & Lounges', count: 18, desc: 'Contract sofas & banquettes', image: '/categories/sofas.jpg' },
    { id: 'beds', name: 'Beds & Nightstands', count: 15, desc: 'Headboards, platforms & nightstands', image: '/categories/beds.jpg' },
    { id: 'storage', name: 'Credenzas & Storage', count: 22, desc: 'Sideboards, dressers & wardrobes', image: '/categories/storage.jpg' },
    { id: 'outdoor', name: 'Outdoor & Patio', count: 12, desc: 'Weather-resistant teak & metal', image: '/categories/outdoor.jpg' },
    { id: 'lighting', name: 'Lighting', count: 16, desc: 'Pendants, floor & table lamps', image: '/categories/lighting.jpg' },
    { id: 'decor', name: 'Decor & Objects', count: 25, desc: 'Artifacts, mirrors & accessories', image: '/categories/decor.jpg' },
    { id: 'benches', name: 'Benches & Ottomans', count: 10, desc: 'Custom hallway & footrest benches', image: '/categories/benches.jpg' },
    { id: 'fitout', name: 'Fit-out & Counters', count: 14, desc: 'Bar stools & counter units', image: '/categories/fitout.jpg' },
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  // Project domain spaces with background images matching prototype
  const projectSpaces = [
    { id: 'hotel-guestrooms', name: 'Hotel Guestrooms', subtitle: '45-60 day package delivery', image: '/categories/beds.jpg' },
    { id: 'hotel-lobby', name: 'Hotel Lobby', subtitle: 'Statement lounge & reception', image: '/categories/sofas.jpg' },
    { id: 'restaurant', name: 'Restaurant', subtitle: 'Heavy contract durability', image: '/categories/tables.jpg' },
    { id: 'cafe', name: 'Café & Bistro', subtitle: 'Compact seating & tables', image: '/categories/seating.jpg' },
    { id: 'bar-nightclub', name: 'Bar & Nightclub', subtitle: 'Bespoke counters & high-seating', image: '/categories/fitout.jpg' },
  ];

  // Hero Image Slider slides
  const heroSlides = [
    { id: 1, image: '/categories/decor.jpg', alt: 'Bone Inlay Console & Rajasthan Crafts' },
    { id: 2, image: '/categories/sofas.jpg', alt: 'Luxury Hotel Suite & Contract Seating' },
    { id: 3, image: '/categories/tables.jpg', alt: 'Solid Wood Dining & Fine Joinery' },
    { id: 4, image: '/categories/beds.jpg', alt: 'Turnkey Bedroom Suite Packages' },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div>
      {/* 1. LIGHT THEME HERO SECTION MATCHING REFERENCE DESIGN */}
      <section className="hero-light-layout">
        <div className="wrap">
          <div className="hero-split-grid">
            {/* LEFT COLUMN: TYPOGRAPHY & 2-COLUMN TRACK CARDS */}
            <div className="hero-left">
              <div className="mono hero-eyebrow">
                {hpData.hero_eyebrow || 'DIRECT FACTORY · EST. 2011'}
              </div>

              <h1 className="disp hero-title">
                {hpData.hero_title || 'Furniture that arrives project-ready.'}
              </h1>

              <p className="hero-lede">
                {hpData.hero_lede || 'We engineer and build furniture, casegoods, lighting and fixed joinery to project drawings for luxury hotels, resorts, fine dining and international export projects.'}
              </p>

              {/* 2-COLUMN SPLIT TRACKS */}
              <div className="hero-split-tracks">
                <div className="hero-track">
                  <h3>{hpData.track1_title || 'Direct contract projects'}</h3>
                  <p>{hpData.track1_desc || 'Full-scope loose furniture and fixed joinery built to architect specifications.'}</p>
                  <ul className="track-bullets">
                    {(track1Points.length > 0 ? track1Points : [
                      'Kiln-dried & anti-borer treated timber',
                      'Custom stain matching & fabric approvals',
                      'CAD/3D shop drawing review',
                      'Door-to-door freight & logistics'
                    ]).map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                  <Link href="/catalogue" className="track-link">
                    Browse 2026 Catalogue →
                  </Link>
                </div>

                <div className="hero-track">
                  <h3>{hpData.track2_title || 'Turnkey plug-in packages'}</h3>
                  <p>{hpData.track2_desc || 'Pre-engineered room packages for rapid hotel and restaurant fit-outs.'}</p>
                  <ul className="track-bullets">
                    {(track2Points.length > 0 ? track2Points : [
                      'FSC certified wood options',
                      'Flexible order quantities',
                      'Defined production schedules',
                      'Site installation support'
                    ]).map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                  <Link href="/turnkey" className="track-link">
                    Explore Room Packages →
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SLIDER OF IMAGES ONE BY ONE */}
            <div className="hero-right">
              <div className="hero-slider-box">
                {heroSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
                  >
                    <img src={slide.image} alt={slide.alt} />
                  </div>
                ))}
                <div className="crafted-badge">CRAFTED IN RAJASTHAN</div>

                <div className="slider-dots">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      className={`dot ${idx === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LIGHT STATS STRIP BELOW HERO */}
          <div className="hero-stats-light">
            <div>
              <strong>{hpData.stat1_number || '3,20,000'}</strong>
              <span>{hpData.stat1_label || 'SQ. FT. WORKS'}</span>
            </div>
            <div>
              <strong>{hpData.stat2_number || '1,400+'}</strong>
              <span>{hpData.stat2_label || 'CRAFTSMEN & STAFF'}</span>
            </div>
            <div>
              <strong>{hpData.stat3_number || '24'}</strong>
              <span>{hpData.stat3_label || 'EXPORT MARKETS'}</span>
            </div>
            <div>
              <strong>{hpData.stat4_number || '98%'}</strong>
              <span>{hpData.stat4_label || 'ON-TIME DELIVERY'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT CATEGORIES GRID */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.cat_eyebrow}</span>
              <h2 className="disp">{hpData.cat_title}</h2>
            </div>
            <p>{hpData.cat_desc}</p>
          </div>

          <div className="cat-grid">
            {displayCategories.map((c) => (
              <Link href={`/catalogue/${c.id}`} key={c.id} className="cat-card">
                <img src={c.image || `/categories/${c.id}.jpg`} alt={c.name} loading="lazy" />
                <div className="overlay" />
                <div className="info">
                  <h3>{c.name}</h3>
                  <p>{(c as any).description || (c as any).desc || `${c.count || 20}+ baseline specs`}</p>
                  <span className="link-arrow">Explore range →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SHOP BY SPACE / SEGMENT (PROJECT DOMAINS) */}
      <section className="blk tight" style={{ background: 'var(--surface-2)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.seg_eyebrow}</span>
              <h2 className="disp">{hpData.seg_title}</h2>
            </div>
            <p>{hpData.seg_desc}</p>
          </div>

          <div className="caps">
            {projectSpaces.map((ps) => (
              <Link href={`/catalogue?seg=${encodeURIComponent(ps.name)}`} key={ps.id} className="cap-card">
                <img src={ps.image} alt={ps.name} loading="lazy" />
                <div className="overlay" />
                <div className="cap-info">
                  <h4>{ps.name}</h4>
                  <span>{ps.subtitle}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS CAROUSEL / GRID */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.feat_eyebrow}</span>
              <h2 className="disp">{hpData.feat_title}</h2>
            </div>
            <p>{hpData.feat_desc}</p>
          </div>

          <div className="prod-grid">
            {featured.map((p) => (
              <article key={p.id} className="card">
                <div className="thumb">
                  {p.badge && <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>{p.badge}</span>}
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

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/catalogue" className="btn btn-primary btn-lg">
              Explore All {products.length} Baseline Designs →
            </Link>
          </div>
        </div>
      </section>

      {/* 5. 5-STEP CONTRACT WORKFLOW */}
      <section className="blk tight" style={{ background: 'var(--surface-2)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.step_eyebrow}</span>
              <h2 className="disp">{hpData.step_title}</h2>
            </div>
          </div>

          <div className="rail">
            <div className="step-card">
              <span className="num">01</span>
              <h4>{hpData.step1_title}</h4>
              <p>{hpData.step1_desc}</p>
            </div>

            <div className="step-card">
              <span className="num">02</span>
              <h4>{hpData.step2_title}</h4>
              <p>{hpData.step2_desc}</p>
            </div>

            <div className="step-card">
              <span className="num">03</span>
              <h4>{hpData.step3_title}</h4>
              <p>{hpData.step3_desc}</p>
            </div>

            <div className="step-card">
              <span className="num">04</span>
              <h4>{hpData.step4_title}</h4>
              <p>{hpData.step4_desc}</p>
            </div>

            <div className="step-card">
              <span className="num">05</span>
              <h4>{hpData.step5_title}</h4>
              <p>{hpData.step5_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HERITAGE MATERIALS GRID */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.mat_eyebrow}</span>
              <h2 className="disp">{hpData.mat_title}</h2>
            </div>
            <p>{hpData.mat_desc}</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {MATERIALS.map((m) => (
              <Link
                key={m}
                href={`/catalogue?mat=${encodeURIComponent(m)}`}
                className="chip"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  padding: '8px 16px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: 'var(--ink)',
                }}
              >
                {m}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className="blk tight">
        <div className="wrap">
          <div className="band">
            <div>
              <h2>{hpData.band_title}</h2>
              <p>{hpData.band_desc}</p>
            </div>
            <div className="acts">
              <Link href={hpData.band_cta1_url || '/contact'} className="btn btn-ghost btn-lg">
                {hpData.band_cta1_text || 'Start an enquiry →'}
              </Link>
              <Link
                href={hpData.band_cta2_url || '/catalogue'}
                className="btn btn-outline btn-lg"
                style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
              >
                {hpData.band_cta2_text || 'Explore 2026 catalogue'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
