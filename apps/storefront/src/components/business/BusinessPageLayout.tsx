'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
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
      const firstErrorKey = Object.keys(fieldErrors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(`field-${firstErrorKey}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    const fullPhone = phoneDigits ? `${phoneCountry.code} ${phoneDigits}` : (formValues['phone'] || '');

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
      form_type: config.slug.replace(/-/g, '_'),
      full_name: formValues['contact_person'] || formValues['name'] || formValues['full_name'] || formValues['designer_name'] || formValues['creator_name'] || 'Business Partner',
      company: formValues['business_name'] || formValues['studio_name'] || formValues['company_name'] || formValues['agency_name'] || '',
      email: formValues['email'] || '',
      phone: fullPhone,
      source_page: `/${config.slug}`,
      source_title: config.page_title,
      notes: formValues['distinctive_notes'] || formValues['project_brief'] || formValues['collaboration_idea'] || formValues['proposed_idea'] || '',
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
        const fallbackPrefix = config.slug === 'suppliers-vendors' ? 'VND' : (config.slug === 'interior-designers' ? 'DES' : (config.slug === 'influencers-marketing' ? 'INF' : 'FURN'));
        setReferenceId(result.referenceId || `${fallbackPrefix}-${Math.floor(100000 + Math.random() * 900000)}`);
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
    <div className="bg-[#FFFFFF] text-[#221B16] pt-8 sm:pt-10 pb-20">
      <div className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* 1. TOP HEADER SECTION */}
        <header className="mb-8 sm:mb-10">
          <div className="inline-block mb-2">
            <span className="text-[11px] sm:text-[11.5px] tracking-[0.2em] font-semibold text-[#8C827A] uppercase block">
              {config.page_eyebrow || 'BUSINESS'}
            </span>
            <div className="w-10 h-[2px] bg-[#B5835A] mt-1.5" />
          </div>

          <h1 className="font-serif text-[38px] sm:text-[48px] lg:text-[54px] font-normal leading-[1.08] tracking-[-0.015em] text-[#1E1915] max-w-3xl">
            {config.page_title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-3 pt-1">
            <p className="text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#6B635B] max-w-2xl font-light">
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

        {/* 2. TWO-COLUMN GRID: LEFT IMAGE + RIGHT (TABS & FORM) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN: VISUAL IMAGE CARD */}
          <aside className="lg:col-span-4 xl:col-span-4">
            <div className="relative rounded-[2px] overflow-hidden border border-[#E5DFD7] bg-[#F7F5F0] shadow-sm">
              <img
                src={config.visual.image_url}
                alt={config.visual.headline || config.page_title}
                className="w-full h-auto object-cover block"
              />
            </div>
          </aside>

          {/* RIGHT COLUMN: 2x2 TABS FLUSH AT TOP, FORM DIRECTLY BENEATH */}
          <section className="lg:col-span-8 xl:col-span-8 bg-white border border-[#E5DFD7] rounded-[2px] shadow-sm overflow-hidden">

            {/* 2x2 TAB GRID */}
            <nav aria-label="Business Enquiry Categories" className="grid grid-cols-2 border-b border-[#E5DFD7]">
              {BUSINESS_TABS.map((tab, idx) => {
                const isActive = tab.slug === config.slug;
                const isEven = idx % 2 === 0;
                const isTopRow = idx < 2;

                return (
                  <Link
                    key={tab.slug}
                    href={tab.href}
                    className={`
                      flex items-center gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 transition-colors text-left
                      ${isEven ? 'border-r border-[#E5DFD7]' : ''}
                      ${isTopRow ? 'border-b border-[#E5DFD7]' : ''}
                      ${isActive
                        ? 'bg-[#2E1A11] text-white'
                        : 'bg-white hover:bg-[#FAF8F5] text-[#2B231D]'
                      }
                    `}
                  >
                    <span
                      className={`text-[12px] sm:text-[13px] font-mono shrink-0 ${
                        isActive ? 'text-[#D4AF37] font-semibold' : 'text-[#9E958C]'
                      }`}
                    >
                      {tab.number}
                    </span>
                    <span
                      className={`text-[12.5px] sm:text-[13.5px] truncate tracking-wide ${
                        isActive ? 'text-white font-medium' : 'text-[#2B231D]'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* FORM CONTAINER */}
            <div className="p-6 sm:p-8 lg:p-10">

              {/* FORM HEADER */}
              <div className="mb-6">
                <span className="text-[10.5px] sm:text-[11px] tracking-[0.16em] uppercase font-semibold text-[#8C827A] block">
                  {config.form.eyebrow}
                </span>
                <div className="w-8 h-[2px] bg-[#B5835A] mt-1 mb-3" />

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <h2 className="font-serif text-[26px] sm:text-[30px] font-normal text-[#1E1915] tracking-tight">
                    {config.form.title}
                  </h2>
                  <span className="text-[11.5px] text-[#8C827A] italic">
                    {config.form.notice}
                  </span>
                </div>
              </div>

              {/* SERVER ERROR */}
              {serverError && (
                <div className="mb-6 p-3.5 bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] text-[13px] rounded-[2px]">
                  {serverError}
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 sm:gap-y-5">
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
                          <label className="block text-[12px] sm:text-[12.5px] font-medium text-[#2E2823] mb-1.5">
                            {field.label}
                            {field.required && <span className="text-[#B91C1C] ml-0.5">*</span>}
                          </label>
                        )}

                        {/* TEXT / EMAIL / URL / NUMBER */}
                        {(field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'number') && (
                          <input
                            type={field.type}
                            value={formValues[field.name] || ''}
                            placeholder={field.placeholder}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={`
                              w-full h-[40px] px-3.5 bg-white border rounded-[2px] text-[13px] sm:text-[13.5px] text-[#1E1915] placeholder-[#9E958C]
                              focus:outline-none focus:border-[#2E1A11] focus:ring-1 focus:ring-[#2E1A11] transition-all
                              ${error ? 'border-[#DC2626] bg-[#FFFBFB]' : 'border-[#D9D2C7]'}
                            `}
                          />
                        )}

                        {/* PHONE / TEL WITH COUNTRY CODE */}
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
                              borderRadius: '2px',
                              borderColor: error ? '#DC2626' : '#D9D2C7',
                              fontSize: '13px',
                              height: '40px',
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
                                w-full h-[40px] px-3.5 bg-white border rounded-[2px] text-[13px] sm:text-[13.5px] text-[#1E1915] appearance-none cursor-pointer pr-10
                                focus:outline-none focus:border-[#2E1A11] focus:ring-1 focus:ring-[#2E1A11] transition-all
                                ${error ? 'border-[#DC2626] bg-[#FFFBFB]' : 'border-[#D9D2C7]'}
                                ${!formValues[field.name] ? 'text-[#9E958C]' : ''}
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C544E]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* CHECKBOX GROUP (SELECTABLE RECTANGULAR TILES) */}
                        {field.type === 'checkbox_group' && (
                          <div>
                            <label className="block text-[12px] sm:text-[12.5px] font-medium text-[#2E2823] mb-2">
                              {field.label}
                              {field.required && <span className="text-[#B91C1C] ml-0.5">*</span>}
                            </label>

                            <div className="flex flex-wrap gap-2">
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
                                        inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-[12.5px] border transition-all text-left
                                        ${isChecked
                                          ? 'border-[#2E1A11] bg-[#F5EFEB] text-[#1E1915] font-medium'
                                          : 'border-[#D9D2C7] bg-white text-[#4A423C] hover:border-[#8C827A]'
                                        }
                                      `}
                                    >
                                      <span
                                        className={`
                                          w-3.5 h-3.5 rounded-[1px] border flex items-center justify-center transition-colors shrink-0
                                          ${isChecked ? 'bg-[#2E1A11] border-[#2E1A11] text-white' : 'border-[#B5ACA2] bg-white'}
                                        `}
                                      >
                                        {isChecked && (
                                          <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
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

                        {/* FILE UPLOAD BOX */}
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
                                border border-dashed rounded-[2px] p-4 text-center cursor-pointer transition-all bg-[#FAF8F5]
                                hover:bg-[#F3EFE9] hover:border-[#8C827A]
                                ${error ? 'border-[#DC2626]' : 'border-[#C7BEB2]'}
                              `}
                            >
                              {uploadedFiles[field.name] ? (
                                <div className="flex items-center justify-between bg-white border border-[#E5DFD7] p-2 rounded-[2px]">
                                  <div className="flex items-center gap-2 truncate">
                                    <svg className="w-4 h-4 text-[#B5835A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-[12.5px] font-medium text-[#1E1915] truncate">
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
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#D9D2C7] rounded-[2px] text-[12px] font-medium text-[#2E1A11] shadow-xs">
                                    <span>Choose File</span>
                                  </div>
                                  <span className="text-[11px] text-[#8C827A]">
                                    {isUploading[field.name]
                                      ? 'Uploading file...'
                                      : (field.help_text || 'PDF, JPG or PNG · up to 10 MB')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TEXTAREA */}
                        {field.type === 'textarea' && (
                          <textarea
                            rows={4}
                            value={formValues[field.name] || ''}
                            placeholder={field.placeholder}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={`
                              w-full p-3 bg-white border rounded-[2px] text-[13px] sm:text-[13.5px] text-[#1E1915] placeholder-[#9E958C]
                              focus:outline-none focus:border-[#2E1A11] focus:ring-1 focus:ring-[#2E1A11] transition-all
                              ${error ? 'border-[#DC2626] bg-[#FFFBFB]' : 'border-[#D9D2C7]'}
                            `}
                          />
                        )}

                        {/* FIELD ERROR */}
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
                <div className="border-t border-[#EAE4DC] pt-5 mt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-[11.5px] sm:text-[12px] text-[#7E746A] leading-relaxed max-w-sm">
                    {config.form.review_note || 'We usually review business enquiries within 2–3 working days.'}
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-full sm:w-auto px-7 py-3 bg-[#2E1A11] hover:bg-[#1C100A] disabled:bg-[#8C827A]
                      text-white text-[13px] sm:text-[13.5px] font-medium tracking-wide rounded-[2px] transition-colors
                      flex items-center justify-center gap-2 shadow-xs
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
            </div>
          </section>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[2px] border border-[#E5DFD7] max-w-lg w-full p-8 shadow-2xl text-center relative">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FAF5EE] border border-[#EADCC8] flex items-center justify-center text-[#B5835A]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="text-[10px] tracking-[0.2em] font-semibold text-[#8C827A] uppercase block mb-1">
              {config.tab_label.toUpperCase()} ENQUIRY
            </span>

            <h3 className="font-serif text-[24px] sm:text-[26px] font-normal text-[#1E1915] mb-2">
              {config.form.success_title || 'Enquiry Received'}
            </h3>

            <p className="text-[13.5px] text-[#6B635B] leading-relaxed mb-5">
              {config.form.success_message}
            </p>

            <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-[2px] p-3 mb-6 inline-block">
              <span className="text-[10.5px] uppercase tracking-wider text-[#8C827A] block">
                Reference ID
              </span>
              <strong className="font-mono text-[15px] text-[#2E1A11] tracking-wider">
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
                className="px-5 py-2.5 border border-[#D9D2C7] hover:border-[#2E1A11] text-[#2E1A11] text-[12.5px] font-medium rounded-[2px] transition-colors"
              >
                Submit another enquiry
              </button>
              <Link
                href="/collections"
                className="px-5 py-2.5 bg-[#2E1A11] hover:bg-[#1C100A] text-white text-[12.5px] font-medium rounded-[2px] transition-colors"
              >
                Explore Catalogue
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
