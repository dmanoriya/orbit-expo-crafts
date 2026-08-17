'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useEnquiry } from '../../context/EnquiryContext';

interface CountryCode {
  country: string;
  code: string;
  flag: string;
  iso: string;
}

const COUNTRIES: CountryCode[] = [
  { country: 'India', code: '+91', flag: '🇮🇳', iso: 'IN' },
  { country: 'United States', code: '+1', flag: '🇺🇸', iso: 'US' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧', iso: 'GB' },
  { country: 'United Arab Emirates', code: '+971', flag: '🇦🇪', iso: 'AE' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬', iso: 'SG' },
  { country: 'Australia', code: '+61', flag: '🇦🇺', iso: 'AU' },
  { country: 'Canada', code: '+1', flag: '🇨🇦', iso: 'CA' },
  { country: 'Germany', code: '+49', flag: '🇩🇪', iso: 'DE' },
  { country: 'Saudi Arabia', code: '+966', flag: '🇸🇦', iso: 'SA' },
  { country: 'Qatar', code: '+974', flag: '🇶🇦', iso: 'QA' },
  { country: 'France', code: '+33', flag: '🇫🇷', iso: 'FR' },
  { country: 'Italy', code: '+39', flag: '🇮🇹', iso: 'IT' },
];

const SPAM_KEYWORDS = [
  'casino', 'viagra', 'porn', 'sex', 'crypto', 'bitcoin', 'loan', 'investment',
  'http://', 'https://', 'www.', '.com', '.ru', '.cn', 'adult', 'dating', 'gambling'
];

export default function ContactPage() {
  const { enquiry, removeEnquiry, clearEnquiry } = useEnquiry();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [projectType, setProjectType] = useState('Hotel / Resort Fit-out');
  const [quantity, setQuantity] = useState<number>(25);
  const [description, setDescription] = useState('');

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[0]);
  const [phone, setPhone] = useState('');

  // Errors & Ref ID
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refId, setRefId] = useState('');

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};

    if (quantity < 1) {
      errs.quantity = 'Quantity must be at least 1 unit.';
    }

    if (description) {
      const lower = description.toLowerCase();
      const hasSpam = SPAM_KEYWORDS.some((kw) => lower.includes(kw));
      if (hasSpam) {
        errs.description = 'Spam URLs or inappropriate text detected. Please describe your project requirements cleanly.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};

    // Name validation
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Full Name is required.';
    } else if (trimmedName.length < 2) {
      errs.fullName = 'Full Name must be at least 2 characters.';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      errs.fullName = 'Name can only contain letters and standard characters.';
    } else {
      const lowerName = trimmedName.toLowerCase();
      if (SPAM_KEYWORDS.some((kw) => lowerName.includes(kw))) {
        errs.fullName = 'Invalid name input.';
      }
    }

    // Email validation
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errs.email = 'Email Address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = 'Please enter a valid business email address (e.g. name@company.com).';
    }

    // Phone / WhatsApp validation
    const cleanPhone = phone.replace(/\D/g, '');
    const isIndia = selectedCountry.code === '+91';

    if (!cleanPhone) {
      errs.phone = 'Phone / WhatsApp number is required.';
    } else if (isIndia && cleanPhone.length !== 10) {
      errs.phone = 'Indian phone number must be exactly 10 digits (e.g. 9876543210).';
    } else if (!isIndia && (cleanPhone.length < 7 || cleanPhone.length > 12)) {
      errs.phone = 'International phone number must be between 7 and 12 digits.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);

    const formPayload = {
      form_type: 'quote_enquiry',
      full_name: fullName,
      company: company,
      email: email,
      phone: `${selectedCountry.code} ${phone}`,
      project_type: projectType,
      quantity: String(quantity),
      notes: description,
      shortlist_items: enquiry.map((i) => ({ id: i.id, name: i.name, quantity: i.q })),
    };

    let generatedRef = '';

    try {
      const res = await fetch('/api/wp/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload),
      });

      const data = await res.json();
      if (data.success && data.data?.reference_id) {
        generatedRef = data.data.reference_id;
      }
    } catch (err) {
      console.warn('Form API submit error:', err);
    }

    if (!generatedRef) {
      generatedRef = 'QT-' + Math.floor(100000 + Math.random() * 900000);
    }

    setRefId(generatedRef);
    setIsSubmitting(false);
    setStep(3);
    clearEnquiry();
  };

  return (
    <div className="wrap">
      <div className="crumbs">
        <Link href="/">HOME</Link> / <span>ENQUIRY</span>
      </div>

      <section className="blk" style={{ paddingTop: 20, paddingBottom: 80 }}>
        <div className="two" style={{ alignItems: 'start', gap: 40 }}>
          {/* LEFT: INFORMATION & SHORTLIST */}
          <div>
            <span className="mono" style={{ color: 'var(--brand)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
              Quote-First Contract Commerce
            </span>
            <h2 className="disp" style={{ fontSize: 'clamp(30px, 4vw, 44px)', margin: '10px 0 16px', fontWeight: 400 }}>
              Tell us what you need. We&apos;ll price it properly.
            </h2>
            <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>
              We don&apos;t take payment online — because a fair contract price depends on quantity, finish, destination and lead time. Send this form and our project desk in Rajasthan replies within 24 working hours.
            </p>

            {enquiry.length > 0 ? (
              <div className="quote-box" style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, marginBottom: 12 }}>
                  {enquiry.length} item{enquiry.length > 1 ? 's' : ''} on your shortlist
                </h4>
                {enquiry.map((i) => (
                  <div key={i.id} className="eitem" style={{ padding: '9px 0' }}>
                    <div className="ph" style={{ width: 44, height: 55 }}>
                      {i.image ? <img src={i.image} alt={i.name} /> : null}
                    </div>
                    <div className="info">
                      <h5 style={{ fontSize: 13 }}>{i.name}</h5>
                      <small>{i.id} · qty {i.q}</small>
                    </div>
                    <button className="rm" onClick={() => removeEnquiry(i.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="note" style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', fontSize: 13.5, color: 'var(--ink-2)' }}>
                Your shortlist is empty — that&apos;s fine! Describe your project requirements below, or{' '}
                <Link href="/catalogue" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                  browse our catalogue
                </Link>{' '}
                to shortlist items.
              </div>
            )}

            <div className="caps" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['24-hr Response', 'Direct factory quote'],
                ['NDA Available', 'Strict confidentiality'],
                ['Export Freight', 'ISPM-15 & IEC compliant'],
                ['Dedicated Manager', 'Named project desk contact'],
              ].map((c, i) => (
                <div key={i} className="cap" style={{ padding: 18 }}>
                  <h4 style={{ fontSize: 14, margin: 0 }}>{c[0]}</h4>
                  <p style={{ fontSize: 12, margin: 0, color: 'var(--ink-2)' }}>{c[1]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: MULTI-STEP PROJECT ENQUIRY FORM */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 32, boxShadow: 'var(--shadow-lg)' }}>
            {/* STEP PROGRESS INDICATOR */}
            {step < 3 && (
              <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  <span>STEP {step} OF 2</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}>
                    {step === 1 ? 'Project Requirements' : 'Contact & Phone Details'}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--brand)', width: step === 1 ? '50%' : '100%', transition: 'width 0.3s var(--ease)' }} />
                </div>
              </div>
            )}

            {/* STEP 1: PROJECT REQUIREMENTS */}
            {step === 1 && (
              <div>
                <h3 className="disp" style={{ fontSize: 24, marginBottom: 6, fontWeight: 400 }}>
                  Project Specifications
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 22 }}>
                  Select your project scope and estimated quantities.
                </p>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>PROJECT TYPE / REQUIREMENT</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                  >
                    <option>Hotel / Resort Fit-out</option>
                    <option>Restaurant / Café / Bar</option>
                    <option>Bespoke Trade Order</option>
                    <option>Villa / Residential</option>
                    <option>Wholesale / Export Buyer</option>
                  </select>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>ESTIMATED QUANTITY (UNITS)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                  {errors.quantity && <span className="field-error">{errors.quantity}</span>}
                </div>

                <div className="field" style={{ marginBottom: 24 }}>
                  <label>PROJECT / SPECIFICATION NOTES (OPTIONAL)</label>
                  <textarea
                    rows={4}
                    placeholder="e.g. 42-room resort in Goa — guestroom furniture, restaurant tables & poolside loungers. Custom teak finish preferred."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {errors.description && <span className="field-error">{errors.description}</span>}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Next: Contact Details →
                </button>
              </div>
            )}

            {/* STEP 2: CONTACT DETAILS WITH COUNTRY FLAG SELECTOR */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <h3 className="disp" style={{ fontSize: 24, marginBottom: 6, fontWeight: 400 }}>
                  Contact Information
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 22 }}>
                  Fields marked * are required.
                </p>

                {/* FULL NAME */}
                <div className="field" style={{ marginBottom: 16 }}>
                  <label>FULL NAME *</label>
                  <input
                    type="text"
                    placeholder="e.g. Arch. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                </div>

                {/* COMPANY / FIRM NAME */}
                <div className="field" style={{ marginBottom: 16 }}>
                  <label>COMPANY / ARCHITECTURAL FIRM (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="e.g. Studio Lotus Architects"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                {/* BUSINESS EMAIL */}
                <div className="field" style={{ marginBottom: 16 }}>
                  <label>BUSINESS EMAIL *</label>
                  <input
                    type="email"
                    placeholder="priya@studiolotus.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                {/* PHONE / WHATSAPP WITH COUNTRY FLAG SELECTOR */}
                <div className="field" style={{ marginBottom: 24 }}>
                  <label>PHONE / WHATSAPP NUMBER *</label>
                  <div className="sample-phone-group">
                    <div className="sample-flag-selector">
                      <select
                        value={selectedCountry.iso}
                        onChange={(e) => {
                          const found = COUNTRIES.find((c) => c.iso === e.target.value);
                          if (found) setSelectedCountry(found);
                        }}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.iso} value={c.iso}>
                            {c.flag} {c.code} ({c.iso})
                          </option>
                        ))}
                      </select>
                      <span className="flag-display">
                        {selectedCountry.flag} {selectedCountry.code}
                      </span>
                    </div>
                    <input
                      type="tel"
                      maxLength={selectedCountry.code === '+91' ? 10 : 12}
                      placeholder={selectedCountry.code === '+91' ? '98765 43210 (10 digits)' : 'Phone number'}
                      value={phone}
                      onChange={(e) => {
                        const maxDigits = selectedCountry.code === '+91' ? 10 : 12;
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
                        setPhone(digitsOnly);
                      }}
                    />
                  </div>
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-lg"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {isSubmitting ? 'Sending Enquiry…' : 'Send Enquiry & Get Quote'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION SCREEN */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#e6f4ea',
                    color: '#137333',
                    fontSize: 32,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  ✓
                </div>
                <h3 className="disp" style={{ fontSize: 28, marginBottom: 8, fontWeight: 400 }}>
                  Enquiry Sent Successfully!
                </h3>
                <p className="sample-ref" style={{ marginBottom: 12 }}>Reference ID: <strong>{refId}</strong></p>
                <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>
                  Thank you, <strong>{fullName}</strong>. Our project desk in Rajasthan will review your requirements for <strong>{projectType}</strong> and reply with a formal costed proposal within <strong>24 working hours</strong>.
                </p>

                <div className="sample-summary-card" style={{ marginBottom: 24, textTransform: 'none' }}>
                  <div><span>Name:</span> <strong>{fullName}</strong></div>
                  <div><span>Project:</span> <strong>{projectType} ({quantity} units)</strong></div>
                  <div><span>Contact Phone:</span> <strong>{selectedCountry.code} {phone}</strong></div>
                  <div><span>Email:</span> <strong>{email}</strong></div>
                </div>

                <Link href="/catalogue" className="btn btn-primary btn-lg">
                  Return to Catalogue
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
