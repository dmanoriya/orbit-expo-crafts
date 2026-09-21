'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BusinessPageConfig, BUSINESS_TABS } from '../../lib/businessPages';
import PhoneInputField, { CountryCode, PHONE_COUNTRIES } from '../PhoneInputField';
import { submitFormEntry } from '../../lib/submitFormEntry';

interface BusinessPageLayoutProps {
  config: BusinessPageConfig;
}

export default function BusinessPageLayout({ config }: BusinessPageLayoutProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(PHONE_COUNTRIES[0]);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Record<string, string[]>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { url: string; name: string; size?: number }>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [serverError, setServerError] = useState('');

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleInputChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (fieldName: string, option: string) => {
    setSelectedCheckboxes((prev) => {
      const current = prev[fieldName] || [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];

      handleInputChange(fieldName, updated);
      return { ...prev, [fieldName]: updated };
    });
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    // 15 MB limit
    if (file.size > 15 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: 'File exceeds 15 MB size limit.' }));
      return;
    }

    setIsUploading((prev) => ({ ...prev, [fieldName]: true }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/wp/forms/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedFiles((prev) => ({
          ...prev,
          [fieldName]: { url: data.url, name: data.fileName || file.name, size: file.size },
        }));
        handleInputChange(fieldName, data.url);
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: data.error || 'Failed to upload file. Please try again.',
        }));
      }
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: 'Network error while uploading file.',
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    config.form.fields.forEach((field) => {
      const val = formValues[field.name];

      if (field.required) {
        if (field.type === 'checkbox_group') {
          const checked = selectedCheckboxes[field.name] || [];
          if (checked.length === 0) {
            errors[field.name] = 'Please select at least one option.';
          }
        } else if (field.type === 'tel') {
          if (!phoneDigits || phoneDigits.trim().length < 6) {
            errors[field.name] = 'Please provide a valid contact number.';
          }
        } else if (!val || String(val).trim() === '') {
          errors[field.name] = `${field.label.replace(/\*$/, '').trim()} is required.`;
        }
      }

      if (field.type === 'email' && val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val).trim())) {
          errors[field.name] = 'Please enter a valid email address.';
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(fieldErrors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(`field-${firstErrorKey}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    const fullPhone = phoneDigits ? `${phoneCountry.code} ${phoneDigits}` : (formValues['phone'] || '');

    // Collect custom specifications
    const customFields: Record<string, any> = {};
    config.form.fields.forEach((f) => {
      if (f.type === 'checkbox_group') {
        customFields[f.name] = selectedCheckboxes[f.name] || [];
      } else if (f.type === 'file') {
        customFields[f.name] = uploadedFiles[f.name]?.url || formValues[f.name] || '';
      } else if (f.name !== 'phone') {
        customFields[f.name] = formValues[f.name] || '';
      }
    });

    const fileUrls = Object.values(uploadedFiles).map((f) => f.url);

    const payload = {
      form_type: 'suppliers_vendors',
      full_name: formValues['contact_person'] || formValues['name'] || formValues['full_name'] || formValues['company_name'] || 'Supplier Partner',
      company: formValues['company_name'] || formValues['business_name'] || '',
      email: formValues['email'] || '',
      phone: fullPhone,
      source_page: `/${config.slug}`,
      source_title: config.page_title,
      notes: formValues['distinctive_notes'] || formValues['capabilities_overview'] || formValues['project_brief'] || '',
      booking_data: {
        page_slug: config.slug,
        form_title: config.form.title,
        custom_fields: customFields,
        uploaded_files: fileUrls,
        submitted_at: new Date().toISOString(),
      },
    };

    try {
      const result = await submitFormEntry(payload);
      if (result.success) {
        setReferenceId(result.referenceId || `VND-${Math.floor(100000 + Math.random() * 900000)}`);
        setSubmitSuccess(true);
      } else {
        setServerError(result.error || 'Could not submit your enquiry. Please check your connection and try again.');
      }
    } catch (err) {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FCFAF7] text-[#241E1A] pt-8 sm:pt-12 pb-24">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* 1. TOP HEADER */}
        <header className="mb-10 sm:mb-12">
          {/* EYEBROW WITH ACCENT LINE */}
          <div className="inline-block mb-3">
            <span className="text-[11px] sm:text-[12px] tracking-[0.2em] font-semibold text-[#8C827A] uppercase block">
              {config.page_eyebrow || 'BUSINESS'}
            </span>
            <div className="w-9 h-[2px] bg-[#B5835A] mt-1.5" />
          </div>

          {/* MAIN SERIF HEADING */}
          <h1 className="font-serif text-[36px] sm:text-[46px] lg:text-[52px] font-normal leading-[1.08] tracking-[-0.02em] text-[#1E1915] max-w-3xl">
            {config.page_title}
          </h1>

          {/* SUBTITLE & TOP-RIGHT ENQUIRY INDICATOR */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4 pt-1">
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#6B635B] max-w-2xl font-light">
              {config.page_subtitle}
            </p>

            <div className="self-start sm:self-auto flex items-baseline gap-2 shrink-0 pb-0.5">
              <span className="text-[11px] tracking-[0.16em] uppercase font-semibold text-[#8C827A]">
                ENQUIRY FORM
              </span>
              <span className="font-serif text-[28px] sm:text-[32px] font-normal text-[#B5835A] leading-none">
                {config.enquiry_number || config.tab_number || '01'}
              </span>
            </div>
          </div>
        </header>

        {/* 2. 2x2 TAB NAVIGATION GRID */}
        <nav
          aria-label="Business Enquiry Categories"
          className="grid grid-cols-1 sm:grid-cols-2 border border-[#E5DFD7] rounded-[4px] overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-10 lg:mb-12"
        >
          {BUSINESS_TABS.map((tab, idx) => {
            const isActive = tab.slug === config.slug;
            const isFirstRow = idx < 2;
            const isEvenCol = idx % 2 === 0;

            return (
              <Link
                key={tab.slug}
                href={tab.href}
                className={`
                  flex items-center justify-between px-6 sm:px-7 py-4 sm:py-5 transition-all
                  ${isFirstRow ? 'border-b border-[#E5DFD7]' : ''}
                  ${isEvenCol ? 'sm:border-r border-[#E5DFD7]' : ''}
                  ${isActive
                    ? 'bg-[#2E1E17] text-white'
                    : 'bg-[#FAF8F5] hover:bg-[#F3ECE4] text-[#3D352F]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-serif text-[14px] sm:text-[15px] ${
                      isActive ? 'text-[#D4AF37] font-medium' : 'text-[#8C827A]'
                    }`}
                  >
                    {tab.number}
                  </span>
                  <span
                    className={`text-[13.5px] sm:text-[14.5px] tracking-wide ${
                      isActive ? 'text-white font-medium' : 'text-[#3D352F]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>

                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                ) : (
                  <svg
                    className="w-4 h-4 text-[#A39B92] transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 3. TWO-COLUMN CONTENT & FORM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* LEFT COLUMN: VISUAL SHOWCASE */}
          <aside className="lg:col-span-5 relative">
            <div className="relative rounded-[4px] overflow-hidden border border-[#E5DFD7] bg-[#F3EFEA] shadow-[0_4px_20px_rgba(0,0,0,0.04)] aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4.2]">
              {config.visual?.image_url ? (
                <Image
                  src={config.visual.image_url}
                  alt={config.visual.headline || config.page_title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-[#EAE4DC] flex items-center justify-center text-[#8C827A]">
                  Artisan Woodcraft &amp; Manufacturing
                </div>
              )}

              {/* OVERLAY CARD AT BOTTOM (renders only if image doesn't already have text baked in or provides custom text) */}
              {config.visual?.headline && !config.visual.image_url.includes('left-visual-chair') && (
                <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 p-5 sm:p-6 bg-[#1F1714]/88 backdrop-blur-md rounded-[3px] border border-white/10 text-white shadow-lg">
                  {config.visual.tag && (
                    <span className="text-[9.5px] sm:text-[10px] tracking-[0.2em] uppercase font-semibold text-[#D4AF37] block mb-2">
                      {config.visual.tag}
                    </span>
                  )}
                  <p className="font-serif text-[17px] sm:text-[19px] leading-snug font-normal text-white/95">
                    {config.visual.headline}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: DYNAMIC ENQUIRY FORM */}
          <section className="lg:col-span-7 bg-white rounded-[4px] border border-[#E5DFD7] p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            
            {/* FORM TITLE & REQUIRED NOTE */}
            <div className="mb-6">
              <span className="text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold text-[#8C827A] block">
                {config.form.eyebrow}
              </span>
              <div className="w-8 h-[2px] bg-[#B5835A] mt-1 mb-3" />

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h2 className="font-serif text-[26px] sm:text-[30px] font-normal text-[#1E1915] tracking-tight">
                  {config.form.title}
                </h2>
                <span className="text-[12px] text-[#8C827A] italic">
                  {config.form.notice}
                </span>
              </div>
            </div>

            {/* SERVER ERROR ALERT */}
            {serverError && (
              <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] text-[13px] rounded-[3px]">
                {serverError}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                {config.form.fields.map((field) => {
                  const isFullWidth = field.width === 'full' || field.type === 'textarea' || field.type === 'checkbox_group';
                  const colSpanClass = isFullWidth ? 'sm:col-span-2' : 'sm:col-span-1';
                  const error = fieldErrors[field.name];

                  return (
                    <div
                      key={field.id || field.name}
                      id={`field-${field.name}`}
                      className={`${colSpanClass}`}
                    >
                      {/* LABEL */}
                      {field.type !== 'checkbox_group' && (
                        <label className="block text-[12.5px] font-medium text-[#2E2823] mb-1.5">
                          {field.label}
                          {field.required && <span className="text-[#B91C1C] ml-0.5">*</span>}
                        </label>
                      )}

                      {/* TEXT / EMAIL / URL / NUMBER INPUT */}
                      {(field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'number') && (
                        <input
                          type={field.type}
                          value={formValues[field.name] || ''}
                          placeholder={field.placeholder}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className={`
                            w-full px-3.5 py-2.5 bg-white border rounded-[3px] text-[13.5px] text-[#1E1915] placeholder-[#A39B92]
                            focus:outline-none focus:border-[#2E1E17] focus:ring-1 focus:ring-[#2E1E17] transition-all
                            ${error ? 'border-[#DC2626] bg-[#FFFBFB]' : 'border-[#D9D2C7]'}
                          `}
                        />
                      )}

                      {/* PHONE INPUT WITH COUNTRY SELECTOR */}
                      {field.type === 'tel' && (
                        <PhoneInputField
                          value={phoneDigits}
                          countryCode={phoneCountry.code}
                          onChange={(digits) => {
                            setPhoneDigits(digits);
                            handleInputChange(field.name, `${phoneCountry.code} ${digits}`);
                          }}
                          onCountryChange={(c) => {
                            setPhoneCountry(c);
                            handleInputChange(field.name, `${c.code} ${phoneDigits}`);
                          }}
                          error={error}
                          placeholder="Phone / WhatsApp"
                          required={field.required}
                          inputStyle={{
                            borderRadius: '3px',
                            borderColor: error ? '#DC2626' : '#D9D2C7',
                            fontSize: '13.5px',
                            height: '42px',
                          }}
                        />
                      )}

                      {/* SELECT DROPDOWN */}
                      {field.type === 'select' && (
                        <div className="relative">
                          <select
                            value={formValues[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={`
                              w-full px-3.5 py-2.5 bg-white border rounded-[3px] text-[13.5px] text-[#1E1915] appearance-none cursor-pointer pr-10
                              focus:outline-none focus:border-[#2E1E17] focus:ring-1 focus:ring-[#2E1E17] transition-all
                              ${error ? 'border-[#DC2626] bg-[#FFFBFB]' : 'border-[#D9D2C7]'}
                              ${!formValues[field.name] ? 'text-[#A39B92]' : ''}
                            `}
                          >
                            <option value="">{field.placeholder || 'Select an option'}</option>
                            {(field.options || '')
                              .split('\n')
                              .map((opt) => opt.trim())
                              .filter(Boolean)
                              .map((opt) => (
                                <option key={opt} value={opt} className="text-[#1E1915]">
                                  {opt}
                                </option>
                              ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C544E]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* CHECKBOX GROUP (MULTI-SELECT CHOICES) */}
                      {field.type === 'checkbox_group' && (
                        <div>
                          <label className="block text-[12.5px] font-medium text-[#2E2823] mb-2">
                            {field.label}
                            {field.required && <span className="text-[#B91C1C] ml-0.5">*</span>}
                          </label>

                          <div className="flex flex-wrap gap-2.5">
                            {(field.options || '')
                              .split('\n')
                              .map((opt) => opt.trim())
                              .filter(Boolean)
                              .map((opt) => {
                                const isChecked = (selectedCheckboxes[field.name] || []).includes(opt);
                                return (
                                  <button
                                    type="button"
                                    key={opt}
                                    onClick={() => handleCheckboxToggle(field.name, opt)}
                                    className={`
                                      flex items-center gap-2 px-3.5 py-2 rounded-[3px] text-[13px] border transition-all text-left
                                      ${isChecked
                                        ? 'border-[#2E1E17] bg-[#F5EFEB] text-[#1E1915] font-medium shadow-sm'
                                        : 'border-[#D9D2C7] bg-[#FAF8F5] text-[#4A423C] hover:border-[#8C827A] hover:bg-white'
                                      }
                                    `}
                                  >
                                    <span
                                      className={`
                                        w-4 h-4 rounded-[2px] border flex items-center justify-center transition-colors shrink-0
                                        ${isChecked ? 'bg-[#2E1E17] border-[#2E1E17] text-white' : 'border-[#B5ACA2] bg-white'}
                                      `}
                                    >
                                      {isChecked && (
                                        <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* FILE UPLOAD */}
                      {field.type === 'file' && (
                        <div>
                          <input
                            type="file"
                            ref={(el) => { fileInputRefs.current[field.name] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(field.name, file);
                            }}
                            className="hidden"
                            accept=".pdf,.dwg,.jpg,.jpeg,.png,.webp,.zip"
                          />

                          <div
                            onClick={() => fileInputRefs.current[field.name]?.click()}
                            className={`
                              border border-dashed rounded-[3px] p-5 text-center cursor-pointer transition-all bg-[#FAF8F5]
                              hover:bg-[#F4ECE3] hover:border-[#8C827A]
                              ${error ? 'border-[#DC2626]' : 'border-[#C7BEB2]'}
                            `}
                          >
                            {uploadedFiles[field.name] ? (
                              <div className="flex items-center justify-between bg-white border border-[#E5DFD7] p-2.5 rounded-[3px]">
                                <div className="flex items-center gap-2.5 truncate">
                                  <svg className="w-5 h-5 text-[#B5835A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-[13px] font-medium text-[#1E1915] truncate">
                                    {uploadedFiles[field.name].name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedFiles((prev) => {
                                      const next = { ...prev };
                                      delete next[field.name];
                                      return next;
                                    });
                                    handleInputChange(field.name, '');
                                  }}
                                  className="text-[11px] text-[#DC2626] hover:underline ml-3 shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D9D2C7] rounded-[2px] text-[12.5px] font-medium text-[#2E1E17] shadow-sm">
                                  <span>Choose File</span>
                                </div>
                                <span className="text-[11.5px] text-[#8C827A]">
                                  {isUploading[field.name]
                                    ? 'Uploading document...'
                                    : (field.help_text || 'PDF, JPG or PNG · up to 10 MB')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TEXTAREA BRIEF */}
                      {field.type === 'textarea' && (
                        <textarea
                          rows={4}
                          value={formValues[field.name] || ''}
                          placeholder={field.placeholder}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className={`
                            w-full px-3.5 py-2.5 bg-white border rounded-[3px] text-[13.5px] text-[#1E1915] placeholder-[#A39B92]
                            focus:outline-none focus:border-[#2E1E17] focus:ring-1 focus:ring-[#2E1E17] transition-all
                            ${error ? 'border-[#DC2626] bg-[#FFFBFB]' : 'border-[#D9D2C7]'}
                          `}
                        />
                      )}

                      {/* FIELD ERROR TEXT */}
                      {error && (
                        <p className="text-[11.5px] text-[#DC2626] mt-1 font-medium">
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BOTTOM ACTION BAR */}
              <div className="border-t border-[#EAE4DC] pt-6 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <p className="text-[12px] text-[#7E746A] leading-relaxed max-w-sm">
                  {config.form.review_note || 'We usually review business enquiries within 2–3 working days.'}
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    w-full sm:w-auto px-8 py-3.5 bg-[#2E1E17] hover:bg-[#1E140F] disabled:bg-[#8C827A]
                    text-white text-[13.5px] font-medium tracking-wide rounded-[3px] transition-colors
                    flex items-center justify-center gap-2.5 shadow-sm
                  "
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{config.form.submit_button_text || 'Submit enquiry →'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[4px] border border-[#E5DFD7] max-w-lg w-full p-8 shadow-2xl text-center relative">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#FAF5EE] border border-[#EADCC8] flex items-center justify-center text-[#B5835A]">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="text-[10px] tracking-[0.2em] font-semibold text-[#8C827A] uppercase block mb-1">
              SUPPLIERS &amp; VENDORS ENQUIRY
            </span>

            <h3 className="font-serif text-[26px] font-normal text-[#1E1915] mb-2">
              {config.form.success_title || 'Enquiry Received'}
            </h3>

            <p className="text-[14px] text-[#6B635B] leading-relaxed mb-6">
              {config.form.success_message}
            </p>

            <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-[3px] p-3.5 mb-6 inline-block">
              <span className="text-[11px] uppercase tracking-wider text-[#8C827A] block">
                Reference ID
              </span>
              <strong className="font-mono text-[16px] text-[#2E1E17] tracking-wider">
                {referenceId}
              </strong>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setFormValues({});
                  setSelectedCheckboxes({});
                  setUploadedFiles({});
                }}
                className="px-6 py-2.5 border border-[#D9D2C7] hover:border-[#2E1E17] text-[#2E1E17] text-[13px] font-medium rounded-[3px] transition-colors"
              >
                Submit another enquiry
              </button>
              <Link
                href="/collections"
                className="px-6 py-2.5 bg-[#2E1E17] hover:bg-[#1E140F] text-white text-[13px] font-medium rounded-[3px] transition-colors"
              >
                Explore Catalogue
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
