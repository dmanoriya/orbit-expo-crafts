'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await fetch('/api/wp/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.footer?.policy_terms) {
            setContent(data.footer.policy_terms);
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
        <Link href="/">HOME</Link> / <span>TERMS & TRADE CONDITIONS</span>
      </div>

      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
          CONTRACT SPECIFICATION & TRADE
        </span>
        <h1 className="disp" style={{ fontSize: 42, margin: '8px 0 24px', fontWeight: 400 }}>
          Terms & Conditions of Supply
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          Operational guidelines, manufacturing standards, and contract supply terms for B2B trade partners and export clients.
        </p>

        <div className="policy-body" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '36px 40px', lineHeight: 1.8 }}>
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <>
              <h3>1. Production Sign-Off & Approvals</h3>
              <p>
                Bulk manufacturing commences only upon formal written approval of finish control samples and 2D/3D shop drawings.
              </p>

              <h3>2. Minimum Order Quantities (MOQ)</h3>
              <p>
                Products carry design-specific Minimum Order Quantities (MOQ). For custom contract projects spanning hotel guestrooms or villas, consolidated project orders are evaluated on a project BOQ basis.
              </p>

              <h3>3. Timber & Material Tolerances</h3>
              <p>
                Natural wood features grain variations, knots, and color nuances that highlight solid wood craft. All dimensions adhere to contract tolerances (± 3mm).
              </p>

              <h3>4. Payment Terms</h3>
              <p>
                Proforma Invoice pricing is quoted Ex-Factory or FOB/CIF. Production requires a 50% advance deposit, with the remaining balance due prior to container dispatch.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
