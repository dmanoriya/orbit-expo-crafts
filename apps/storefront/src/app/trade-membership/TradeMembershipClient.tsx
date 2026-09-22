'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { submitFormEntry, FormSubmissionPayload } from '../../lib/submitFormEntry';
import './trade-membership.css';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)' },
  { code: '+1', country: 'US', label: 'USA / Canada (+1)' },
  { code: '+44', country: 'GB', label: 'UK (+44)' },
  { code: '+971', country: 'AE', label: 'UAE (+971)' },
  { code: '+61', country: 'AU', label: 'Australia (+61)' },
  { code: '+49', country: 'DE', label: 'Germany (+49)' },
  { code: '+33', country: 'FR', label: 'France (+33)' },
  { code: '+65', country: 'SG', label: 'Singapore (+65)' },
  { code: '+966', country: 'SA', label: 'Saudi Arabia (+966)' },
  { code: '+39', country: 'IT', label: 'Italy (+39)' },
  { code: '+31', country: 'NL', label: 'Netherlands (+31)' },
  { code: '+34', country: 'ES', label: 'Spain (+34)' },
  { code: '+41', country: 'CH', label: 'Switzerland (+41)' },
  { code: '+974', country: 'QA', label: 'Qatar (+974)' },
  { code: '+965', country: 'KW', label: 'Kuwait (+965)' },
  { code: '+968', country: 'OM', label: 'Oman (+968)' },
  { code: '+64', country: 'NZ', label: 'New Zealand (+64)' },
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

export default function TradeMembershipClient() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studioName: '',
    website: '',
    businessType: '',
    taxId: '',
    countryCode: '+91',
    phone: '',
    cityCountry: '',
    isLicensed: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid professional email address.');
      return;
    }
    if (!formData.studioName.trim()) {
      setErrorMessage('Please enter your studio or business name.');
      return;
    }
    if (!formData.businessType) {
      setErrorMessage('Please select your business type.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Please enter your phone or mobile number.');
      return;
    }
    if (!formData.cityCountry.trim()) {
      setErrorMessage('Please enter your city and country.');
      return;
    }
    if (!formData.isLicensed) {
      setErrorMessage(
        'Please certify that you are a licensed professional and the information provided is accurate.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `${formData.countryCode} ${formData.phone.trim()}`;
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
          `Studio / Business: ${formData.studioName.trim()}`,
          `Website / Portfolio: ${formData.website.trim() || 'N/A'}`,
          `Business Type: ${formData.businessType}`,
          `Tax ID / Resale License #: ${formData.taxId.trim() || 'N/A'}`,
          `Phone: ${fullPhone}`,
          `Location: ${formData.cityCountry.trim()}`,
          `Licensed Professional Confirmation: Yes`,
        ].join('\n'),
      };

      const result = await submitFormEntry(payload);

      if (result.success) {
        setIsSubmitted(true);
        setReferenceId(result.referenceId || 'TRD-VERIFY');
      } else {
        setErrorMessage(
          result.error ||
            'We were unable to process your application at this moment. Please check your details and try again.'
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
    setFormData({
      fullName: '',
      email: '',
      studioName: '',
      website: '',
      businessType: '',
      taxId: '',
      countryCode: '+91',
      phone: '',
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
            {/* Standard img tag guarantees strict boundary containment without layout breakage */}
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
              {/* Tag Icon */}
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
              {/* Crossed Tools / Pen Icon */}
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
              {/* Material Swatch Stack Icon */}
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
              {/* 3D Wireframe / Monitor Icon */}
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
                <form onSubmit={handleSubmit}>
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
                    {/* Full Name */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Full Name <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Divyanshu Maurya"
                        required
                        className="trade-input"
                      />
                    </div>

                    {/* Professional Email */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Professional Email <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. designer@studio.com"
                        required
                        className="trade-input"
                      />
                    </div>

                    {/* Studio / Business Name */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Studio / Business Name <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="studioName"
                        value={formData.studioName}
                        onChange={handleChange}
                        placeholder="e.g. Maurya Design Studio"
                        required
                        className="trade-input"
                      />
                    </div>

                    {/* Website / Portfolio URL */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Website / Portfolio URL
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://www.yourwebsite.com"
                        className="trade-input"
                      />
                    </div>

                    {/* Business Type */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Business Type <span className="trade-req-star">*</span>
                      </label>
                      <div className="trade-select-wrap">
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          required
                          className="trade-select"
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
                    </div>

                    {/* Tax ID / Resale License # */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Tax ID / Resale License #
                      </label>
                      <input
                        type="text"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        placeholder="Optional / Resale Permit #"
                        className="trade-input"
                      />
                    </div>

                    {/* Phone / Mobile with Country Code */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        Phone / Mobile <span className="trade-req-star">*</span>
                      </label>
                      <div className="trade-phone-row">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleChange}
                          className="trade-phone-select"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.country} value={c.code}>
                              {c.country} {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 98765 43210"
                          required
                          className="trade-input"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    {/* City & Country */}
                    <div className="trade-field-group">
                      <label className="trade-field-label">
                        City &amp; Country <span className="trade-req-star">*</span>
                      </label>
                      <input
                        type="text"
                        name="cityCountry"
                        value={formData.cityCountry}
                        onChange={handleChange}
                        placeholder="e.g. New Delhi, India"
                        required
                        className="trade-input"
                      />
                    </div>
                  </div>

                  {/* License Certification Checkbox */}
                  <label className="trade-checkbox-row">
                    <input
                      type="checkbox"
                      name="isLicensed"
                      checked={formData.isLicensed}
                      onChange={handleChange}
                      className="trade-checkbox-input"
                    />
                    <span className="trade-checkbox-text">
                      I am a licensed professional and the information provided
                      is accurate.
                    </span>
                  </label>

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
