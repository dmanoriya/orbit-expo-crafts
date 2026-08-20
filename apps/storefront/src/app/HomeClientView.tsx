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

  return (
    <div>
      {/* 1. HERO SECTION WITH SPLIT AUDIENCE TRACK CARDS */}
      <section
        className="hero"
        style={{
          backgroundColor: hpData.hero_bg_color || '#181512',
        }}
      >
        {hpData.hero_bg_mode !== 'color' && (
          <img
            src={
              hpData.hero_bg_image ||
              '/fallback-product.svg'
            }
            alt="Hero Background"
            className="heroimg"
          />
        )}
        <div
          className="hero-overlay"
          style={{
            opacity: hpData.hero_overlay_opacity
              ? Number(hpData.hero_overlay_opacity) / 100
              : 0.85,
          }}
        />
        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <div className="mono eyebrow" style={{ color: 'var(--brand)', textTransform: 'uppercase' }}>
            {hpData.hero_eyebrow}
          </div>
          <h1 className="disp" style={{ color: '#FFFFFF', whiteSpace: 'pre-line' }}>
            {hpData.hero_title}
          </h1>
          <p className="lede" style={{ color: '#FFFFFF', opacity: 0.95, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            {hpData.hero_lede}
          </p>

          <div className="tracks">
            <div className="track">
              <h3>{hpData.track1_title}</h3>
              <p>{hpData.track1_desc}</p>
              <ul>
                {track1Points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
              <Link href="/catalogue" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Browse 2026 Catalogue →
              </Link>
            </div>

            <div className="track alt">
              <h3>{hpData.track2_title}</h3>
              <p>{hpData.track2_desc}</p>
              <ul>
                {track2Points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
              <Link href="/turnkey" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', borderColor: '#FFFFFF', color: '#FFFFFF' }}>
                Explore Room Packages →
              </Link>
            </div>
          </div>

          <div className="stats">
            <div>
              <strong>{hpData.stat1_number}</strong>
              <span>{hpData.stat1_label}</span>
            </div>
            <div>
              <strong>{hpData.stat2_number}</strong>
              <span>{hpData.stat2_label}</span>
            </div>
            <div>
              <strong>{hpData.stat3_number}</strong>
              <span>{hpData.stat3_label}</span>
            </div>
            <div>
              <strong>{hpData.stat4_number}</strong>
              <span>{hpData.stat4_label}</span>
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
