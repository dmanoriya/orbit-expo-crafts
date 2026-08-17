'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await fetch('/api/wp/config');
        if (res.ok) {
          const data = await res.json();
          if (data?.footer?.policy_privacy) {
            setContent(data.footer.policy_privacy);
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
        <Link href="/">HOME</Link> / <span>PRIVACY POLICY</span>
      </div>

      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand)', textTransform: 'uppercase' }}>
          LEGAL & COMPLIANCE
        </span>
        <h1 className="disp" style={{ fontSize: 42, margin: '8px 0 24px', fontWeight: 400 }}>
          Privacy Policy & Data Security
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          Orbit Expo Crafts is committed to preserving the privacy and commercial confidentiality of our global architectural, interior design, and trade partners.
        </p>

        <div className="policy-body" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '36px 40px', lineHeight: 1.8 }}>
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <>
              <h3>1. Commercial Confidentiality</h3>
              <p>
                We handle custom drawings, bill of quantities (BOQ), specification schedules, and project locations provided by architects and specifiers with complete confidentiality.
              </p>

              <h3>2. Data Collection</h3>
              <p>
                Information submitted via sample requests, CAD block downloads, or quote enquiries (such as Full Name, Architectural Firm, Email, and Phone / WhatsApp number) is exclusively used by our project desk to process your trade request.
              </p>

              <h3>3. Non-Disclosure & Design Rights</h3>
              <p>
                Proprietary custom furniture drawings and hotel room fit-out shop drawings provided to Orbit Expo Crafts remain the intellectual property of the specifier/client.
              </p>

              <h3>4. Security Standards</h3>
              <p>
                Our digital platforms employ SSL encryption and strict data security protocols to safeguard your business communications.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
