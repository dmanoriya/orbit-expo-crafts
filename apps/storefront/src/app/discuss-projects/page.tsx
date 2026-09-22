'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { submitFormEntry } from '../../lib/submitFormEntry';
import PhoneInputField, { CountryCode, PHONE_COUNTRIES, validatePhoneNumber } from '../../components/PhoneInputField';

export default function DiscussProjectsPage() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: 'Boutique Hotel / Resort',
    scope: '50-100 Rooms / Keys',
    location: '',
    timeline: 'Within 3-6 Months',
    message: '',
  });

  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(PHONE_COUNTRIES[0]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Trade Portal Account (Required when not logged in)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isInlineLogin, setIsInlineLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refId, setRefId] = useState('');

  const syncPhoneFromString = (rawPhone?: string) => {
    if (!rawPhone) return;
    const matchedCountry = PHONE_COUNTRIES.find((c) => rawPhone.startsWith(c.code));
    if (matchedCountry) {
      setPhoneCountry(matchedCountry);
      const digits = rawPhone.replace(matchedCountry.code, '').replace(/\D/g, '');
      setPhoneDigits(digits);
    } else {
      const digits = rawPhone.replace(/\D/g, '');
      setPhoneDigits(digits.slice(0, 10));
    }
  };

  // Prefill if logged in or from previous submission
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
        email: prev.email || user.email || '',
        company: prev.company || user.company || '',
        phone: prev.phone || user.phone || '',
      }));
      if (user.phone) syncPhoneFromString(user.phone);
    } else {
      try {
        const cachedStr = localStorage.getItem('orbit_last_submitted_profile');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          setFormData((prev) => ({
            ...prev,
            name: prev.name || cached.fullName || '',
            email: prev.email || cached.email || '',
            company: prev.company || cached.company || '',
            phone: prev.phone || cached.phone || '',
          }));
          if (cached.phone) syncPhoneFromString(cached.phone);
        }
      } catch (e) {}
    }
  }, [user]);

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

  const handleBlur = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (field === 'name') {
        const cleanName = formData.name.trim();
        if (!cleanName || cleanName.length < 2) next.name = 'Please enter your full name (min 2 letters).';
        else if (/^\d+$/.test(cleanName)) next.name = 'Name cannot contain only numbers.';
        else delete next.name;
      } else if (field === 'company') {
        if (!formData.company.trim()) next.company = 'Company / Studio name is required.';
        else delete next.company;
      } else if (field === 'email') {
        const cleanEmail = formData.email.trim();
        const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!cleanEmail) next.email = 'Business email is required.';
        else if (!EMAIL_REGEX.test(cleanEmail)) next.email = 'Please enter a valid business email address (e.g. name@studio.com).';
        else delete next.email;
      } else if (field === 'phone') {
        const err = validatePhoneNumber(phoneDigits, phoneCountry, true);
        if (err) next.phone = err;
        else delete next.phone;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    const cleanName = formData.name.trim();
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Please enter your full name (min 2 letters).';
    } else if (/^\d+$/.test(cleanName)) {
      errors.name = 'Name cannot contain only numbers.';
    }

    if (!formData.company.trim()) {
      errors.company = 'Company / Studio name is required.';
    }

    const cleanEmail = formData.email.trim();
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail) {
      errors.email = 'Business email is required.';
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Please enter a valid business email address (e.g. name@studio.com).';
    }

    const phoneErr = validatePhoneNumber(phoneDigits, phoneCountry, true);
    if (phoneErr) {
      errors.phone = phoneErr;
    }

    // Validate account requirement if guest
    if (!user) {
      if (isInlineLogin) {
        setLoginError('Please click "Sign In" or switch to Set Password.');
        return;
      }
      if (!password || password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        errors.password = 'Password must be at least 6 characters.';
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match. Please re-enter.');
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    setPasswordError('');

    const fullPhone = phoneDigits ? `${phoneCountry.code} ${phoneDigits}` : formData.phone;

    const formPayload = {
      form_type: 'discuss_projects',
      full_name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: fullPhone,
      project_type: formData.projectType,
      notes: `Scope: ${formData.scope}\nLocation: ${formData.location}\nTimeline: ${formData.timeline}\n\nProject Brief:\n${formData.message}`,
      source_page: typeof window !== 'undefined' ? window.location.pathname : '/discuss-projects',
      source_title: 'Turnkey Consultation (Discuss Projects)',
      user_id: user?.id || 0,
      account_status: user ? 'Registered Customer' : 'New Account Created',
      create_account: !user,
      password: password || undefined,
    };

    let generatedRef = '';

    try {
      const subRes = await submitFormEntry(formPayload);
      if (subRes.referenceId) {
        generatedRef = subRes.referenceId;
      }
      // Save submitted profile to localStorage for instant cross-tab / portal hydration
      const nameParts = (formData.name || '').trim().split(' ');
      const fName = nameParts[0] || 'Trade';
      const lName = nameParts.slice(1).join(' ') || 'Client';

      try {
        localStorage.setItem(
          'orbit_last_submitted_profile',
          JSON.stringify({
            fullName: (formData.name || '').trim(),
            firstName: fName,
            lastName: lName,
            company: (formData.company || '').trim(),
            phone: fullPhone,
            email: (formData.email || '').trim(),
          })
        );
      } catch (e) {}

      if (!user && password && formData.email) {
        try {
          await login(formData.email.trim(), password, {
            firstName: fName,
            lastName: lName,
            company: (formData.company || '').trim(),
            phone: fullPhone,
          });
        } catch (loginErr) {
          console.warn('Auto-login post submission:', loginErr);
        }
      }
    } catch (err) {
      console.warn('Error submitting discuss-projects inquiry:', err);
    }

    if (!generatedRef) {
      generatedRef = 'PRJ-' + Math.floor(100000 + Math.random() * 900000);
    }

    setRefId(generatedRef);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#111111', minHeight: '100vh', padding: '36px 0 80px' }}>
      <div className="wrap">
        {/* BREADCRUMBS */}
        <div className="crumbs" style={{ marginBottom: 24 }}>
          <Link href="/">Home</Link> / <span style={{ fontWeight: 600 }}>Discuss Projects</span>
        </div>

        {/* HERO SECTION */}
        <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 40, marginBottom: 48 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 12 }}>
            TURNKEY CONTRACT CONSULTATION
          </span>
          <h1 className="disp" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 400, color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}>
            Discuss Your Project
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: '68ch', marginTop: 16, lineHeight: 1.6 }}>
            Tell us about your project and furniture needs. We help turn your ideas and designs into custom furniture for your space.
          </p>
        </div>

        {/* MAIN 2-COL CONTENT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '48px', alignItems: 'start' }} className="two">
          {/* LEFT: Capabilities & Direct Connect */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>
              How We Work With You
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>1. Share Your Furniture Requirements</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  Share your ideas, drawings, reference images, dimensions, and quantities so we can understand your project and custom furniture needs.
                </p>
              </div>

              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>2. Choose Materials &amp; Finishes</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  Select materials, colours, fabrics, and finishes to suit your design, intended use, and budget.
                </p>
              </div>

              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>3. Review &amp; Approve the Design</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  Confirm furniture specifications, drawings, and any required samples before production begins.
                </p>
              </div>

              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>4. Production &amp; Delivery</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  Once approved, we proceed with manufacturing, quality checks, packaging, and delivery based on the agreed project requirements.
                </p>
              </div>
            </div>

            {/* DIRECT HOTLINES */}
            <div style={{ padding: 24, background: '#111111', color: '#FFFFFF', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8, fontWeight: 600 }}>
                Direct Project Concierge
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
                Speak directly with our senior contract specifiers
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <a
                  href="https://wa.me/919928022151?text=Hi,%20I%20would%20like%20to%20discuss%20a%20turnkey%20furniture%20project"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#25D366',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  💬 Chat on WhatsApp
                </a>
                <a
                  href="mailto:sales@orbitexpocrafts.com?subject=New%20Project%20Inquiry"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  ✉️ Email Specifications
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Inquiry Form */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '36px 32px', boxShadow: 'var(--shadow-sm)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>✓</div>
                <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Project Brief Received</h3>
                {refId && (
                  <div style={{ display: 'inline-block', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
                    Reference ID: <code>{refId}</code>
                  </div>
                )}
                <p style={{ fontSize: 15, color: '#555555', lineHeight: 1.6, maxWidth: '42ch', margin: '0 auto 24px' }}>
                  Thank you for submitting your project specifications. A dedicated contract manager will review your brief and reach out within 24 hours with drawings &amp; initial estimates.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setRefId('');
                  }}
                  style={{
                    background: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 24px',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Submit Another Project
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                  Project Specification Brief
                </h2>
                <p style={{ fontSize: 13.5, color: '#666666', margin: '-10px 0 10px' }}>
                  Fill in the details below and our engineering team will get in touch with technical specs and estimates.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Architect Sarah Jenkins"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      onBlur={() => handleBlur('name')}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: fieldErrors.name ? '1px solid #DC2626' : '1px solid #CCC',
                        fontSize: 14,
                      }}
                    />
                    {fieldErrors.name && (
                      <span style={{ display: 'block', color: '#DC2626', fontSize: 12, marginTop: 4 }}>
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Company / Studio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jenkins Design Associates"
                      value={formData.company}
                      onChange={(e) => {
                        setFormData({ ...formData, company: e.target.value });
                        if (fieldErrors.company) setFieldErrors((prev) => ({ ...prev, company: '' }));
                      }}
                      onBlur={() => handleBlur('company')}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: fieldErrors.company ? '1px solid #DC2626' : '1px solid #CCC',
                        fontSize: 14,
                      }}
                    />
                    {fieldErrors.company && (
                      <span style={{ display: 'block', color: '#DC2626', fontSize: 12, marginTop: 4 }}>
                        {fieldErrors.company}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@design.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      onBlur={() => handleBlur('email')}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: fieldErrors.email ? '1px solid #DC2626' : '1px solid #CCC',
                        fontSize: 14,
                      }}
                    />
                    {fieldErrors.email && (
                      <span style={{ display: 'block', color: '#DC2626', fontSize: 12, marginTop: 4 }}>
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                  <div>
                    <PhoneInputField
                      label="Phone / WhatsApp"
                      required
                      value={phoneDigits}
                      countryCode={phoneCountry.code}
                      onChange={(digits, _fullNumber, countryObj) => {
                        setPhoneDigits(digits);
                        setPhoneCountry(countryObj);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      onCountryChange={setPhoneCountry}
                      onBlur={() => handleBlur('phone')}
                      error={fieldErrors.phone}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Project Typology
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, background: '#FFF' }}
                    >
                      <option>Boutique Hotel / Resort</option>
                      <option>Fine Dining / Restaurant / Bar</option>
                      <option>Luxury Private Residence / Villa</option>
                      <option>Corporate Office / Commercial</option>
                      <option>Bespoke Retail / Showroom</option>
                      <option>Turnkey Fit-Out</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Estimated Scope / Size
                    </label>
                    <select
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, background: '#FFF' }}
                    >
                      <option>Under 20 Keys / Rooms</option>
                      <option>20-50 Keys / Rooms</option>
                      <option>50-100 Keys / Rooms</option>
                      <option>100+ Keys / Volume Package</option>
                      <option>Full Villa / Estate Package</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Project Location (City / Country)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dubai, UAE / London, UK"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Target Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, background: '#FFF' }}
                    >
                      <option>Urgent (&lt; 2 Months)</option>
                      <option>Within 3-6 Months</option>
                      <option>6-12 Months</option>
                      <option>Concept / Planning Phase</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                    Scope Details, BOQ or Questions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about the pieces required (e.g. headboards, wardrobes, dining sets, inlay consoles) or paste link to Google Drive / Dropbox specs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, resize: 'vertical' }}
                  />
                </div>

                {/* TRADE PORTAL ACCOUNT SETUP (REQUIRED) */}
                {user ? (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: '#166534', fontWeight: 500 }}>
                      ✓ Linked to Trade Account: <strong>{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username || user.email)}</strong>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Active
                    </span>
                  </div>
                ) : (
                  <div style={{ background: '#FAF9F5', border: '1px solid #ECE7DE', borderRadius: 6, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111111' }}>
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
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Email or Username *
                            </label>
                            <input
                              type="text"
                              placeholder="your@email.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D5CEBE', fontSize: 13, background: '#FFFFFF' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Password *
                            </label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D5CEBE', fontSize: 13, background: '#FFFFFF' }}
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
                              borderRadius: 6,
                              padding: '8px 16px',
                              fontSize: 12.5,
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
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Account Password *
                            </label>
                            <input
                              type="password"
                              placeholder="Min 6 characters"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (passwordError) setPasswordError('');
                              }}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D5CEBE', fontSize: 13, background: '#FFFFFF' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#444444', marginBottom: 4 }}>
                              Confirm Password *
                            </label>
                            <input
                              type="password"
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (passwordError) setPasswordError('');
                              }}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D5CEBE', fontSize: 13, background: '#FFFFFF' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                    transition: 'background 0.2s ease',
                    marginTop: 6,
                  }}
                >
                  {isSubmitting ? 'Sending Project Specifications...' : 'Send Project Specifications →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
