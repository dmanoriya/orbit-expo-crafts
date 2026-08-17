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

export default function HomePage() {
  const { addEnquiry } = useEnquiry();
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [categories, setCategories] = useState<WpCategoryItem[]>([]);
  const [hpData, setHpData] = useState<HomepageData>(DEFAULT_HOMEPAGE_DATA);
  const [isWpConnected, setIsWpConnected] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [sfData, homepageConfig] = await Promise.all([
        fetchWpStorefrontData(),
        fetchWpHomepageData(),
      ]);
      setProducts(sfData.products);
      setCategories(sfData.categories);
      setIsWpConnected(sfData.isWpConnected);
      setHpData(homepageConfig);
    }
    loadData();
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
              'http://woo-catalog-nextjs.local/wp-content/uploads/2026/08/category-sofas.jpg'
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
        <div className="wrap">
          <div className="eyebrow">
            <i />
            <span className="mono">{hpData.hero_eyebrow}</span>
          </div>

          <h1 className="disp hero-title">
            {hpData.hero_accent ? (
              <>
                {hpData.hero_title.replace(hpData.hero_accent, '')}
                <em>{hpData.hero_accent}</em>
              </>
            ) : (
              hpData.hero_title
            )}
          </h1>

          <p className="lede">{hpData.hero_lede}</p>

          {/* 4 STAT COUNTERS */}
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

          {/* 2 FEATURE TRACK CARDS */}
          <div className="tracks">
            <div className="track">
              <div className="tico">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3>{hpData.track1_title}</h3>
              <p>{hpData.track1_desc}</p>
              <ul>
                {track1Points.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
              <Link href="/contact" className="btn btn-primary btn-sm">
                Submit Architect Drawings →
              </Link>
            </div>

            <div className="track">
              <div className="tico">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
              </div>
              <h3>{hpData.track2_title}</h3>
              <p>{hpData.track2_desc}</p>
              <ul>
                {track2Points.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
              <Link href="/turnkey" className="btn btn-dark btn-sm">
                Explore Plug-in Packages →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for overlapping hero track cards */}
      <div style={{ height: 90 }} />

      {/* 2. CATEGORIES SECTION */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.cat_eyebrow}</span>
              <h2>{hpData.cat_title}</h2>
              <p>{hpData.cat_desc}</p>
            </div>
            <Link href="/catalogue" className="btn btn-soft">
              View All Categories ({displayCategories.length}) →
            </Link>
          </div>

          <div className="cat-grid">
            {displayCategories.slice(0, 10).map((c: any) => (
              <Link key={c.id} href={`/catalogue/${c.id}`} className="cat">
                <div className="art">
                  <img src={c.image || `/categories/${c.id}.jpg`} alt={c.name} loading="lazy" />
                  <div className="arrow">→</div>
                </div>
                <h4>{c.name}</h4>
                <span>{c.count ? `${c.count} items` : 'Custom build'}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PROJECT DOMAINS / SPACES */}
      <section className="blk tight" style={{ background: 'var(--surface-2)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.seg_eyebrow}</span>
              <h2>{hpData.seg_title}</h2>
              <p>{hpData.seg_desc}</p>
            </div>
          </div>

          <div className="seg-scroll">
            {projectSpaces.map((sp) => (
              <Link key={sp.id} href={`/catalogue?seg=${encodeURIComponent(sp.name)}`} className="seg">
                <img src={sp.image} alt={sp.name} loading="lazy" />
                <h4>{sp.name}</h4>
                <small>{sp.subtitle}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED DESIGNS */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.feat_eyebrow}</span>
              <h2>{hpData.feat_title}</h2>
              <p>{hpData.feat_desc}</p>
            </div>
            <Link href="/catalogue" className="btn btn-soft">
              Full Catalogue ({products.length}) →
            </Link>
          </div>

          <div className="prod-grid">
            {featured.map((p) => (
              <article key={p.id} className="card">
                <div className="thumb">
                  {p.badge && (
                    <span className={`tag ${p.badge === 'New' ? 'new' : ''}`}>
                      {p.badge}
                    </span>
                  )}
                  <Link href={`/product/${p.id}`}>
                    <img src={p.image} alt={p.name} loading="lazy" />
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
                          image: p.image,
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

      {/* 5. FACTORY 5-STEP PROCESS */}
      <section className="blk tight" style={{ background: 'var(--surface-2)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.step_eyebrow}</span>
              <h2>{hpData.step_title}</h2>
            </div>
          </div>

          <div className="rail">
            <div className="step">
              <div className="k">1</div>
              <h5>{hpData.step1_title}</h5>
              <p>{hpData.step1_desc}</p>
            </div>
            <div className="step">
              <div className="k">2</div>
              <h5>{hpData.step2_title}</h5>
              <p>{hpData.step2_desc}</p>
            </div>
            <div className="step">
              <div className="k">3</div>
              <h5>{hpData.step3_title}</h5>
              <p>{hpData.step3_desc}</p>
            </div>
            <div className="step">
              <div className="k">4</div>
              <h5>{hpData.step4_title}</h5>
              <p>{hpData.step4_desc}</p>
            </div>
            <div className="step">
              <div className="k">5</div>
              <h5>{hpData.step5_title}</h5>
              <p>{hpData.step5_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MATERIAL VOCABULARIES */}
      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">{hpData.mat_eyebrow}</span>
              <h2>{hpData.mat_title}</h2>
              <p>{hpData.mat_desc}</p>
            </div>
            <Link href="/craft" className="btn btn-soft">
              Explore Material Library →
            </Link>
          </div>

          <div className="chips">
            {MATERIALS.map((mat) => (
              <Link key={mat} href={`/catalogue?mat=${encodeURIComponent(mat)}`} className="chip">
                <i />
                <span>{mat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM BANNER CALLOUT */}
      <section className="blk tight">
        <div className="wrap">
          <div className="band">
            <div>
              <h2 className="disp" style={{ color: '#fff', fontSize: 'clamp(28px,4vw,42px)' }}>
                {hpData.band_title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.78)', marginTop: 10, fontSize: 16 }}>
                {hpData.band_desc}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
              <Link href={hpData.band_cta1_url} className="btn btn-primary btn-lg">
                {hpData.band_cta1_text}
              </Link>
              <Link href={hpData.band_cta2_url} className="btn btn-ghost btn-lg" style={{ color: '#fff', borderColor: '#fff' }}>
                {hpData.band_cta2_text}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
