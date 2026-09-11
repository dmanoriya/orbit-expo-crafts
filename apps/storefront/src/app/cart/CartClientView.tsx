'use client';

import React from 'react';
import Link from 'next/link';
import { useEnquiry } from '../../context/EnquiryContext';

export const CartClientView: React.FC = () => {
  const { enquiry, removeEnquiry, updateQuantity, clearEnquiry } = useEnquiry();

  const totalPieces = enquiry.reduce((acc, item) => acc + (item.q || 1), 0);
  const estimatedCbm = (totalPieces * 0.28).toFixed(2);
  const estimatedWeightKg = Math.round(totalPieces * 22);

  const handleUpdateQty = (item: any, delta: number) => {
    const minMoq = item.moq || 1;
    const newQty = Math.max(minMoq, item.q + delta);
    updateQuantity(item.id, newQty);
  };

  return (
    <div style={{ backgroundColor: '#FAF9F5', minHeight: '85vh', padding: '36px 0 80px' }}>
      <div className="wrap">
        {/* BREADCRUMBS */}
        <div className="crumbs" style={{ marginBottom: 24 }}>
          <Link href="/">Home</Link> / <span style={{ fontWeight: 600 }}>Commercial Order Booking Cart</span>
        </div>

        {/* PAGE TITLE */}
        <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 36 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
            B2B CONTRACT MANUFACTURING
          </span>
          <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            Review Shortlisted Specifications &amp; Order Booking
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', maxWidth: '65ch', marginTop: 10, lineHeight: 1.6 }}>
            Review your shortlisted pieces, adjust batch quantities according to your room matrices or BOQ, and proceed to formal commercial order booking.
          </p>
        </div>

        {enquiry.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#F4F2EB', color: 'var(--brand)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2 className="disp" style={{ fontSize: 26, fontWeight: 400, color: 'var(--ink)', marginBottom: 8 }}>
              Your booking cart is currently empty
            </h2>
            <p style={{ fontSize: 15, color: '#666666', maxWidth: '46ch', margin: '0 auto 28px', lineHeight: 1.6 }}>
              Browse our architectural baseline catalog or bestsellers, select your quantities and finishes, and add them to your commercial specification cart.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/collections"
                style={{
                  display: 'inline-block',
                  background: '#111111',
                  color: '#FFFFFF',
                  padding: '12px 28px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Browse All Collections →
              </Link>
              <Link
                href="/best-sellers"
                style={{
                  display: 'inline-block',
                  background: '#FFFFFF',
                  color: '#111111',
                  border: '1px solid #CCCCCC',
                  padding: '12px 24px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Explore Bestsellers
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, alignItems: 'start' }}>
            {/* LEFT COLUMN: ITEM LIST */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #ECE7DE' }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                  Selected Specifications ({enquiry.length} Pieces)
                </span>
                <button
                  type="button"
                  onClick={clearEnquiry}
                  style={{ background: 'none', border: 'none', color: '#C62828', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {enquiry.map((item) => {
                  const minMoq = item.moq || 1;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 1fr auto',
                        gap: 18,
                        paddingBottom: 24,
                        borderBottom: '1px solid #F0ECE4',
                        alignItems: 'center',
                      }}
                    >
                      {/* THUMBNAIL */}
                      <div style={{ aspectRatio: '1/1', borderRadius: 6, overflow: 'hidden', background: '#F4F2EB' }}>
                        <img
                          src={item.image || '/categories/tables.jpg'}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* ITEM DETAILS */}
                      <div>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {item.id} &bull; {item.catName || 'Contract Piece'}
                        </span>
                        <h4 style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 6px', color: 'var(--ink)' }}>
                          <Link href={`/product/${item.slug || item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {item.name}
                          </Link>
                        </h4>
                        <div style={{ fontSize: 13, color: '#666666' }}>
                          {item.material && <span>Material: {item.material} &bull; </span>}
                          <span>MOQ: {minMoq} units</span>
                        </div>

                        {/* QUANTITY STEPPER */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              border: '1px solid #CCCCCC',
                              borderRadius: 4,
                              background: '#FFFFFF',
                              height: 36,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item, -1)}
                              disabled={item.q <= minMoq}
                              style={{
                                width: 34,
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                fontSize: 16,
                                cursor: item.q <= minMoq ? 'not-allowed' : 'pointer',
                                opacity: item.q <= minMoq ? 0.35 : 1,
                              }}
                            >
                              −
                            </button>
                            <span style={{ padding: '0 12px', fontSize: 14, fontWeight: 600 }}>{item.q}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item, 1)}
                              style={{
                                width: 34,
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                fontSize: 16,
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </button>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                            units
                          </span>
                        </div>
                      </div>

                      {/* REMOVE BUTTON */}
                      <button
                        type="button"
                        onClick={() => removeEnquiry(item.id)}
                        title="Remove from Cart"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888888',
                          fontSize: 18,
                          cursor: 'pointer',
                          padding: 8,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* LOGISTICS & VOLUME ESTIMATOR */}
              <div style={{ marginTop: 24, padding: 18, background: '#F9F8F5', borderRadius: 6, border: '1px solid #ECE7DE' }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', marginBottom: 8 }}>
                  📦 Consolidated Export Volume Estimation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, fontSize: 13.5 }}>
                  <div>
                    <span style={{ color: '#666666', display: 'block' }}>Total Quantity:</span>
                    <strong style={{ fontSize: 15 }}>{totalPieces} units</strong>
                  </div>
                  <div>
                    <span style={{ color: '#666666', display: 'block' }}>Estimated CBM:</span>
                    <strong style={{ fontSize: 15 }}>~{estimatedCbm} m³</strong>
                  </div>
                  <div>
                    <span style={{ color: '#666666', display: 'block' }}>Est. Gross Weight:</span>
                    <strong style={{ fontSize: 15 }}>~{estimatedWeightKg} kg</strong>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: '#777777', marginTop: 10 }}>
                  Calculated based on export wooden crating standards (ISPM 15 certified). Final container packing matrix finalized upon CAD approval.
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CONTRACT BOOKING SUMMARY */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28, boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 90 }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 6, fontWeight: 700 }}>
                BOOKING RESERVATION
              </span>
              <h3 className="disp" style={{ fontSize: 24, fontWeight: 400, margin: '0 0 16px', color: 'var(--ink)' }}>
                Manufacturing Schedule
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 18, borderBottom: '1px solid #ECE7DE', fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Production Desk</span>
                  <span style={{ fontWeight: 600 }}>Rajasthan HQ (Direct)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Estimated Lead Time</span>
                  <span style={{ fontWeight: 600 }}>45 – 60 working days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Port of Lading</span>
                  <span style={{ fontWeight: 600 }}>Mundra Port (INMUN1)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Online Payment Required</span>
                  <span style={{ fontWeight: 700, color: '#2E7D32' }}>$0.00 (Zero Online)</span>
                </div>
              </div>

              {/* COMMERCIAL TERMS EXPLANATION */}
              <div style={{ padding: '14px 16px', background: '#F4F2EB', borderRadius: 6, margin: '18px 0', fontSize: 13, color: '#4A4640', lineHeight: 1.55 }}>
                ℹ️ <b>B2B Order Booking Flow</b>:
                Submitting reserves your manufacturing slot in our production schedule. Our technical specifier reviews CAD drawings, verifies wood moisture/finishes, and issues a formal <b>Proforma Invoice with Bank Wire (RTGS / SWIFT) details</b>.
              </div>

              {/* CHECKOUT BUTTON */}
              <Link
                href="/checkout"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#111111',
                  color: '#FFFFFF',
                  padding: '14px 24px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14.5,
                  fontWeight: 600,
                  width: '100%',
                  textAlign: 'center',
                  transition: 'background 0.2s ease',
                }}
              >
                Proceed to Order Booking →
              </Link>

              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <Link href="/collections" style={{ fontSize: 13, color: '#666666', textDecoration: 'underline' }}>
                  + Add More Designs from Catalog
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
