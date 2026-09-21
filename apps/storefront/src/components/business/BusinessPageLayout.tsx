'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { BusinessPageConfig, BUSINESS_TABS } from '../../lib/businessPages';
import { CountryCode, PHONE_COUNTRIES } from '../PhoneInputField';
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
      } else if (f.type === 'tel') {
        customFields[f.name] = fullPhone;
      } else {
        customFields[f.name] = formValues[f.name] || '';
      }
    });

    // Form type code
    let formType = 'business_enquiry';
    let prefix = 'BIZ-';
    if (config.slug === 'suppliers-vendors') {
      formType = 'supplier_vendor_enquiry';
      prefix = 'VND-';
    } else if (config.slug === 'interior-designers') {
      formType = 'architect_designer_enquiry';
      prefix = 'ARC-';
    } else if (config.slug === 'influencers-marketing') {
      formType = 'influencer_marketing_enquiry';
      prefix = 'INF-';
    } else if (config.slug === 'furniture-decor-designers') {
      formType = 'furniture_decor_designer_enquiry';
      prefix = 'DES-';
    }

    const contactName =
      formValues['contact_person'] ||
      formValues['business_name'] ||
      formValues['studio_name'] ||
      formValues['designer_name'] ||
      formValues['agency_name'] ||
      'Business Partner';

    const payload = {
      form_type: formType,
      full_name: contactName,
      name: contactName,
      email: formValues['email'] || '',
      phone: fullPhone,
      company:
        formValues['business_name'] ||
        formValues['studio_name'] ||
        formValues['agency_name'] ||
        formValues['publication_name'] ||
        '',
      notes:
        formValues['distinctive_notes'] ||
        formValues['project_brief'] ||
        formValues['collaboration_idea'] ||
        formValues['proposed_collection'] ||
        formValues['message'] ||
        '',
      custom_fields: customFields,
      source_url: typeof window !== 'undefined' ? window.location.href : `/${config.slug}`,
    };

    try {
      const res = await submitFormEntry(payload);
      if (res.success) {
        const id = res.referenceId || `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
        setReferenceId(id);
        setSubmitSuccess(true);
      } else {
        setServerError(res.message || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="business-page-wrapper">
      <div className="wrap business-container">

        {/* 1. TOP HEADER SECTION */}
        <header className="business-header">
          <span className="business-eyebrow">
            {config.page_eyebrow || 'BUSINESS'}
          </span>
          <div className="business-gold-line" />

          <h1 className="business-page-title">
            {config.page_title}
          </h1>

          <div className="business-subtitle-row">
            <p className="business-page-subtitle">
              {config.page_subtitle}
            </p>

            <div className="business-enquiry-indicator">
              <span className="business-enquiry-text">
                ENQUIRY FORM
              </span>
              <span className="business-enquiry-num">
                {config.enquiry_number || config.tab_number || '01'}
              </span>
            </div>
          </div>
        </header>

        {/* 2. TWO-COLUMN GRID: LEFT IMAGE + RIGHT (TABS & FORM) */}
        <div className="business-main-grid">

          {/* LEFT COLUMN: VISUAL IMAGE CARD */}
          <aside className="business-visual-card">
            <img
              src={config.visual.image_url}
              alt={config.visual.headline || config.page_title}
            />
          </aside>

          {/* RIGHT COLUMN: 2x2 TABS FLUSH AT TOP, FORM DIRECTLY BENEATH */}
          <section className="business-content-col">

            {/* 2x2 TAB GRID */}
            <nav aria-label="Business Enquiry Categories" className="business-tabs-grid">
              {BUSINESS_TABS.map((tab, idx) => {
                const isActive = tab.slug === config.slug;
                const positionClass =
                  idx === 0
                    ? 'tab-top-left'
                    : idx === 1
                    ? 'tab-top-right'
                    : idx === 2
                    ? 'tab-bottom-left'
                    : 'tab-bottom-right';

                return (
                  <Link
                    key={tab.slug}
                    href={tab.href}
                    className={`business-tab-item ${positionClass} ${isActive ? 'is-active' : ''}`}
                  >
                    <span className="business-tab-num">
                      {tab.number}
                    </span>
                    <span className="business-tab-label">
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* FORM SECTION */}
            <div className="business-form-section">

              {/* FORM HEADER */}
              <div style={{ marginBottom: 24 }}>
                <span className="business-form-eyebrow">
                  {config.form.eyebrow}
                </span>
                <div className="business-form-gold-line" />

                <div className="business-form-header-row">
                  <h2 className="business-form-title">
                    {config.form.title}
                  </h2>
                  <span className="business-form-notice">
                    {config.form.notice}
                  </span>
                </div>
              </div>

              {/* SERVER ERROR */}
              {serverError && (
                <div style={{ marginBottom: 20, padding: 14, background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', fontSize: 13, borderRadius: 2 }}>
                  {serverError}
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="business-fields-grid">
                  {config.form.fields.map((field) => {
                    const isFullWidth = field.width === 'full' || field.type === 'textarea' || field.type === 'checkbox_group' || field.type === 'file';
                    const colClass = isFullWidth ? 'business-field-col-full' : 'business-field-col-half';
                    const error = fieldErrors[field.name];

                    // Check if this is a single-choice consent checkbox
                    const isConsentField = field.name === 'consent' || (field.type === 'checkbox_group' && (!field.options || !field.options.includes('\n')));

                    return (
                      <div
                        key={field.id || field.name}
                        id={`field-${field.name}`}
                        className={colClass}
                      >
                        {/* LABEL (except for consent single checkbox) */}
                        {(!isConsentField || field.type !== 'checkbox_group') && (
                          <label className="business-field-label">
                            {field.label}
                            {field.required && <span className="business-req-star">*</span>}
                          </label>
                        )}

                        {/* TEXT / EMAIL / URL / NUMBER */}
                        {(field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'number') && (
                          <input
                            type={field.type}
                            value={formValues[field.name] || ''}
                            placeholder={field.placeholder}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className={`business-input ${error ? 'is-error' : ''}`}
                          />
                        )}

                        {/* PHONE WITH COUNTRY CODE SELECTOR */}
                        {field.type === 'tel' && (
                          <div className="business-phone-row">
                            <div className="business-phone-prefix">
                              <select
                                value={phoneCountry.iso}
                                onChange={(e) => {
                                  const c = PHONE_COUNTRIES.find((item) => item.iso === e.target.value) || PHONE_COUNTRIES[0];
                                  setPhoneCountry(c);
                                  handleInputChange(field.name, `${c.code} ${phoneDigits}`);
                                }}
                                aria-label="Country phone code"
                              >
                                {PHONE_COUNTRIES.map((c) => (
                                  <option key={c.iso} value={c.iso}>
                                    {c.flag} {c.code}
                                  </option>
                                ))}
                              </select>
                              <span className="business-phone-prefix-arrow">▼</span>
                            </div>
                            <input
                              type="tel"
                              value={phoneDigits}
                              placeholder={field.placeholder || '+91'}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '');
                                setPhoneDigits(digits);
                                handleInputChange(field.name, `${phoneCountry.code} ${digits}`);
                              }}
                              className={`business-input ${error ? 'is-error' : ''}`}
                            />
                          </div>
                        )}

                        {/* SELECT DROPDOWN */}
                        {field.type === 'select' && (
                          <div className="business-select-wrapper">
                            <select
                              value={formValues[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              className={`business-select ${!formValues[field.name] ? 'is-empty' : ''} ${error ? 'is-error' : ''}`}
                            >
                              <option value="">{field.placeholder || 'Select an option'}</option>
                              {(field.options || '')
                                .split('\n')
                                .map((opt) => opt.trim())
                                .filter(Boolean)
                                .map((opt) => (
                                  <option key={opt} value={opt} style={{ color: '#111111' }}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                            <div className="business-select-arrow">
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* CHECKBOX GROUP (MULTI-OPTION RECTANGULAR OUTLINE TILES) */}
                        {field.type === 'checkbox_group' && !isConsentField && (
                          <div className="business-checkbox-group-wrapper">
                            {(field.options || '')
                              .split('\n')
                              .map((opt) => opt.trim())
                              .filter(Boolean)
                              .map((opt) => {
                                const isChecked = (selectedCheckboxes[field.name] || []).includes(opt);
                                return (
                                  <div
                                    key={opt}
                                    onClick={() => handleCheckboxToggle(field.name, opt)}
                                    className={`business-checkbox-tile ${isChecked ? 'is-checked' : ''}`}
                                  >
                                    <div className="business-checkbox-box">
                                      {isChecked && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <span>{opt}</span>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* CONSENT SINGLE CHECKBOX */}
                        {field.type === 'checkbox_group' && isConsentField && (
                          <div
                            onClick={() => {
                              const text = (field.options || field.label).trim();
                              handleCheckboxToggle(field.name, text);
                            }}
                            className="business-consent-row"
                          >
                            <div className="business-checkbox-box" style={{ marginTop: 2 }}>
                              {(selectedCheckboxes[field.name] || []).length > 0 && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="business-consent-text">
                              {(field.options || field.label).replace(/\*$/, '').trim()}
                              {field.required && <span className="business-req-star">*</span>}
                            </span>
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
                              style={{ display: 'none' }}
                              accept=".pdf,.dwg,.jpg,.jpeg,.png,.webp,.zip"
                            />

                            <div
                              onClick={() => fileInputRefs.current[field.name]?.click()}
                              className={`business-file-dropzone ${error ? 'is-error' : ''}`}
                            >
                              {uploadedFiles[field.name] ? (
                                <div className="business-file-preview">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                    <svg width="16" height="16" fill="none" stroke="#C2A686" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span style={{ fontSize: 12.5, fontWeight: 500, color: '#111111', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
                                    style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 12, textDecoration: 'underline' }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="business-file-btn">Choose File</span>
                                    <span className="business-file-text">
                                      {isUploading[field.name] ? 'Uploading file...' : 'No file chosen'}
                                    </span>
                                  </div>
                                  <span className="business-file-subtext" style={{ marginTop: 0 }}>
                                    {field.help_text || 'PDF, JPG or PNG · up to 10 MB'}
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
                            className={`business-textarea ${error ? 'is-error' : ''}`}
                          />
                        )}

                        {/* FIELD ERROR */}
                        {error && (
                          <p className="business-field-error">
                            {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* HORIZONTAL DIVIDER */}
                <hr className="business-form-divider" />

                {/* BOTTOM ACTION BAR */}
                <div className="business-form-footer">
                  <p className="business-review-note">
                    {config.form.review_note || 'We usually review business enquiries within 2–3 working days.'}
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="business-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
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
        <div className="business-modal-backdrop">
          <div className="business-modal-card">
            <div style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: '50%', background: '#FAF5EE', border: '1px solid #EADCC8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2A686' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span style={{ fontSize: 10, letterSpacing: '0.2em', fontWeight: 600, color: '#8C827A', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              {config.tab_label.toUpperCase()} ENQUIRY
            </span>

            <h3 style={{ fontFamily: 'var(--font-display, "EB Garamond", serif)', fontSize: 26, fontWeight: 400, color: '#111111', margin: '0 0 10px' }}>
              {config.form.success_title || 'Enquiry Received'}
            </h3>

            <p style={{ fontSize: 14, color: '#6B635B', lineHeight: 1.6, margin: '0 0 20px' }}>
              {config.form.success_message}
            </p>

            <div style={{ background: '#FAF8F5', border: '1px solid #E8E2D9', borderRadius: 2, padding: '10px 16px', marginBottom: 24, display: 'inline-block' }}>
              <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C827A', display: 'block', marginBottom: 2 }}>
                Reference ID
              </span>
              <strong style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 16, color: '#382215', letterSpacing: '0.05em' }}>
                {referenceId}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setFormValues({});
                  setSelectedCheckboxes({});
                  setUploadedFiles({});
                }}
                style={{ padding: '10px 20px', border: '1px solid #D9D2C7', background: '#FFFFFF', color: '#2E2823', fontSize: 13, fontWeight: 500, borderRadius: 2, cursor: 'pointer' }}
              >
                Submit another enquiry
              </button>
              <Link
                href="/collections"
                style={{ padding: '10px 20px', background: '#382215', color: '#FFFFFF', fontSize: 13, fontWeight: 500, borderRadius: 2, textDecoration: 'none', display: 'inline-block' }}
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
