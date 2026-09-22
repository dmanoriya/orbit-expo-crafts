'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { submitFormEntry, FormSubmissionPayload } from '../../lib/submitFormEntry';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: 'India (+91)' },
  { code: '+1', country: 'US', label: 'USA / Canada (+1)' },
  { code: '+44', country: 'GB', label: 'United Kingdom (+44)' },
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
        'Please certify that you are a licensed design or trade professional.'
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1A17] font-sans antialiased selection:bg-[#E0D3C1] selection:text-[#1E1A17]">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ============================================================== */}
        {/* 1. TOP HERO SECTION */}
        {/* ============================================================== */}
        <section className="bg-[#F5F1EB] rounded-2xl border border-[#EAE3D8] overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[360px] lg:min-h-[380px]">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-between">
              <div>
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9E693E]">
                    TRADE PROGRAM
                  </span>
                  <span className="w-12 h-[1.5px] bg-[#C4A480] inline-block"></span>
                </div>

                {/* Main Headline */}
                <h1 className="font-serif text-[34px] sm:text-[44px] lg:text-[48px] leading-[1.12] text-[#1E1A17] font-normal tracking-[-0.015em] mb-4">
                  For Interior Designers
                  <br />
                  &amp; Architects
                </h1>

                {/* Subtitle text */}
                <p className="text-[14px] sm:text-[15px] leading-[1.65] text-[#5C544B] max-w-lg font-light">
                  Your design vision, our craftsmanship. Access trade pricing,
                  customization options, material samples, CAD assets and
                  dedicated support for residential, commercial and hospitality
                  projects.
                </p>
              </div>

              {/* Department Pill Tags */}
              <div className="mt-8 pt-5 border-t border-[#E5DDD0] flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6B6156]">
                <span>FURNITURE</span>
                <span className="text-[#C8BDB0]">|</span>
                <span>LIGHTING</span>
                <span className="text-[#C8BDB0]">|</span>
                <span>DÉCOR</span>
                <span className="text-[#C8BDB0]">|</span>
                <span>CUSTOM SOLUTIONS</span>
              </div>
            </div>

            {/* Right Hero Image with Floating Badge */}
            <div className="lg:col-span-6 relative min-h-[280px] lg:min-h-full w-full bg-[#EAE2D5]">
              <Image
                src="/business/trade-hero-desk.jpg"
                alt="Interior designer studio workspace with swatches, wood finishes and architectural materials"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Architectural Concept Badge in Top Right */}
              <div className="absolute top-5 right-5 sm:top-7 sm:right-7 bg-white/85 backdrop-blur-md px-4 py-3 rounded border border-white/70 shadow-sm text-right">
                <div className="text-[10px] leading-[1.4] font-semibold tracking-[0.24em] uppercase text-[#54483B]">
                  FROM
                  <br />
                  CONCEPT
                  <br />
                  TO CREATION
                  <br />
                  TOGETHER
                </div>
                <div className="w-full h-[1px] bg-[#C4A480] mt-2"></div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. 4-COLUMN FEATURE CARDS */}
        {/* ============================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6">
          {/* Card 1: Tiered Trade Pricing */}
          <div className="bg-[#F5F2EB] hover:bg-[#F0EBE2] transition-colors duration-200 rounded-xl p-6 border border-[#EAE3D8] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#EAE2D5] flex items-center justify-center text-[#5C4A3A] mb-4">
                {/* Tag Icon */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-[18px] sm:text-[19px] font-semibold text-[#1E1A17] mb-2 leading-snug">
                Tiered Trade Pricing
              </h3>
              <p className="text-[12.5px] sm:text-[13px] leading-[1.6] text-[#635A50] font-light">
                Access wholesale trade pricing on all standard and custom
                designs with volume benefits for multi-room and large-scale
                projects.
              </p>
            </div>
          </div>

          {/* Card 2: Bespoke Customization */}
          <div className="bg-[#F5F2EB] hover:bg-[#F0EBE2] transition-colors duration-200 rounded-xl p-6 border border-[#EAE3D8] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#EAE2D5] flex items-center justify-center text-[#5C4A3A] mb-4">
                {/* Crossed Tools / Pen Icon */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-[18px] sm:text-[19px] font-semibold text-[#1E1A17] mb-2 leading-snug">
                Bespoke Customization
              </h3>
              <p className="text-[12.5px] sm:text-[13px] leading-[1.6] text-[#635A50] font-light">
                Tailor dimensions, wood species, finishes and materials — crafted
                to match your design intent.
              </p>
            </div>
          </div>

          {/* Card 3: Physical Swatch Kits */}
          <div className="bg-[#F5F2EB] hover:bg-[#F0EBE2] transition-colors duration-200 rounded-xl p-6 border border-[#EAE3D8] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#EAE2D5] flex items-center justify-center text-[#5C4A3A] mb-4">
                {/* Material Swatch Stack Icon */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-[18px] sm:text-[19px] font-semibold text-[#1E1A17] mb-2 leading-snug">
                Physical Swatch Kits
              </h3>
              <p className="text-[12.5px] sm:text-[13px] leading-[1.6] text-[#635A50] font-light">
                Request hand-finished wood, metal, fabric and finish samples
                delivered to your studio.
              </p>
            </div>
          </div>

          {/* Card 4: 3D CAD & Render Assets */}
          <div className="bg-[#F5F2EB] hover:bg-[#F0EBE2] transition-colors duration-200 rounded-xl p-6 border border-[#EAE3D8] flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-full bg-[#EAE2D5] flex items-center justify-center text-[#5C4A3A] mb-4">
                {/* 3D Wireframe / Monitor Icon */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-[18px] sm:text-[19px] font-semibold text-[#1E1A17] mb-2 leading-snug">
                3D CAD &amp; Render Assets
              </h3>
              <p className="text-[12.5px] sm:text-[13px] leading-[1.6] text-[#635A50] font-light">
                Download 3D models (SKP, DWG, OBJ) product images and technical
                files to streamline your presentations.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. LOWER SECTION (2 COLUMNS: INFO & APPLICATION FORM) */}
        {/* ============================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-10 sm:mt-14 items-start">
          {/* ------------------------------------------------------------ */}
          {/* LEFT COLUMN: Apply Info, Verification Benefits, Sketch & Quote */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Eyebrow */}
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9E693E] mb-2">
              TRADE ACCOUNT
            </div>

            {/* Headline */}
            <h2 className="font-serif text-[32px] sm:text-[40px] leading-[1.16] text-[#1E1A17] font-normal mb-4">
              Apply for Trade Membership
            </h2>

            {/* Description */}
            <p className="text-[14px] sm:text-[14.5px] leading-[1.65] text-[#5C544B] font-light mb-6">
              Trade accounts are open to licensed interior designers,
              architects, decorators, developers and hospitality procurement
              professionals. Once approved, you gain immediate access to trade
              pricing, materials, design assets and a dedicated account manager.
            </p>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#E5DDD0] mb-6"></div>

            {/* What you get upon verification */}
            <div className="mb-6">
              <h3 className="text-[13.5px] font-bold text-[#1E1A17] mb-4 tracking-tight">
                What you get upon verification:
              </h3>

              <div className="space-y-3.5">
                {[
                  'Digital Product Catalog & Pricing Matrix',
                  'Complimentary material sample box for active projects',
                  'Dedicated Trade Concierge for CAD and shipping coordination',
                  'Priority access to new collections and custom capabilities',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#B6895D] flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
                      <svg
                        className="w-3 h-3 stroke-[3]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-[13.5px] text-[#453E37] font-normal leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architectural Sketch Drawing & Calligraphic Quote */}
            <div className="mt-4 pt-4 border-t border-[#EAE3D8]">
              <div className="relative w-full h-[220px] sm:h-[260px] rounded-xl overflow-hidden border border-[#E5DDD0] shadow-sm bg-[#F2EDE4]">
                <Image
                  src="/business/trade-sketch-dining.jpg"
                  alt="Architectural perspective sketch of dining table with curved wood chairs and arched window"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>

              {/* Calligraphic Script Quote */}
              <div className="mt-5 flex items-center gap-4">
                <p className="font-serif italic text-[24px] sm:text-[27px] text-[#8C643E] tracking-tight leading-tight select-none">
                  Spaces designed for better living
                </p>
                <div className="flex-1 h-[1.5px] bg-[#C4A480]/60"></div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT COLUMN: White Application Form Card */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-[#E6DFD5] shadow-sm relative">
              {/* Form Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-6 border-b border-[#F0EBE1]">
                <h3 className="font-serif text-[24px] sm:text-[28px] text-[#1E1A17] font-normal leading-tight">
                  Trade Account Application
                </h3>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-[#C4A480]"></span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9E693E]">
                    PARTNER WITH US
                  </span>
                </div>
              </div>

              {/* SUCCESS STATE */}
              {isSubmitted ? (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-[#F0FDF4] text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#DCFCE7]">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  <span className="inline-block px-3 py-1 bg-[#F5F2EB] text-[#8C643E] text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
                    Application Reference: {referenceId}
                  </span>

                  <h4 className="font-serif text-[26px] text-[#1E1A17] mb-3">
                    Application Received
                  </h4>

                  <p className="text-[14px] text-[#5C544B] max-w-md mx-auto leading-relaxed mb-6 font-light">
                    Thank you, <strong>{formData.fullName}</strong>. Your
                    trade membership application has been received and routed
                    to our Trade Concierge team. We will review your credentials
                    and get in touch within 24–48 hours with your approved trade
                    catalog and pricing tier.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/shop"
                      className="inline-flex items-center justify-center px-6 py-3 bg-[#1E1A17] text-white rounded text-xs font-semibold uppercase tracking-wider hover:bg-[#332B24] transition-colors"
                    >
                      Explore Collections
                    </Link>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center justify-center px-6 py-3 border border-[#DCD3C7] text-[#5C544B] rounded text-xs font-semibold uppercase tracking-wider hover:bg-[#F5F1EB] transition-colors"
                    >
                      Submit Another Application
                    </button>
                  </div>
                </div>
              ) : (
                /* APPLICATION FORM */
                <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:space-y-5">
                  {errorMessage && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        Full Name <span className="text-[#9E693E]">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g. Divyanshu Maurya"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] placeholder-[#A3998F] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
                      />
                    </div>

                    {/* Professional Email */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        Professional Email <span className="text-[#9E693E]">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. designer@studio.com"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] placeholder-[#A3998F] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
                      />
                    </div>

                    {/* Studio / Business Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        Studio / Business Name <span className="text-[#9E693E]">*</span>
                      </label>
                      <input
                        type="text"
                        name="studioName"
                        value={formData.studioName}
                        onChange={handleChange}
                        placeholder="e.g. Maurya Design Studio"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] placeholder-[#A3998F] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
                      />
                    </div>

                    {/* Website / Portfolio URL */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        Website / Portfolio URL
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://www.yourwebsite.com"
                        className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] placeholder-[#A3998F] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        Business Type <span className="text-[#9E693E]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleChange}
                          required
                          className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] appearance-none transition-all pr-8"
                        >
                          <option value="">Select Business Type</option>
                          {BUSINESS_TYPES.map((bt) => (
                            <option key={bt} value={bt}>
                              {bt}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#73685C]">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.75}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Tax ID / Resale License # */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        Tax ID / Resale License #
                      </label>
                      <input
                        type="text"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        placeholder="Optional / Resale Permit #"
                        className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] placeholder-[#A3998F] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
                      />
                    </div>

                    {/* Phone / Mobile with Country Code */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        Phone / Mobile <span className="text-[#9E693E]">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleChange}
                          className="w-[100px] flex-shrink-0 px-2.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13px] text-[#1E1A17] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
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
                          className="flex-1 px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] placeholder-[#A3998F] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
                        />
                      </div>
                    </div>

                    {/* City & Country */}
                    <div>
                      <label className="block text-xs font-semibold text-[#3D352E] mb-1.5">
                        City &amp; Country <span className="text-[#9E693E]">*</span>
                      </label>
                      <input
                        type="text"
                        name="cityCountry"
                        value={formData.cityCountry}
                        onChange={handleChange}
                        placeholder="e.g. New Delhi, India"
                        required
                        className="w-full px-3.5 py-2.5 bg-[#FCFAF7] border border-[#E2DDD5] rounded text-[13.5px] text-[#1E1A17] placeholder-[#A3998F] focus:outline-none focus:ring-1 focus:ring-[#9E693E] focus:border-[#9E693E] transition-all"
                      />
                    </div>
                  </div>

                  {/* License Certification Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="isLicensed"
                        checked={formData.isLicensed}
                        onChange={handleChange}
                        className="w-4 h-4 mt-0.5 rounded border-[#C4BDB2] text-[#1E1A17] focus:ring-[#9E693E] accent-[#1E1A17]"
                      />
                      <span className="text-[12.5px] sm:text-[13px] text-[#5C544B] leading-tight">
                        I am a licensed professional and the information provided
                        is accurate.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 bg-[#1E1A17] hover:bg-[#332B24] active:bg-[#000000] text-white text-[13.5px] sm:text-[14px] font-medium tracking-[0.02em] rounded-md transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                          <span>Submitting Trade Application...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Trade Application</span>
                          <span className="text-base leading-none">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
