'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ShippingPolicyPage() {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await fetch('/api/wp/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.footer?.policy_shipping) {
            setContent(data.footer.policy_shipping);
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
        <Link href="/">HOME</Link> / <span>EXPORT & FREIGHT SHIPPING POLICY</span>
      </div>

      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
          GLOBAL LOGISTICS & PACKING
        </span>
        <h1 className="disp" style={{ fontSize: 42, margin: '8px 0 24px', fontWeight: 400 }}>
          Export, Packing & Freight Policy
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          Comprehensive sea container freight, air express sample dispatches, and export-grade packing protocols for 24 international destination countries.
        </p>

        <div className="policy-body" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '36px 40px', lineHeight: 1.8 }}>
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <>
              <h3>1. Export-Grade Packing Standards</h3>
              <p>
                All furniture pieces are individually wrapped in protective foam sheets, corrugated corner guards, heavy-duty 7-ply cartons, and heat-treated ISPM-15 wooden crates for ocean transit.
              </p>

              <h3>2. Ocean Freight & Logistics Options</h3>
              <p>
                We offer FCL (Full Container Load - 20ft / 40ft High Cube) and LCL (Less than Container Load) shipping via Mundra / Nhava Sheva ports with complete export documentation (Bill of Lading, Certificate of Origin, Phytosanitary Certificate).
              </p>

              <h3>3. Sample Express Delivery</h3>
              <p>
                Finish sample swatches and wood control blocks are dispatched via DHL/FedEx Express with real-time tracking numbers provided upon dispatch.
              </p>

              <h3>4. Lead Times & Timelines</h3>
              <p>
                Standard production lead time ranges from 30 to 45 calendar days based on order size and custom joinery requirements.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
