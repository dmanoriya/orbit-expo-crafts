'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function WarrantyPolicyPage() {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await fetch('/api/wp/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.footer?.policy_warranty) {
            setContent(data.footer.policy_warranty);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadPolicy();
  }, []);

  return (
    <div className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {/* BREADCRUMBS */}
      <div className="crumbs" style={{ marginBottom: 24 }}>
        <Link href="/">HOME</Link> / <span>QUALITY & WARRANTY POLICY</span>
      </div>

      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
          QUALITY ASSURANCE & CRAFT
        </span>
        <h1 className="disp" style={{ fontSize: 42, margin: '8px 0 24px', fontWeight: 400 }}>
          Quality Guarantee & Warranty Policy
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          Our 5-year structural warranty, wood seasoning standards, and quality inspection guidelines for commercial & hospitality installations.
        </p>

        <div className="policy-body" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '36px 40px', lineHeight: 1.8 }}>
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <>
              <h3>1. 5-Year Structural Frame Warranty</h3>
              <p>
                Orbit Expo Crafts provides a 5-year limited structural warranty covering internal solid wood framing, mortise-and-tenon joinery, and structural integrity against manufacturing defects.
              </p>

              <h3>2. Timber Seasoning & Moisture Control</h3>
              <p>
                All hardwoods (Teak, Sheesham, Acacia, Mango) are seasoned in automated kiln-drying chambers down to 8%–12% moisture content to prevent warping, checking, or cracking in any climate zone.
              </p>

              <h3>3. Anti-Borer & Termite Treatment</h3>
              <p>
                Wood undergoes chemical vacuum-pressure impregnation (VPI) treatment against borers, termites, and fungal decay.
              </p>

              <h3>4. Commercial Grade Fabrics & Finishes</h3>
              <p>
                High-performance PU lacquer, zero-VOC natural oils, and contract upholstery fabrics with 50,000+ Martindale rub counts are specified for hospitality usage.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
