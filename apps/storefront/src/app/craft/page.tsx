import React from 'react';
import Link from 'next/link';
import { MATERIALS, MOCK_PRODUCTS } from '../../data/catalogData';
import { fetchWpStorefrontData } from '../../lib/wpCommerce';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function CraftPage() {
  const { products: wpProducts } = await fetchWpStorefrontData();
  const allProducts = wpProducts && wpProducts.length > 0 ? wpProducts : MOCK_PRODUCTS;

  const getMaterialCount = (mat: string) => {
    const matLower = mat.toLowerCase();
    return allProducts.filter((p) => {
      const m1 = (p.material || '').toLowerCase();
      const m2 = (p.material2 || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const catName = (p.catName || '').toLowerCase();
      return m1.includes(matLower) || m2.includes(matLower) || name.includes(matLower) || catName.includes(matLower);
    }).length;
  };

  const getSceneImg = (index: number) => {
    const images = [
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    ];
    return images[index % images.length];
  };

  return (
    <div className="wrap">
      <div className="crumbs">
        <Link href="/">Home</Link> / Craft & Materials
      </div>

      {/* CRAFT HERO SECTION */}
      <section className="craft-hero" style={{ padding: '24px 0 54px', borderBottom: '1px solid var(--line)', marginBottom: 40 }}>
        <div className="craft-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 20 }}>
              CRAFT & MATERIALS
            </span>
            <h1 className="disp" style={{ fontSize: 'clamp(36px, 4.2vw, 58px)', lineHeight: 1.12, fontWeight: 400, marginBottom: 24, color: 'var(--ink)' }}>
              Rajasthan makes it.<br />
              <span style={{ fontStyle: 'italic', color: '#B8AF9F', fontWeight: 300 }}>We make it repeatable.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.6, maxWidth: 520, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Traditional material knowledge disciplined by drawings, samples and repeatable production standards.
            </p>
          </div>

          <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', aspectRatio: '4/3' }}>
            <img
              src="/categories/decor.jpg"
              alt="Rajasthan Craftsmanship & Repeatable Quality"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </section>

      <section className="blk" style={{ paddingTop: 0 }}>
        <div className="sec-head">
          <div>
            <span className="mono">Material library</span>
            <h2 className="disp">The vocabulary we build in.</h2>
            <p>
              Click any material to filter the whole catalogue by it. Anything not listed, we will still quote — we buy to spec.
            </p>
          </div>
        </div>

        <div className="cat-grid">
          {MATERIALS.map((m, i) => {
            const count = getMaterialCount(m);
            const countLabel = count > 0 ? `${count} ${count === 1 ? 'design' : 'designs'}` : 'Explore collection';
            return (
              <Link href={`/collections?mat=${encodeURIComponent(m)}`} key={m} className="cat">
                <div className="art">
                  <span className="arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                  <img
                    src={getSceneImg(i)}
                    alt={m}
                    loading="lazy"
                  />
                </div>
                <h4>{m}</h4>
                <span>{countLabel}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="blk tight">
        <div className="two">
          <div>
            <span className="mono" style={{ color: 'var(--brand)' }}>Responsibility</span>
            <h2 className="disp" style={{ fontSize: 38, margin: '12px 0 16px' }}>
              Craft that doesn&apos;t cost the forest.
            </h2>
            <p style={{ color: 'var(--ink-2)', marginBottom: 20 }}>
              Water-based and low-VOC coatings as the default. Certified and reclaimed timber on request. Offcuts routed back into small goods rather than the burn pile.
            </p>
            <div className="chips">
              <span className="chip on"><i />FSC on request</span>
              <span className="chip on"><i />Low-VOC coatings</span>
              <span className="chip on"><i />Kiln-dried to 8–10%</span>
              <span className="chip on"><i />Artisan cluster sourcing</span>
            </div>
          </div>

          <div className="caps" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              ['Low-VOC', 'Coatings standard'],
              ['QC at 4 stages', 'Inspection gates'],
              ['Kiln-dried stock', '8–10% moisture'],
              ['24 export markets', 'Global shipping'],
            ].map((c, i) => (
              <div key={i} className="cap" style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: 16, marginTop: 10 }}>{c[0]}</h4>
                <p style={{ fontSize: 13 }}>{c[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
