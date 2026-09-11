'use client';

import React from 'react';
import Link from 'next/link';

export default function TurnkeyPage() {
  return (
    <div className="wrap">
      {/* BREADCRUMBS */}
      <div className="crumbs">
        <Link href="/">Home</Link> / Turnkey Projects
      </div>

      {/* HERO SECTION */}
      <section className="craft-hero" style={{ padding: '24px 0 54px', borderBottom: '1px solid var(--line)', marginBottom: 48 }}>
        <div className="craft-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 20 }}>
              FOR HOTELS · RESTAURANTS · RESORTS · COMMERCIAL DEVELOPERS
            </span>
            <h1 className="disp" style={{ fontSize: 'clamp(36px, 4.2vw, 58px)', lineHeight: 1.12, fontWeight: 400, marginBottom: 24, color: 'var(--ink)' }}>
              One contract.<br />
              <span style={{ fontStyle: 'italic', color: '#B8AF9F', fontWeight: 300 }}>One accountable partner.</span>
            </h1>
            <p style={{ fontSize: 16.5, color: 'var(--ink-2)', lineHeight: 1.65, maxWidth: 540, marginBottom: 32 }}>
              Most projects lose money in the gaps — between designer and factory, factory and transporter, transporter and site. ORBIT closes all of them. You sign once, and we carry the project from drawing to installed and snag-free.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, borderTop: '1px solid var(--line)', paddingTop: 24 }}>
              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--brand)', display: 'block' }}>01 · DESIGN</span>
                <strong style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>Drawing & 3D</strong>
              </div>
              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--brand)', display: 'block' }}>02 · ENGINEER</span>
                <strong style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>Value & BOQ</strong>
              </div>
              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--brand)', display: 'block' }}>03 · MANUFACTURE</span>
                <strong style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>In-house, one roof</strong>
              </div>
              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--brand)', display: 'block' }}>04 · INSTALL</span>
                <strong style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>Site team & handover</strong>
              </div>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', aspectRatio: '4/3' }}>
            <img
              src="/categories/fitout.jpg"
              alt="Turnkey Hospitality Fitout & Manufacturing"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* NINE DISCIPLINES CAPABILITY SECTION */}
      <section className="blk" style={{ paddingTop: 0, marginBottom: 60 }}>
        <div className="sec-head" style={{ marginBottom: 36 }}>
          <div>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>
              CAPABILITY
            </span>
            <h2 className="disp" style={{ fontSize: 36, marginTop: 6, marginBottom: 12 }}>
              Nine disciplines that usually need nine vendors.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 680 }}>
              Everything below happens inside our own works. That is what makes a single date, a single quality standard and a single invoice possible.
            </p>
          </div>
        </div>

        <div className="caps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {[
            ['Design & Detailing', 'Concept development, GA drawings, shop drawings and 3D visualisation from your brief or your architect\'s.'],
            ['Prototyping', 'A physical first-article built, photographed and shipped for approval before a single bulk unit is cut.'],
            ['Panel Processing', 'CNC beam saw, edge banding and drilling for casegoods, wardrobes and fixed joinery at scale.'],
            ['Solid Wood Works', 'Seasoning, kiln drying, moulding and hand carving in sheesham, teak, mango and acacia.'],
            ['Metal Fabrication', 'MS, SS and brass fabrication with in-house powder coating, PVD and antique finishing.'],
            ['Upholstery', 'Frame-up upholstery, foam profiling, fabric and leather cutting, deep buttoning and channel work.'],
            ['Surface Finishing', 'Spray booths for PU, NC, melamine and water-based systems; low-VOC options throughout.'],
            ['Logistics & Export', 'Export packing, container stuffing plans, documentation, IEC and door-to-door freight.'],
            ['Site Installation', 'Deployed install crews, assembly, levelling, snag lists closed before handover sign-off.'],
          ].map((c, i) => (
            <div
              key={i}
              className="cap"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-md)',
                padding: '28px 24px',
                transition: 'all 0.2s var(--ease)',
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: 'var(--brand)', display: 'block', marginBottom: 10 }}>
                0{i + 1}
              </span>
              <h4 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>{c[0]}</h4>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>{c[1]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ENGAGEMENT MODELS */}
      <section className="blk tight" style={{ background: 'var(--surface-2)', padding: '56px 40px', borderRadius: 'var(--r-md)', marginBottom: 60 }}>
        <div className="sec-head" style={{ marginBottom: 36 }}>
          <div>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)' }}>
              ENGAGEMENT MODELS
            </span>
            <h2 className="disp" style={{ fontSize: 34, marginTop: 6 }}>
              Three ways to work with us.
            </h2>
          </div>
        </div>

        <div className="caps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            [
              'Full Turnkey',
              'You hand over a room list and a date. We design, cost, make, ship and install everything loose and fixed.',
              'Best for hotel groups, restaurant chains, developers',
            ],
            [
              'Manufacture to Drawing',
              'Your designer owns the design. We own the making, the finish standard and the delivery date.',
              'Best for architects and interior firms',
            ],
            [
              'Catalogue & Bulk Supply',
              'Pick from our range, adjust size or finish, order in volume against a repeating schedule.',
              'Best for retailers, exporters, procurement teams',
            ],
          ].map((c, i) => (
            <div
              key={i}
              className="cap"
              style={{
                background: 'var(--surface)',
                borderLeft: '1px solid var(--line)',
                borderRight: '1px solid var(--line)',
                borderBottom: '1px solid var(--line)',
                borderTop: '4px solid var(--brand)',
                borderRadius: 'var(--r-md)',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>{c[0]}</h4>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 20 }}>{c[1]}</p>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {c[2]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* BOQ CTA SECTION CARD */}
      <section className="blk tight" style={{ paddingBottom: 60 }}>
        <div className="boq-band">
          <div className="boq-art">
            <img
              src="/categories/decor.jpg"
              alt="Custom Furniture BOQ & Manufacturing"
              loading="lazy"
            />
          </div>
          <div className="boq-content">
            <div className="boq-text">
              <h2>Tell us what you&apos;re building.</h2>
              <p>
                Upload a BOQ, floor plan, or inspirational reference. Our engineering team returns costings, lead times, and custom material samples.
              </p>
            </div>
            <div className="boq-actions">
              <Link href="/contact" className="boq-btn">
                Submit a BOQ / Drawings <span className="arrow-icon">→</span>
              </Link>
              <Link href="/collections" className="boq-btn">
                Explore 2026 collections <span className="arrow-icon">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
