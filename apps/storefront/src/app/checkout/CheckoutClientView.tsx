'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEnquiry } from '../../context/EnquiryContext';
import { useAuth } from '../../context/AuthContext';
import { BookingRecord } from '../../types/booking';
import { saveBooking, generateDefaultMilestones } from '../../lib/bookingStore';

export const CheckoutClientView: React.FC = () => {
  const router = useRouter();
  const { enquiry, clearEnquiry } = useEnquiry();
  const { user } = useAuth();

  // Form State
  const [projectName, setProjectName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstOrTaxId, setGstOrTaxId] = useState('');

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [siteAccessNotes, setSiteAccessNotes] = useState('Ground Floor Access / Loading Dock Available');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<BookingRecord | null>(null);

  // Auto-fill from authenticated user profile
  useEffect(() => {
    if (user) {
      if (user.company) setCompanyName(user.company);
      if (user.firstName || user.lastName) {
        setClientName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      }
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const totalPieces = enquiry.reduce((acc, item) => acc + (item.q || 1), 0);
  const estimatedCbm = (totalPieces * 0.28).toFixed(2);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enquiry.length === 0) return;

    setIsSubmitting(true);

    const bookingNum = 'OEC-2026-' + Math.floor(1000 + Math.random() * 9000);
    const invoiceNum = 'PI-2026-' + Math.floor(1000 + Math.random() * 9000);
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Estimate indicative valuation based on units
    const subtotal = totalPieces * 320;
    const packingAndCrating = Math.round(subtotal * 0.05);
    const estimatedFreight = Math.round(subtotal * 0.08);
    const totalAmount = subtotal + packingAndCrating + estimatedFreight;

    const newBooking: BookingRecord = {
      id: bookingNum,
      createdAt: todayStr,
      projectName: projectName || 'Commercial Project Specification',
      clientName: clientName || (user ? `${user.firstName} ${user.lastName}` : 'Trade Client'),
      companyName: companyName || (user ? user.company : 'Design Studio'),
      email: email || (user ? user.email : 'client@project.com'),
      phone: phone || (user ? user.phone || '' : ''),
      gstOrTaxId,
      shippingAddress: {
        street,
        city,
        state,
        postalCode,
        country,
        siteAccessNotes,
      },
      targetDeliveryDate: targetDeliveryDate || '45-60 working days from drawing signoff',
      specialNotes,
      items: enquiry.map((item) => ({
        id: item.id,
        name: item.name,
        catName: item.catName,
        quantity: item.q || 1,
        image: item.image,
        material: item.material || 'Kiln-Dried Solid Hardwood',
        finish: item.finish || 'Custom Architectural Stain',
        dimensions: typeof item.dims === 'string' ? item.dims : 'Per CAD specification',
        unitPrice: 320,
        totalPrice: (item.q || 1) * 320,
      })),
      totalPieces,
      estimatedCbm,
      status: 'Booking Received',
      logistics: {
        carrier: 'Maersk Global Logistics / Roadways Fleet',
        trackingNumber: 'MSKU-' + Math.floor(100000 + Math.random() * 900000) + '-9',
        originPort: 'Mundra Port, Gujarat (INMUN1)',
        destinationPort: `${city || 'Project Site'}, ${country}`,
        vesselName: 'MV Rajasthan Express (Voyage 2608)',
        estimatedDelivery: targetDeliveryDate || 'Within 60 working days',
        currentMilestoneNote: 'Consolidated booking received in Rajasthan factory queue. Awaiting CAD review.',
      },
      invoice: {
        invoiceNumber: invoiceNum,
        issueDate: todayStr.split(',')[0],
        subtotal,
        packingAndCrating,
        estimatedFreight,
        totalAmount,
        currency: 'USD',
        paymentTerms: '50% Advance via Bank Wire / SWIFT upon CAD sign-off, 50% balance against Bill of Lading copy.',
        bankDetails: {
          accountName: 'ORBIT EXPO CRAFTS PRIVATE LIMITED',
          bankName: 'State Bank of India',
          accountNumber: '39281048201',
          ifscCode: 'SBIN0001248',
          swiftCode: 'SBININBB124',
          branch: 'Industrial Area, Udaipur, Rajasthan, India',
        },
      },
      milestones: generateDefaultMilestones(),
      messages: [
        {
          id: 'msg_welcome',
          sender: 'concierge',
          senderName: 'Orbit Engineering Concierge',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
          text: `Namaste! We have received your commercial order booking for "${projectName || 'Your Project'}". Our technical specifiers are reviewing the timber seasoning requirements, finish swatches, and knock-down joinery details. Your formal Proforma Invoice has been prepared and is available below. You can send questions directly in this thread anytime!`,
        },
      ],
    };

    saveBooking(newBooking);
    clearEnquiry();
    setIsSubmitting(false);
    setSubmittedBooking(newBooking);
  };

  // =========================================================================
  // VIEW: BOOKING SUCCESS CONFIRMATION
  // =========================================================================
  if (submittedBooking) {
    return (
      <div style={{ backgroundColor: '#FAF9F5', minHeight: '85vh', padding: '48px 16px 80px' }}>
        <div className="wrap" style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '40px 32px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F5E9', color: '#2E7D32', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2E7D32', fontWeight: 700 }}>
              BOOKING CONFIRMED &bull; NO PAYMENT CHARGED ONLINE
            </span>
            <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--ink)', margin: '8px 0 12px' }}>
              Order #{submittedBooking.id} Booked Successfully
            </h1>
            <p style={{ fontSize: 15, color: '#666666', maxWidth: '58ch', margin: '0 auto 28px', lineHeight: 1.6 }}>
              Your commercial specifications for <strong>{submittedBooking.projectName}</strong> have been registered in our Rajasthan factory production queue.
            </p>

            {/* KEY BOOKING METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, background: '#F9F8F5', borderRadius: 8, padding: 20, marginBottom: 28, textAlign: 'left' }}>
              <div>
                <span style={{ fontSize: 11, color: '#888888', textTransform: 'uppercase', display: 'block' }}>Order Reference</span>
                <strong style={{ fontSize: 15, color: '#111111' }}>{submittedBooking.id}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#888888', textTransform: 'uppercase', display: 'block' }}>Proforma Invoice</span>
                <strong style={{ fontSize: 15, color: 'var(--brand)' }}>{submittedBooking.invoice.invoiceNumber}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#888888', textTransform: 'uppercase', display: 'block' }}>Batch Size</span>
                <strong style={{ fontSize: 15, color: '#111111' }}>{submittedBooking.totalPieces} Pieces ({submittedBooking.estimatedCbm} m³)</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#888888', textTransform: 'uppercase', display: 'block' }}>Factory Origin</span>
                <strong style={{ fontSize: 15, color: '#111111' }}>Udaipur &amp; Jodhpur</strong>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/account?tab=orders"
                style={{
                  background: '#111111',
                  color: '#FFFFFF',
                  padding: '13px 28px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14.5,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                View Order &amp; Tracking in Portal →
              </Link>
              <Link
                href="/collections"
                style={{
                  background: '#FFFFFF',
                  color: '#111111',
                  border: '1px solid #CCCCCC',
                  padding: '13px 24px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Return to Catalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: EMPTY CART GUARD
  // =========================================================================
  if (enquiry.length === 0) {
    return (
      <div style={{ backgroundColor: '#FAF9F5', minHeight: '80vh', padding: '60px 16px' }}>
        <div className="wrap" style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center', background: '#FFFFFF', padding: 40, borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
          <h2 className="disp" style={{ fontSize: 26, fontWeight: 400, marginBottom: 8 }}>
            No specifications in cart to book
          </h2>
          <p style={{ fontSize: 14.5, color: '#666666', marginBottom: 24 }}>
            Please select designs from our catalog and specify your required quantities before booking.
          </p>
          <Link href="/collections" className="btn btn-primary">
            Explore Baseline Collections →
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: CHECKOUT ORDER BOOKING FORM
  // =========================================================================
  return (
    <div style={{ backgroundColor: '#FAF9F5', minHeight: '90vh', padding: '36px 0 80px' }}>
      <div className="wrap">
        {/* BREADCRUMBS */}
        <div className="crumbs" style={{ marginBottom: 24 }}>
          <Link href="/">Home</Link> / <Link href="/cart">Cart</Link> / <span style={{ fontWeight: 600 }}>Commercial Order Booking</span>
        </div>

        {/* PAGE HEADER */}
        <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 36 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
            QUOTE-FIRST CONTRACT CHECKOUT
          </span>
          <h1 className="disp" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            Book Commercial Order &amp; Request Proforma
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', maxWidth: '65ch', marginTop: 10, lineHeight: 1.6 }}>
            Confirm your project site destination and client details. Zero online payment is taken. Submitting reserves your factory production slot and generates your official Proforma Invoice.
          </p>
        </div>

        <form onSubmit={handleSubmitBooking}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, alignItems: 'start' }}>
            {/* LEFT COLUMN: FORM DETAILS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* 1. CLIENT & PROJECT DETAILS */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111111', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>1. Project &amp; Client Information</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                      Project Name / Property Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. The Oberoi Villa Suites, Udaipur or Soho Loft"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        Studio / Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Miller Interior Architecture"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        GST / Tax ID / EORI (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 08AABCO1234F1Z8"
                        value={gstOrTaxId}
                        onChange={(e) => setGstOrTaxId(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. David Miller"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        Contact Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="david@miller.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                      Phone / WhatsApp (for freight &amp; CAD dispatch updates) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98290 00000 / +1 555 0192"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. SHIPPING & SITE LOGISTICS */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111111', margin: '0 0 18px' }}>
                  2. Consignee Project Site &amp; Freight Destination
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                      Site Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 14 Lake Palace Road, Suite 400"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Udaipur"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        State / Province
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rajasthan"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        Postal / ZIP Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 313001"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="India, United States, UAE, UK, etc."
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                        Target Handover Date
                      </label>
                      <input
                        type="date"
                        value={targetDeliveryDate}
                        onChange={(e) => setTargetDeliveryDate(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                      Site Access &amp; Unloading Conditions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Freight elevator available, forklift on site, or curb-drop only"
                      value={siteAccessNotes}
                      onChange={(e) => setSiteAccessNotes(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. FABRICATION & SPECIAL NOTES */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111111', margin: '0 0 14px' }}>
                  3. Special Fabrication &amp; Engineering Notes
                </h3>
                <textarea
                  rows={3}
                  placeholder="Detail any custom dimension changes, wood moisture reading preferences, fabric COM specifications, or room tag numbers..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: BOOKING ORDER SUMMARY & TERMS */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28, boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 90 }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 6, fontWeight: 700 }}>
                SUMMARY &bull; {enquiry.length} SPECIFICATIONS
              </span>
              <h3 className="disp" style={{ fontSize: 24, fontWeight: 400, margin: '0 0 16px', color: 'var(--ink)' }}>
                Commercial Booking
              </h3>

              {/* ITEM THUMBNAILS LIST */}
              <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 18, borderBottom: '1px solid #ECE7DE', paddingBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {enquiry.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={item.image || '/categories/tables.jpg'}
                      alt={item.name}
                      style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', background: '#F4F2EB', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#666666' }}>
                        Qty: <strong>{item.q}</strong> units &bull; {item.material || 'Solid Wood'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SPECS TOTALS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, paddingBottom: 16, borderBottom: '1px solid #ECE7DE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Total Production Pieces</span>
                  <span style={{ fontWeight: 700 }}>{totalPieces} units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Estimated Export Volume</span>
                  <span style={{ fontWeight: 600 }}>~{estimatedCbm} m³ (CBM)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Dispatch Origin</span>
                  <span style={{ fontWeight: 600 }}>Mundra Port (INMUN1)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666666' }}>Online Payment Due Today</span>
                  <span style={{ fontWeight: 700, color: '#2E7D32' }}>$0.00 (Zero Online)</span>
                </div>
              </div>

              {/* COMMERCIAL PAYMENT TERMS */}
              <div style={{ background: '#F9F8F5', border: '1px solid #ECE7DE', borderRadius: 6, padding: '14px 16px', margin: '18px 0', fontSize: 12.5, color: '#4A4640', lineHeight: 1.55 }}>
                <strong style={{ display: 'block', marginBottom: 4, color: '#111111' }}>
                  🔒 Commercial Payment Terms:
                </strong>
                Submitting books your order in our factory schedule. An itemized <b>Proforma Invoice</b> with RTGS / Bank Wire / SWIFT details will be linked to your portal account. Payment is scheduled as 50% Advance upon CAD sign-off and 50% against Bill of Lading.
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '14px 24px',
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'background 0.2s ease',
                }}
              >
                {isSubmitting ? 'Registering Booking in Factory Queue...' : 'Confirm & Book Commercial Order →'}
              </button>

              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Link href="/cart" style={{ fontSize: 12.5, color: '#666666', textDecoration: 'underline' }}>
                  ← Back to Cart Review
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
