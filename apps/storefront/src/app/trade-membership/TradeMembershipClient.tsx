'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { submitFormEntry, FormSubmissionPayload } from '../../lib/submitFormEntry';
import './trade-membership.css';

export interface CountryCode {
  country: string;
  code: string;
  flag: string;
  iso: string;
  digits: number;
  placeholder: string;
}

export const TRADE_PHONE_COUNTRIES: CountryCode[] = [
  { country: 'India', code: '+91', flag: '🇮🇳', iso: 'IN', digits: 10, placeholder: '98765 43210' },
  { country: 'United States', code: '+1', flag: '🇺🇸', iso: 'US', digits: 10, placeholder: '(555) 012-3456' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧', iso: 'GB', digits: 10, placeholder: '7911 123456' },
  { country: 'United Arab Emirates', code: '+971', flag: '🇦🇪', iso: 'AE', digits: 9, placeholder: '50 123 4567' },
  { country: 'Australia', code: '+61', flag: '🇦🇺', iso: 'AU', digits: 9, placeholder: '412 345 678' },
  { country: 'Canada', code: '+1', flag: '🇨🇦', iso: 'CA', digits: 10, placeholder: '(555) 012-3456' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬', iso: 'SG', digits: 8, placeholder: '8123 4567' },
  { country: 'Saudi Arabia', code: '+966', flag: '🇸🇦', iso: 'SA', digits: 9, placeholder: '50 123 4567' },
  { country: 'Qatar', code: '+974', flag: '🇶🇦', iso: 'QA', digits: 8, placeholder: '3312 3456' },
  { country: 'Germany', code: '+49', flag: '🇩🇪', iso: 'DE', digits: 11, placeholder: '151 23456789' },
  { country: 'France', code: '+33', flag: '🇫🇷', iso: 'FR', digits: 9, placeholder: '6 12 34 56 78' },
  { country: 'Italy', code: '+39', flag: '🇮🇹', iso: 'IT', digits: 10, placeholder: '312 345 6789' },
  { country: 'Netherlands', code: '+31', flag: '🇳🇱', iso: 'NL', digits: 9, placeholder: '6 12345678' },
  { country: 'Spain', code: '+34', flag: '🇪🇸', iso: 'ES', digits: 9, placeholder: '612 345 678' },
  { country: 'Switzerland', code: '+41', flag: '🇨🇭', iso: 'CH', digits: 9, placeholder: '79 123 45 67' },
  { country: 'Kuwait', code: '+965', flag: '🇰🇼', iso: 'KW', digits: 8, placeholder: '9123 4567' },
  { country: 'Oman', code: '+968', flag: '🇴🇲', iso: 'OM', digits: 8, placeholder: '9123 4567' },
  { country: 'New Zealand', code: '+64', flag: '🇳🇿', iso: 'NZ', digits: 9, placeholder: '21 123 4567' },
];

const BUSINESS_TYPES = [
  'Interior Design Studio',
  'Architecture Practice',
  'Hospitality Procurement / Hotel Developer',
  'Commercial Real Estate Developer',
  'Residential Staging & Styling Firm',
  'Furniture & Lighting Specifier',
  'Design & Build Contractor',
  'Other Design Professional',
];

function validatePhone(digits: string, country: CountryCode): string | null {
  const clean = (digits || '').replace(/\D/g, '');
  if (!clean) {
    return 'Phone / Mobile number is required.';
  }

  if (country.iso === 'IN') {
    if (clean.length !== 10) {
      return 'Please enter a valid 10-digit Indian mobile number.';
    }
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    }
    return null;
  }

  if (country.iso === 'US' || country.iso === 'CA') {
    if (clean.length !== 10) {
      return `Please enter a valid 10-digit ${country.country} phone number.`;
    }
    return null;
  }

  if (country.iso === 'AE' || country.iso === 'AU' || country.iso === 'FR' || country.iso === 'SA' || country.iso === 'NL' || country.iso === 'ES' || country.iso === 'CH' || country.iso === 'NZ') {
    if (clean.length !== country.digits) {
      return `Please enter a valid ${country.digits}-digit ${country.country} phone number.`;
    }
    return null;
  }

  if (country.iso === 'GB') {
    if (clean.length < 10 || clean.length > 11) {
      return 'Please enter a valid 10 to 11-digit UK phone number.';
    }
    return null;
  }

  if (country.iso === 'SG' || country.iso === 'QA' || country.iso === 'KW' || country.iso === 'OM') {
    if (clean.length !== 8) {
      return `Please enter a valid 8-digit ${country.country} phone number.`;
    }
    return null;
  }

  if (country.iso === 'DE') {
    if (clean.length < 10 || clean.length > 12) {
      return 'Please enter a valid German phone number (10 to 12 digits).';
    }
    return null;
  }

  if (clean.length < 7 || clean.length > 15) {
    return `Please enter a valid ${country.country} phone number.`;
  }

  return null;
}

export default function TradeMembershipClient() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studioName: '',
    website: '',
    businessType: '',
    taxId: '',
    countryIso: 'IN',
    phoneDigits: '',
    cityCountry: '',
    isLicensed: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeCountry = useMemo(() => {
    return (
      TRADE_PHONE_COUNTRIES.find((c) => c.iso === formData.countryIso) ||
      TRADE_PHONE_COUNTRIES[0]
    );
  }, [formData.countryIso]);

  // Single field validator
  const validateField = (name: string, value: any, currentCountry = activeCountry): string | null => {
    switch (name) {
      case 'fullName':
        if (!value || !value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Please enter a valid full name.';
        return null;

      case 'email':
        if (!value || !value.trim()) return 'Professional email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g. designer@studio.com).';
        }
        return null;

      case 'studioName':
        if (!value || !value.trim()) return 'Studio or Business name is required.';
        return null;

      case 'website':
        if (value && value.trim()) {
          const val = value.trim();
          const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
          if (!urlPattern.test(val)) {
            return 'Please enter a valid website URL (e.g. https://yourstudio.com).';
          }
        }
        return null;

      case 'businessType':
        if (!value || !value.trim()) return 'Please select your business type.';
        return null;

      case 'phoneDigits':
        return validatePhone(value, currentCountry);

      case 'cityCountry':
        if (!value || !value.trim()) return 'City & Country is required.';
        if (value.trim().length < 2) return 'Please enter your city and country.';
        return null;

      case 'isLicensed':
        if (!value) return 'Please confirm you are a licensed design or trade professional.';
        return null;

      default:
        return null;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let updatedValue: any = value;

    if (type === 'checkbox') {
      updatedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({ ...prev, [name]: updatedValue }));

    // Real-time error clearing/validation if field was touched
    if (touched[name] || fieldErrors[name]) {
      const err = validateField(name, updatedValue);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (err) {
          next[name] = err;
        } else {
          delete next[name];
        }
        return next;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, (formData as any)[field]);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[field] = err;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIso = e.target.value;
    const newCountry = TRADE_PHONE_COUNTRIES.find((c) => c.iso === newIso) || TRADE_PHONE_COUNTRIES[0];
    const cleanDigits = formData.phoneDigits.replace(/\D/g, '').slice(0, newCountry.digits);

    setFormData((prev) => ({
      ...prev,
      countryIso: newIso,
      phoneDigits: cleanDigits,
    }));

    if (touched.phoneDigits || fieldErrors.phoneDigits) {
      const err = validatePhone(cleanDigits, newCountry);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (err) next.phoneDigits = err;
        else delete next.phoneDigits;
        return next;
      });
    }
  };

  const handlePhoneDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '').slice(0, activeCountry.digits);

    setFormData((prev) => ({ ...prev, phoneDigits: cleanDigits }));

    if (touched.phoneDigits || fieldErrors.phoneDigits) {
      const err = validatePhone(cleanDigits, activeCountry);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (err) next.phoneDigits = err;
        else delete next.phoneDigits;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate all fields
    const allErrors: Record<string, string> = {};
    const fieldsToValidate = [
      'fullName',
      'email',
      'studioName',
      'website',
      'businessType',
      'phoneDigits',
      'cityCountry',
      'isLicensed',
    ];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, (formData as any)[field]);
      if (err) {
        allErrors[field] = err;
      }
    });

    // Mark all as touched
    const allTouched: Record<string, boolean> = {};
    fieldsToValidate.forEach((f) => {
      allTouched[f] = true;
    });
    setTouched(allTouched);
    setFieldErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      setErrorMessage('Please review and correct the highlighted fields below.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `${activeCountry.code} ${formData.phoneDigits.trim()}`;
      let cleanWebsite = formData.website.trim();
      if (cleanWebsite && !cleanWebsite.startsWith('http://') && !cleanWebsite.startsWith('https://')) {
        cleanWebsite = `https://${cleanWebsite}`;
      }

      const payload: FormSubmissionPayload = {
        form_type: 'trade_membership',
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: fullPhone,
        company: formData.studioName.trim(),
        tax_id: formData.taxId.trim() || undefined,
        project_type: formData.businessType,
        source_page: '/trade-membership',
        source_title: 'Trade Program (Interior Designers & Architects)',
        notes: [
          `Application: Trade Membership Program (Long-term Alliance)`,
          `Studio / Practice: ${formData.studioName.trim()}`,
          `Website / Portfolio: ${cleanWebsite || 'N/A'}`,
          `Business Type: ${formData.businessType}`,
          `Tax ID / Resale License #: ${formData.taxId.trim() || 'N/A'}`,
          `Phone: ${fullPhone} (${activeCountry.country})`,
          `Location: ${formData.cityCountry.trim()}`,
          `Licensed Professional Certified: Yes`,
        ].join('\n'),
      };

      const result = await submitFormEntry(payload);

      if (result.success) {
        setIsSubmitted(true);
        setReferenceId(result.referenceId || 'TRD-VERIFY');
      } else {
        setErrorMessage(
          result.error ||
            'We were unable to submit your application. Please verify your connection and try again.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'A network error occurred while submitting your application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setReferenceId(null);
    setFieldErrors({});
    setTouched({});
    setFormData({
      fullName: '',
      email: '',
      studioName: '',
      website: '',
      businessType: '',
      taxId: '',
      countryIso: 'IN',
      phoneDigits: '',
      cityCountry: '',
      isLicensed: false,
    });
  };

  return (
    <div className="trade-page-wrapper">
      <main className="trade-container">
        {/* ============================================================== */}
        {/* 1. TOP HERO SECTION */}
        {/* ============================================================== */}
        <section className="trade-hero-card">
          {/* Left Hero Content */}
          <div className="trade-hero-left">
            <div>
              {/* Eyebrow */}
              <div className="trade-eyebrow-row">
                <span className="trade-eyebrow">TRADE PROGRAM</span>
                <span className="trade-gold-line"></span>
              </div>

              {/* Main Headline */}
              <h1 className="trade-hero-title">
                For Interior Designers
                <br />
                &amp; Architects
              </h1>

              {/* Subtitle text */}
              <p className="trade-hero-desc">
                Your design vision, our craftsmanship. Access trade pricing,
                customization options, material samples, CAD assets and
                dedicated support for residential, commercial and hospitality
                projects.
              </p>
            </div>

            {/* Department Pill Tags */}
            <div className="trade-hero-pills">
              <span>FURNITURE</span>
              <span className="trade-pill-sep">|</span>
              <span>LIGHTING</span>
              <span className="trade-pill-sep">|</span>
              <span>DÉCOR</span>
              <span className="trade-pill-sep">|</span>
              <span>CUSTOM SOLUTIONS</span>
            </div>
          </div>

          {/* Right Hero Image with Floating Badge */}
          <div className="trade-hero-right">
            <img
              src="/business/trade-hero-desk.jpg"
              alt="Interior designer studio workspace with swatches, wood finishes and architectural materials"
              className="trade-hero-img"
              loading="eager"
            />

            {/* Architectural Concept Badge in Top Right */}
            <div className="trade-hero-badge">
              <div className="trade-badge-text">
                FROM
                <br />
                CONCEPT
                <br />
                TO CREATION
                <br />
                TOGETHER
              </div>
              <div className="trade-badge-line"></div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. 4-COLUMN FEATURE CARDS */}
        {/* ============================================================== */}
        <section className="trade-features-grid">
          {/* Card 1: Tiered Trade Pricing */}
          <div className="trade-feature-card">
            <div className="trade-icon-circle">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="trade-feature-title">Tiered Trade Pricing</h3>
            <p className="trade-feature-desc">
              Access wholesale trade pricing on all standard and custom
              designs with volume benefits for multi-room and large-scale
              projects.
            </p>
          </div>

          {/* Card 2: Bespoke Customization */}
          <div className="trade-feature-card">
            <div className="trade-icon-circle">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
            <h3 className="trade-feature-title">Bespoke Customization</h3>
            <p className="trade-feature-desc">
              Tailor dimensions, wood species, finishes and materials — crafted
              to match your design intent.
            </p>
          </div>

          {/* Card 3: Physical Swatch Kits */}
          <div className="trade-feature-card">
            <div className="trade-icon-circle">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="trade-feature-title">Physical Swatch Kits</h3>
            <p className="trade-feature-desc">
              Request hand-finished wood, metal, fabric and finish samples
              delivered to your studio.
            </p>
          </div>

          {/* Card 4: 3D CAD & Render Assets */}
          <div className="trade-feature-card">
            <div className="trade-icon-circle">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="trade-feature-title">3D CAD &amp; Render Assets</h3>
            <p className="trade-feature-desc">
              Download 3D models (SKP, DWG, OBJ) product images and technical
              files to streamline your presentations.
            </p>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. LOWER SECTION (2 COLUMNS: INFO & APPLICATION FORM) */}
        {/* ============================================================== */}
        <section className="trade-lower-section">
          {/* ------------------------------------------------------------ */}
          {/* LEFT COLUMN: Apply Info, Verification Benefits, Sketch & Quote */}
          {/* ------------------------------------------------------------ */}
          <div className="trade-info-col">
            {/* Eyebrow */}
            <div className="trade-section-eyebrow">TRADE ACCOUNT</div>

            {/* Headline */}
            <h2 className="trade-section-title">
              Apply for Trade Membership
            </h2>

            {/* Description */}
            <p className="trade-section-desc">
              Trade accounts are open to licensed interior designers,
              architects, decorators, developers and hospitality procurement
              professionals. Once approved, you gain immediate access to trade
              pricing, materials, design assets and a dedicated account manager.
            </p>

            {/* Divider */}
            <div className="trade-section-divider"></div>

            {/* What you get upon verification */}
            <h3 className="trade-checklist-heading">
              What you get upon verification:
            </h3>

            <div className="trade-checklist">
              {[
                'Digital Product Catalog & Pricing Matrix',
                'Complimentary material sample box for active projects',
                'Dedicated Trade Concierge for CAD and shipping coordination',
                'Priority access to new collections and custom capabilities',
              ].map((item, idx) => (
                <div key={idx} className="trade-check-item">
                  <div className="trade-check-circle">
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="trade-check-text">{item}</span>
                </div>
              ))}
            </div>

            {/* Architectural Sketch Drawing & Calligraphic Quote */}
            <div className="trade-sketch-container">
              <div className="trade-sketch-box">
                <img
                  src="/business/trade-sketch-dining.jpg"
                  alt="Architectural perspective sketch of dining table with curved wood chairs and arched window"
                  className="trade-sketch-img"
                  loading="lazy"
                />
              </div>

              {/* Calligraphic Script Quote */}
              <div className="trade-quote-row">
                <span className="trade-quote-text">
                  Spaces designed for better living
                </span>
                <span className="trade-quote-line"></span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT COLUMN: White Application Form Card */}
          {/* ------------------------------------------------------------ */}
          <div className="trade-form-col">
            <div className="trade-form-card">
              {/* Form Card Header */}
              <div className="trade-form-header">
                <h3 className="trade-form-title">
                  Trade Account Application
                </h3>
                <div className="trade-form-partner-tag">
                  <span className="trade-partner-line"></span>
                  <span className="trade-partner-text">PARTNER WITH US</span>
                </div>
              </div>

              {/* SUCCESS STATE */}
              {isSubmitted ? (
                <div className="trade-success-box">
                  <div className="trade-success-icon">
                    <svg
                      width="32"
                      height="32"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  <span className="trade-ref-badge">
                    Application Reference: {referenceId}
                  </span>

                  <h4 className="trade-success-title">Application Received</h4>

                  <p className="trade-success-desc">
                    Thank you, <strong>{formData.fullName}</strong>. Your
                    trade membership application has been received and routed
                    to our Trade Concierge team. We will review your credentials
                    and get in touch within 24–48 hours with your approved trade
                    catalog and pricing tier.
                  </p>

                  <div className="trade-success-actions">
                    <Link href="/shop" className="trade-btn-primary">
                      Explore Collections
                    </Link>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="trade-btn-secondary"
                    >
                      Submit Another Application
                    </button>
                  </div>
                </div>
              ) : (
                /* APPLICATION FORM */
                <form onSubmit={handleSubmit} noValidate>
                  {errorMessage && (
                    <div className="trade-error-box">
                      <svg
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        style={{ flexShrink: 0, marginTop: '2px' }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* 2-Column Grid of Fields */}
                  <div className="trade-form-grid">
                    {/* 1. Full Name */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Full Name <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('fullName')}
                        placeholder="e.g. Divyanshu Maurya"
                        className={`trade-input ${fieldErrors.fullName ? 'has-error' : ''}`}
                      />
                      {fieldErrors.fullName && (
                        <div className="trade-field-error">
                          <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{fieldErrors.fullName}</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Professional Email */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Professional Email <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('email')}
                        placeholder="e.g. designer@studio.com"
                        className={`trade-input ${fieldErrors.email ? 'has-error' : ''}`}
                      />
                      {fieldErrors.email && (
                        <div className="trade-field-error">
                          <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{fieldErrors.email}</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Studio / Business Name */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Studio / Business Name <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="studioName"
                        value={formData.studioName}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('studioName')}
                        placeholder="e.g. Maurya Design Studio"
                        className={`trade-input ${fieldErrors.studioName ? 'has-error' : ''}`}
                      />
                      {fieldErrors.studioName && (
                        <div className="trade-field-error">
                          <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{fieldErrors.studioName}</span>
                        </div>
                      )}
                    </div>

                    {/* 4. Website / Portfolio URL */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Website / Portfolio URL
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('website')}
                        placeholder="https://www.yourwebsite.com"
                        className={`trade-input ${fieldErrors.website ? 'has-error' : ''}`}
                      />
                      {fieldErrors.website && (
                        <div className="trade-field-error">
                          <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{fieldErrors.website}</span>
                        </div>
                      )}
                    </div>

                    {/* 5. Business Type */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Business Type <span className="trade-req-star">*</span>
                      </label>
                      <div className="trade-select-wrap">
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('businessType')}
                          className={`trade-select ${fieldErrors.businessType ? 'has-error' : ''}`}
                        >
                          <option value="">Select Business Type</option>
                          {BUSINESS_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                              {bt}
                            </option>
                          ))}
                        </select>
                        <div className="trade-select-arrow">
                          <svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                      {fieldErrors.businessType && (
                        <div className="trade-field-error">
                          <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{fieldErrors.businessType}</span>
                        </div>
                      )}
                    </div>

                    {/* 6. Tax ID / Resale License # */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Tax ID / Resale License #
                      </label>
                      <input
                        type="text"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                        placeholder="Optional / Resale Permit #"
                        className="trade-input"
                      />
                    </div>

                    {/* 7. Phone / Mobile WITH COUNTRY FLAG SELECTOR */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Phone / Mobile <span className="trade-req-star">*</span>
                      </label>
                      <div className="trade-phone-row">
                        {/* Custom Flag & Dial Code Selector */}
                        <div className="trade-flag-wrapper">
                          <select
                            value={formData.countryIso}
                            onChange={handleCountryChange}
                            className="trade-flag-select"
                            aria-label="Select Country Code"
                          >
                            {TRADE_PHONE_COUNTRIES.map((c) => (
                              <option key={c.iso} value={c.iso}>
                                {c.flag} {c.code} — {c.country}
                              </option>
                            ))}
                          </select>
                          <div
                            className={`trade-flag-display ${fieldErrors.phoneDigits ? 'has-error' : ''}`}
                          >
                            <span className="trade-flag-icon">{activeCountry.flag}</span>
                            <span className="trade-flag-code">{activeCountry.code}</span>
                            <span className="trade-flag-chevron">▼</span>
                          </div>
                        </div>

                        {/* Phone Number Input */}
                        <input
                          type="tel"
                          name="phoneDigits"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={activeCountry.digits}
                          value={formData.phoneDigits}
                          onChange={handlePhoneDigitsChange}
                          onBlur={() => handleBlur('phoneDigits')}
                          placeholder={activeCountry.placeholder}
                          className={`trade-input ${fieldErrors.phoneDigits ? 'has-error' : ''}`}
                          style={{ flex: 1 }}
                        />
                      </div>
                      {fieldErrors.phoneDigits && (
                        <div className="trade-field-error">
                          <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{fieldErrors.phoneDigits}</span>
                        </div>
                      )}
                    </div>

                    {/* 8. City & Country */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        City &amp; Country <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="cityCountry"
                        value={formData.cityCountry}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('cityCountry')}
                        placeholder="e.g. New Delhi, India"
                        className={`trade-input ${fieldErrors.cityCountry ? 'has-error' : ''}`}
                      />
                      {fieldErrors.cityCountry && (
                        <div className="trade-field-error">
                          <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{fieldErrors.cityCountry}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* License Certification Checkbox */}
                  <div>
                    <label className={`trade-checkbox-row ${fieldErrors.isLicensed ? 'has-error' : ''}`}>
                      <input
                        type="checkbox"
                        name="isLicensed"
                        checked={formData.isLicensed}
                        onChange={handleInputChange}
                        className="trade-checkbox-input"
                      />
                      <span className="trade-checkbox-text">
                        I am a licensed professional and the information provided
                        is accurate.
                      </span>
                    </label>
                    {fieldErrors.isLicensed && (
                      <div className="trade-field-error" style={{ marginTop: '-12px', marginBottom: '16px' }}>
                        <svg className="trade-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{fieldErrors.isLicensed}</span>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="trade-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          style={{
                            animation: 'spin 1s linear infinite',
                            height: '16px',
                            width: '16px',
                          }}
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            style={{ opacity: 0.25 }}
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            style={{ opacity: 0.75 }}
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        <span>Submitting Trade Application...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Trade Application</span>
                        <span style={{ fontSize: '16px', lineHeight: 1 }}>→</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
