'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const projects = [
    ['Amrai Resort', 'Udaipur', 'Guestroom + F&B package', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'],
    ['Mangroove Taproom', 'Bengaluru', 'Bar & lounge fit-out', 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80'],
    ['La Gioia', 'Bengaluru', 'Fine-dining seating', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'],
    ['Ciclo', 'Chennai', 'Café & terrace', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'],
    ['Eastern Gate', 'Andaman', 'Villa & outdoor', 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=600&q=80'],
    ['By Chance', 'Bengaluru', 'Full turnkey interior', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'],
    ['Rao House', 'Jodhpur', 'Heritage restoration', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80'],
    ['Toorji Steps', 'Jodhpur', 'Boutique hotel', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80'],
  ];

  return (
    <div className="wrap">
      <div className="crumbs">
        <Link href="/">Home</Link> / About
      </div>

      <section className="blk" style={{ paddingTop: 20 }}>
        <div className="two">
          <div>
            <span className="mono" style={{ color: 'var(--brand)' }}>Who we are</span>
            <h2 className="disp" style={{ fontSize: 'clamp(30px, 4vw, 48px)', margin: '12px 0 18px' }}>
              Rajasthan makes it. We make it repeatable.
            </h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 16, marginBottom: 16 }}>
              Jodhpur and Udaipur have made furniture for the world for four decades — brilliantly, and unpredictably. ORBIT Expo Crafts was built to keep the craft and remove the unpredictability: engineered drawings, kiln-dried stock, four-stage QC and a delivery date that holds.
            </p>
            <p style={{ color: 'var(--ink-2)', fontSize: 16 }}>
              We work with hotel groups, restaurant operators, architects, developers and export buyers. The same works that produces a 400-room guestroom package also produces a single bone-inlay console for a villa in Alibaug.
            </p>

            <div className="chips" style={{ marginTop: 24 }}>
              <span className="chip"><i />Est. 2011</span>
              <span className="chip"><i />Jodhpur & Udaipur</span>
              <span className="chip"><i />GST & IEC registered</span>
              <span className="chip"><i />ISO-aligned QC</span>
            </div>
          </div>

          <div className="caps" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              ['3,20,000', 'sq. ft. works'],
              ['1,400+', 'people'],
              ['24', 'export markets'],
              ['96%', 'on-time handover'],
              ['4', 'QC gates'],
              ['180+', 'projects delivered'],
            ].map((s, i) => (
              <div key={i} className="cap" style={{ textAlign: 'center', padding: 22 }}>
                <strong className="disp" style={{ fontSize: 30, display: 'block' }}>{s[0]}</strong>
                <span className="mono" style={{ color: 'var(--ink-3)' }}>{s[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="blk tight" style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-lg)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">Selected projects</span>
              <h2 className="disp">Where our work lives.</h2>
            </div>
          </div>

          <div className="cat-grid">
            {projects.map((p, i) => (
              <div key={i} className="cat" style={{ cursor: 'default' }}>
                <div className="art">
                  <img
                    src={p[3]}
                    alt={p[0]}
                    loading="lazy"
                  />
                </div>
                <h4>{p[0]}</h4>
                <span>{p[1]} · {p[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
