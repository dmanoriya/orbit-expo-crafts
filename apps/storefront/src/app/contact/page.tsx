'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEnquiry } from '../../context/EnquiryContext';
import { useAuth } from '../../context/AuthContext';
import { submitFormEntry } from '../../lib/submitFormEntry';
import PhoneInputField, {
  CountryCode,
  PHONE_COUNTRIES,
  getPhonePlaceholder,
  getMaxDigits,
  validatePhoneNumber,
} from '../../components/PhoneInputField';
import './contact.css';


const SPAM_KEYWORDS = [
  'casino', 'viagra', 'porn', 'sex', 'crypto', 'bitcoin', 'loan', 'investment',
  'http://', 'https://', 'www.', '.com', '.ru', '.cn', 'adult', 'dating', 'gambling'
];

export default function ContactPage() {
  const { enquiry, removeEnquiry, clearEnquiry } = useEnquiry();
  const { user, login } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('step') === '2') setStep(2);
      else if (params.get('step') === '3') setStep(3);
    }
  }, []);


  // Form State
  const [projectType, setProjectType] = useState('Hotel / Resort Fit-out');
  const [quantity, setQuantity] = useState<number>(25);
  const [description, setDescription] = useState('');

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(PHONE_COUNTRIES[0]);
  const [phone, setPhone] = useState('');

  // Trade Portal Account (Required when not logged in)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isInlineLogin, setIsInlineLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Helper to parse phone number and country code cleanly
  const parsePhoneAndCountry = (rawPhone: string) => {
    if (!rawPhone) return { country: PHONE_COUNTRIES[0], digits: '' };
    const trimmed = rawPhone.trim();
    const matchedCountry = PHONE_COUNTRIES.find((c) => trimmed.startsWith(c.code));
    if (matchedCountry) {
      const localDigits = trimmed.slice(matchedCountry.code.length).replace(/\D/g, '');
      return { country: matchedCountry, digits: localDigits };
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      return { country: PHONE_COUNTRIES[0], digits: digits.slice(2) };
    }
    return { country: PHONE_COUNTRIES[0], digits };
  };

  useEffect(() => {
    if (user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '';
      if (!fullName && name) setFullName(name);
      if (!email && user.email) setEmail(user.email);
      if (!company && user.company) setCompany(user.company);
      if (!phone && user.phone) {
        const { country, digits } = parsePhoneAndCountry(user.phone);
        if (country) setSelectedCountry(country);
        setPhone(digits);
      }
    } else {
      try {
        const cachedStr = localStorage.getItem('orbit_last_submitted_profile');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (!fullName && cached.fullName) setFullName(cached.fullName);
          if (!email && cached.email) setEmail(cached.email);
          if (!company && cached.company) setCompany(cached.company);
          if (!phone && cached.phone) {
            const { country, digits } = parsePhoneAndCountry(cached.phone);
            if (country) setSelectedCountry(country);
            setPhone(digits);
          }
        }
      } catch (e) {}
    }
  }, [user]);

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

  const handleInlineLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email/username and password.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');
    const res = await login(loginEmail, loginPassword);
    setIsLoggingIn(false);
    if (res.success) {
      setIsInlineLogin(false);
      setPasswordError('');
      setLoginError('');
    } else {
      setLoginError(res.error || 'Invalid credentials. Please verify your username/email and password.');
    }
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
    const phoneErr = validatePhoneNumber(phone, selectedCountry, true);
    if (phoneErr) {
      errs.phone = phoneErr;
    }

    // Trade Portal Account (Mandatory for unauthenticated users)
    if (!user) {
      if (isInlineLogin) {
        errs.password = 'Please click "Sign In" or switch to Set Password.';
        setLoginError('Please sign in to complete your quote request.');
      } else {
        if (!password || password.length < 6) {
          errs.password = 'Password must be at least 6 characters.';
          setPasswordError('Password must be at least 6 characters.');
        } else if (password !== confirmPassword) {
          errs.password = 'Passwords do not match.';
          setPasswordError('Passwords do not match. Please re-enter.');
        } else {
          setPasswordError('');
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFieldBlur = (fieldName: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldName === 'fullName') {
        const trimmedName = fullName.trim();
        if (!trimmedName) next.fullName = 'Full Name is required.';
        else if (trimmedName.length < 2) next.fullName = 'Full Name must be at least 2 characters.';
        else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) next.fullName = 'Name can only contain letters and standard characters.';
        else if (SPAM_KEYWORDS.some((kw) => trimmedName.toLowerCase().includes(kw))) next.fullName = 'Invalid name input.';
        else delete next.fullName;
      } else if (fieldName === 'email') {
        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail) next.email = 'Email Address is required.';
        else if (!emailRegex.test(trimmedEmail)) next.email = 'Please enter a valid business email address (e.g. name@company.com).';
        else delete next.email;
      } else if (fieldName === 'phone') {
        const err = validatePhoneNumber(phone, selectedCountry, true);
        if (err) next.phone = err;
        else delete next.phone;
      }
      return next;
    });
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

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://orbitexpocrafts.com';
    const firstItem = enquiry.length > 0 ? enquiry[0] : null;
    const firstItemUrl = firstItem ? `${origin}/product/${firstItem.id}` : '';

    const formPayload = {
      form_type: 'quote_enquiry',
      full_name: fullName,
      company: company,
      email: email,
      phone: `${selectedCountry.code} ${phone}`,
      project_type: projectType,
      quantity: String(quantity),
      notes: description,
      product_name: firstItem ? (enquiry.length === 1 ? firstItem.name : `${enquiry.length} Shortlisted Products`) : '',
      product_image: firstItem?.image || '',
      product_url: firstItemUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      source_page: typeof window !== 'undefined' ? window.location.pathname : '/contact',
      source_title: 'Contact Us & Quote Enquiry',
      user_id: user?.id || 0,
      account_status: user ? 'Registered Customer' : 'New Account Created',
      create_account: !user,
      password: password || undefined,
      shortlist_items: enquiry.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.q,
        image: i.image,
        catName: i.catName,
        url: `${origin}/product/${i.id}`,
      })),
    };

    let generatedRef = '';
    try {
      const subRes = await submitFormEntry(formPayload);
      if (subRes.referenceId) {
        generatedRef = subRes.referenceId;
      }
      // Save submitted profile to localStorage for instant cross-tab / portal hydration
      const nameParts = fullName.trim().split(' ');
      const fName = nameParts[0] || 'Trade';
      const lName = nameParts.slice(1).join(' ') || 'Client';
      const formattedPhone = `${selectedCountry.code} ${phone}`.trim();

      try {
        localStorage.setItem(
          'orbit_last_submitted_profile',
          JSON.stringify({
            fullName: fullName.trim(),
            firstName: fName,
            lastName: lName,
            company: company.trim(),
            phone: formattedPhone,
            email: email.trim(),
          })
        );
      } catch (e) {}

      if (!user && password && email) {
        try {
          await login(email.trim(), password, {
            firstName: fName,
            lastName: lName,
            company: company.trim(),
            phone: formattedPhone,
          });
        } catch (loginErr) {
          console.warn('Auto-login post submission:', loginErr);
        }
      }
    } catch (err) {
      console.warn('Form submission error:', err);
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
    <div className="contact-page-root">
      {/* FULL WIDTH HERO BANNER */}
      <div className="contact-hero-banner">
        <img
          src="/contact-hero.webp"
          alt="Orbit Expo Crafts Showroom Living & Dining"
          className="contact-hero-img"
        />
      </div>

      <div className="contact-main-wrap">
        {/* BREADCRUMBS */}
        <div className="contact-breadcrumbs">
          <Link href="/">HOME</Link>
          <span className="contact-crumb-sep">/</span>
          <span className="contact-crumb-current">ENQUIRY</span>
        </div>

        {/* TWO-COLUMN EDITORIAL LAYOUT */}
        <div className="contact-layout-grid">
          {/* LEFT COLUMN: INFORMATION & WORKSHOP DETAILS */}
          <div className="contact-left-col">
            <h1 className="contact-main-heading">
              Tell us what you need. We&apos;ll price it properly.
            </h1>
            <p className="contact-subtext">
              A fair contract price depends on quantity, finish, destination and lead time. Send this form and our project desk replies within 24 working hours.
            </p>

            <div className="contact-direct-info">
              <a href="mailto:sales@orbitexpocrafts.com" className="contact-email-link">
                sales@orbitexpocrafts.com
              </a>
              <p className="contact-working-hours">
                Monday to Saturday, 10:00—19:00
              </p>
            </div>

            <p className="contact-workshop-tagline">
              Solid sheesham and teak, finished in our own workshop.
            </p>

            {/* SHORTLIST PREVIEW (IF ACTIVE SHORTLIST EXISTS) */}
            {enquiry.length > 0 ? (
              <div className="contact-shortlist-card">
                <h4>
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
                    <button type="button" className="rm" onClick={() => removeEnquiry(i.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* FACTORY TRUST CAPABILITIES */}
            <div className="contact-caps-grid">
              <div className="contact-cap-item">
                <h4>24-hr Response</h4>
                <p>Direct factory quote</p>
              </div>
              <div className="contact-cap-item">
                <h4>NDA Available</h4>
                <p>Strict confidentiality</p>
              </div>
              <div className="contact-cap-item">
                <h4>Export Freight</h4>
                <p>ISPM-15 &amp; IEC compliant</p>
              </div>
              <div className="contact-cap-item">
                <h4>Dedicated Manager</h4>
                <p>Named project desk contact</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STYLED FORM CARD */}
          <div className="contact-form-card">
            {/* STEP PROGRESS INDICATOR */}
            {step < 3 && (
              <div className="contact-step-header">
                <div className="contact-step-meta">
                  <span>STEP {step} OF 2</span>
                  <span style={{ color: '#8C847B' }}>
                    {step === 1 ? 'Project Requirements' : 'Contact Details'}
                  </span>
                </div>
                <div className="contact-step-track">
                  <div
                    className="contact-step-fill"
                    style={{ width: step === 1 ? '50%' : '100%' }}
                  />
                </div>
              </div>
            )}

            {/* STEP 1: PROJECT REQUIREMENTS */}
            {step === 1 && (
              <div>
                <div className="contact-field">
                  <label htmlFor="contact-project-type">PROJECT TYPE / REQUIREMENT</label>
                  <select
                    id="contact-project-type"
                    className="contact-select"
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

                <div className="contact-field">
                  <label htmlFor="contact-quantity">ESTIMATED QUANTITY (UNITS)</label>
                  <input
                    id="contact-quantity"
                    type="number"
                    min="1"
                    className="contact-input"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                  {errors.quantity && <span className="field-error">{errors.quantity}</span>}
                </div>

                <div className="contact-field" style={{ marginBottom: 24 }}>
                  <label htmlFor="contact-notes">REQUIREMENT</label>
                  <textarea
                    id="contact-notes"
                    rows={4}
                    className="contact-textarea"
                    placeholder="What you need, quantity and location"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {errors.description && <span className="field-error">{errors.description}</span>}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="contact-btn-submit"
                >
                  NEXT: CONTACT DETAILS →
                </button>
                <p className="contact-form-privacy">
                  Your details are used only to respond to this enquiry.
                </p>
              </div>
            )}

            {/* STEP 2: CONTACT DETAILS WITH COUNTRY FLAG SELECTOR */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                {/* FULL NAME */}
                <div className="contact-field">
                  <label htmlFor="contact-name">NAME *</label>
                  <input
                    id="contact-name"
                    type="text"
                    className="contact-input"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    onBlur={() => handleFieldBlur('fullName')}
                  />
                  {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                </div>

                {/* COMPANY / FIRM NAME */}
                <div className="contact-field">
                  <label htmlFor="contact-company">COMPANY / ARCHITECTURAL FIRM (OPTIONAL)</label>
                  <input
                    id="contact-company"
                    type="text"
                    className="contact-input"
                    placeholder="e.g. Studio Lotus Architects"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                {/* BUSINESS EMAIL */}
                <div className="contact-field">
                  <label htmlFor="contact-email">EMAIL *</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="contact-input"
                    placeholder="How we reach you (name@company.com)"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    onBlur={() => handleFieldBlur('email')}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                {/* PHONE / WHATSAPP WITH DYNAMIC COUNTRY FLAG SELECTOR */}
                <div className="contact-field" style={{ marginBottom: 20 }}>
                  <label>PHONE / WHATSAPP NUMBER *</label>
                  <div className="contact-phone-group">
                    <div className="contact-flag-selector">
                      <select
                        aria-label="Select Country Dial Code"
                        value={selectedCountry.iso}
                        onChange={(e) => {
                          const found = PHONE_COUNTRIES.find((c) => c.iso === e.target.value) || PHONE_COUNTRIES[0];
                          setSelectedCountry(found);
                          const maxDigits = getMaxDigits(found);
                          const cleanDigits = phone.replace(/\D/g, '').slice(0, maxDigits);
                          setPhone(cleanDigits);
                          if (errors.phone) {
                            const err = validatePhoneNumber(cleanDigits, found, true);
                            setErrors((prev) => ({ ...prev, phone: err || '' }));
                          }
                        }}
                      >
                        {PHONE_COUNTRIES.map((c) => (
                          <option key={c.iso} value={c.iso}>
                            {c.flag} {c.code} ({c.country})
                          </option>
                        ))}
                      </select>
                      <span className="contact-flag-display">
                        {selectedCountry.flag} {selectedCountry.code}
                      </span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="contact-input"
                      maxLength={getMaxDigits(selectedCountry)}
                      placeholder={getPhonePlaceholder(selectedCountry)}
                      value={phone}
                      onChange={(e) => {
                        const maxDigits = getMaxDigits(selectedCountry);
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
                        setPhone(digitsOnly);
                        if (errors.phone) {
                          const err = validatePhoneNumber(digitsOnly, selectedCountry, true);
                          if (!err) setErrors((prev) => ({ ...prev, phone: '' }));
                        }
                      }}
                      onBlur={() => handleFieldBlur('phone')}
                    />
                  </div>
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                  {selectedCountry.hint && !errors.phone && (
                    <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Format: {selectedCountry.code} {selectedCountry.placeholder} ({selectedCountry.hint})
                    </p>
                  )}
                </div>

                {/* TRADE PORTAL ACCOUNT SETUP (REQUIRED) */}
                {user ? (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 4, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 12.5, color: '#166534', fontWeight: 500 }}>
                      ✓ Linked to Trade Account: <strong>{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username || user.email)}</strong>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Active
                    </span>
                  </div>
                ) : (
                  <div style={{ background: '#FAF9F5', border: '1px solid #ECE7DE', borderRadius: 6, padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111111' }}>
                        Trade Portal Account (Required)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInlineLogin(!isInlineLogin);
                          setPasswordError('');
                          setLoginError('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0E5C63',
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {isInlineLogin ? '← Set password instead' : 'Already registered? Sign In'}
                      </button>
                    </div>

                    {isInlineLogin ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {loginError && (
                          <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}>
                            {loginError}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Email or Username *
                            </label>
                            <input
                              type="text"
                              className="contact-input"
                              placeholder="your@email.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              style={{ padding: '9px 11px', background: '#FFFFFF' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Password *
                            </label>
                            <input
                              type="password"
                              className="contact-input"
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              style={{ padding: '9px 11px', background: '#FFFFFF' }}
                            />
                          </div>
                        </div>
                        <div>
                          <button
                            type="button"
                            disabled={isLoggingIn}
                            onClick={handleInlineLogin}
                            style={{
                              background: '#111111',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 4,
                              padding: '8px 16px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isLoggingIn ? 'Signing In...' : 'Sign In →'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {passwordError && (
                          <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}>
                            {passwordError}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Account Password *
                            </label>
                            <input
                              type="password"
                              className="contact-input"
                              placeholder="Min 6 characters"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (passwordError) setPasswordError('');
                              }}
                              style={{ padding: '9px 11px', background: '#FFFFFF' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Confirm Password *
                            </label>
                            <input
                              type="password"
                              className="contact-input"
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (passwordError) setPasswordError('');
                              }}
                              style={{ padding: '9px 11px', background: '#FFFFFF' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    type="button"
                    className="contact-btn-back"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="contact-btn-submit"
                    style={{ flex: 1 }}
                  >
                    {isSubmitting ? 'Sending Enquiry…' : 'SEND ENQUIRY'}
                  </button>
                </div>
                <p className="contact-form-privacy">
                  Your details are used only to respond to this enquiry.
                </p>
              </form>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION SCREEN */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: '#e6f4ea',
                    color: '#137333',
                    fontSize: 28,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                  }}
                >
                  ✓
                </div>
                <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 26, marginBottom: 8, fontWeight: 400 }}>
                  Enquiry Sent Successfully!
                </h3>
                <p className="sample-ref" style={{ marginBottom: 12 }}>Reference ID: <strong>{refId}</strong></p>
                <p style={{ color: '#55504A', marginBottom: 24, fontSize: 14.5, lineHeight: 1.6 }}>
                  Thank you, <strong>{fullName}</strong>. Our project desk in Rajasthan will review your requirements for <strong>{projectType}</strong> and reply with a formal costed proposal within <strong>24 working hours</strong>.
                </p>

                <div className="sample-summary-card" style={{ marginBottom: 24, textTransform: 'none' }}>
                  <div><span>Name:</span> <strong>{fullName}</strong></div>
                  <div><span>Project:</span> <strong>{projectType} ({quantity} units)</strong></div>
                  <div><span>Contact Phone:</span> <strong>{selectedCountry.code} {phone}</strong></div>
                  <div><span>Email:</span> <strong>{email}</strong></div>
                </div>

                <Link href="/collections" className="contact-btn-submit" style={{ textDecoration: 'none' }}>
                  RETURN TO COLLECTIONS
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

