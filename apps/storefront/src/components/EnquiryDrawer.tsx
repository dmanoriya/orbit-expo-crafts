'use client';

import React from 'react';
import Link from 'next/link';
import { useEnquiry } from '../context/EnquiryContext';

export const EnquiryDrawer: React.FC = () => {
  const { enquiry, removeEnquiry, updateQuantity, clearEnquiry, isDrawerOpen, closeDrawer } = useEnquiry();

  const handleUpdateQty = (item: any, delta: number) => {
    const minMoq = item.moq || 1;
    const newQty = Math.max(minMoq, item.q + delta);
    updateQuantity(item.id, newQty);
  };

  return (
    <>
      {/* BACKGROUND SCRIM OVERLAY */}
      <div
        className={`scrim ${isDrawerOpen ? 'on' : ''}`}
        onClick={closeDrawer}
      />

      {/* SIDE DRAWER */}
      <aside className={`drawer ${isDrawerOpen ? 'on' : ''}`}>
        <header>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <h3>Project Cart</h3>
          {enquiry.length > 0 && (
            <span className="mono" style={{ color: 'var(--brand)', background: 'var(--brand-soft)', padding: '4px 10px', borderRadius: 'var(--r-pill)', fontSize: 11, fontWeight: 700 }}>
              {enquiry.length} item{enquiry.length > 1 ? 's' : ''}
            </span>
          )}
          <button className="drawer-close-btn" onClick={closeDrawer} title="Close cart" aria-label="Close cart" style={{ marginLeft: 'auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* LIST OF SHORTLISTED ITEMS */}
        <div className="list">
          {enquiry.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
                <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 10 }}>Cart Items ({enquiry.length})</span>
                <button
                  onClick={clearEnquiry}
                  style={{ fontSize: 11, color: '#d9534f', fontWeight: 600, background: 'none', border: 0, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>

              {enquiry.map((item) => (
                <div key={item.id} className="eitem">
                  <div className="ph">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />
                    )}
                  </div>
                  <div className="info">
                    <h5>{item.name}</h5>
                    <small>{item.id} · {item.catName || 'Furniture'}</small>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <div className="qty-mini">
                        <button
                          onClick={() => handleUpdateQty(item, -1)}
                          disabled={item.q <= (item.moq || 1)}
                          style={{
                            opacity: item.q <= (item.moq || 1) ? 0.35 : 1,
                            cursor: item.q <= (item.moq || 1) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          −
                        </button>
                        <span>{item.q}</span>
                        <button onClick={() => handleUpdateQty(item, 1)}>+</button>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        units {item.moq && item.moq > 1 ? `(Min MOQ: ${item.moq})` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    className="rm"
                    onClick={() => removeEnquiry(item.id)}
                    title="Remove item"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="empty" style={{ textAlign: 'center', padding: '60px 16px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--surface-2)',
                  color: 'var(--brand)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h4 className="disp" style={{ fontSize: 22, color: 'var(--ink)' }}>Your shortlist is empty</h4>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8, marginBottom: 24, lineHeight: 1.5 }}>
                Browse our collections, shortlist designs for your project, and ask our project desk for a costed proposal.
              </p>
              <Link href="/collections" className="btn btn-primary" onClick={closeDrawer}>
                Browse Collections
              </Link>
            </div>
          )}
        </div>

        {/* FOOTER ACTION */}
        <div className="foot">
          <p style={{ fontSize: '12px', color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.5 }}>
            Zero online payment required. Submitting reserves your factory manufacturing slot and triggers formal proforma invoicing.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link
              href="/checkout"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={closeDrawer}
            >
              Proceed to Order Booking
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/cart"
              style={{
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--brand)',
                fontWeight: 600,
                textDecoration: 'underline',
                padding: '4px 0',
              }}
              onClick={closeDrawer}
            >
              Review Full Cart &amp; Specifications →
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};
