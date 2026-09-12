'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { submitFormEntry } from '../../lib/submitFormEntry';

export default function InteriorDesignersPage() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    studioName: '',
    website: '',
    businessType: 'Interior Design Studio',
    taxId: '',
    address: '',
    cityCountry: '',
    projectSpecialization: 'Luxury Residential',
  });

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

  // Prefill if logged in or from previous submission
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
        email: prev.email || user.email || '',
        studioName: prev.studioName || user.company || '',
        phone: prev.phone || user.phone || '',
      }));
    } else {
      try {
        const cachedStr = localStorage.getItem('orbit_last_submitted_profile');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          setFormData((prev) => ({
            ...prev,
            name: prev.name || cached.fullName || '',
            email: prev.email || cached.email || '',
            studioName: prev.studioName || cached.company || '',
            phone: prev.phone || cached.phone || '',
          }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate account requirement if guest
    if (!user) {
      if (isInlineLogin) {
        setLoginError('Please click "Sign In" or switch to Set Password.');
        return;
      }
      if (!password || password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setIsSubmitting(true);
    setPasswordError('');

    const formPayload = {
      form_type: 'interior_designer',
      full_name: formData.name,
      company: formData.studioName,
      email: formData.email,
      phone: formData.phone,
      tax_id: formData.taxId,
      project_type: formData.businessType,
      notes: `Website / Portfolio: ${formData.website}\nSpecialization: ${formData.projectSpecialization}\nCity & Country: ${formData.cityCountry}\nStudio Address: ${formData.address}`,
      source_page: typeof window !== 'undefined' ? window.location.pathname : '/interior-designers',
      source_title: 'Interior Designer Trade Application',
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
            company: (formData.studioName || '').trim(),
            phone: (formData.phone || '').trim(),
            email: (formData.email || '').trim(),
          })
        );
      } catch (e) {}

      if (!user && password && formData.email) {
        try {
          await login(formData.email.trim(), password, {
            firstName: fName,
            lastName: lName,
            company: (formData.studioName || '').trim(),
            phone: (formData.phone || '').trim(),
          });
        } catch (loginErr) {
          console.warn('Auto-login post submission:', loginErr);
        }
      }
    } catch (err) {
      console.warn('Error submitting interior designer inquiry:', err);
    }

    if (!generatedRef) {
      generatedRef = 'DES-' + Math.floor(100000 + Math.random() * 900000);
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
          <Link href="/">Home</Link> / <span style={{ fontWeight: 600 }}>Interior Designers</span>
        </div>

        {/* HERO SECTION */}
        <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 40, marginBottom: 48 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 12 }}>
            TRADE &amp; DESIGN PARTNERSHIP PROGRAM
          </span>
          <h1 className="disp" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 400, color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}>
            Crafted for Interior Designers
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: '68ch', marginTop: 16, lineHeight: 1.6 }}>
            We empower interior architects and design studios with direct artisan factory pricing, bespoke dimension customization, 3D CAD modeling assets, and curated physical sample kits dispatched to your studio.
          </p>
        </div>

        {/* 4 CORE ADVANTAGES GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
            marginBottom: 56,
          }}
        >
          <div style={{ padding: '28px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🏷️</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Tiered Trade Pricing</h3>
            <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
              Access wholesale trade pricing on all standard catalog designs with no minimum order hurdles, escalating to volume discounts for multi-room specifications.
            </p>
          </div>

          <div style={{ padding: '28px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📐</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Bespoke Customization</h3>
            <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
              Adjust height, width, wood species (Teak, Sheesham, Mango, Acacia), bone inlay motifs, or provide COM (Customer’s Own Material) fabrics for upholstery.
            </p>
          </div>

          <div style={{ padding: '28px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📦</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Physical Swatch Kits</h3>
            <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
              Request hand-finished timber blocks, bone inlay sample tiles, brass swatches, and fabric cards dispatched to your office for client presentations.
            </p>
          </div>

          <div style={{ padding: '28px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>💻</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>3D CAD &amp; Render Assets</h3>
            <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
              Download 3D SketchUp (.skp), DWG, and OBJ models of our catalog products to seamlessly drop into client layout plans and photorealistic renders.
            </p>
          </div>
        </div>

        {/* 2-COL REGISTRATION SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '48px', alignItems: 'start' }} className="two">
          <div>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 10, fontWeight: 600 }}>
              VERIFIED TRADE ACCOUNT
            </span>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 16 }}>
              Apply for Trade Membership
            </h2>
            <p style={{ fontSize: 15, color: '#555555', lineHeight: 1.6, marginBottom: 24 }}>
              Trade accounts are open to licensed interior designers, architects, decorators, developers, and hospitality procurement companies. Once approved, you gain immediate access to trade pricing sheets, dedicated account managers, and sample requests.
            </p>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 24, marginTop: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>What you get upon verification:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#444444' }}>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>✓</span> Digital Trade Catalog PDF &amp; Pricing Matrix
                </li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>✓</span> Complimentary material sample box for active projects
                </li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>✓</span> Dedicated Trade Concierge for CAD and shipping coordination
                </li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>✓</span> Direct factory access for custom modifications
                </li>
              </ul>
            </div>
          </div>

          {/* APPLICATION FORM */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '36px 32px', boxShadow: 'var(--shadow-sm)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>✓</div>
                <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Application Submitted</h3>
                {refId && (
                  <div style={{ display: 'inline-block', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
                    Reference ID: <code>{refId}</code>
                  </div>
                )}
                <p style={{ fontSize: 15, color: '#555555', lineHeight: 1.6, maxWidth: '42ch', margin: '0 auto 24px' }}>
                  Thank you for applying for the Orbit Expo Crafts Trade Program. Our trade desk will verify your credentials and send your trade account details within 24 hours.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href="/collections"
                    style={{
                      display: 'inline-block',
                      background: '#111111',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      borderRadius: 6,
                      padding: '10px 24px',
                      fontSize: 14,
                    }}
                  >
                    Explore Catalog
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setRefId('');
                    }}
                    style={{
                      background: '#F3F4F6',
                      color: '#111111',
                      border: '1px solid #D1D5DB',
                      borderRadius: 6,
                      padding: '10px 20px',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Trade Account Application</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Miller"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Professional Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="david@millerinteriors.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Studio / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Miller Interiors Studio"
                      value={formData.studioName}
                      onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Website / Portfolio URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://millerinteriors.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Business Type
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5, background: '#FFF' }}
                    >
                      <option>Interior Design Studio</option>
                      <option>Architecture Firm</option>
                      <option>Hospitality Specifier / Procurement</option>
                      <option>Real Estate Developer</option>
                      <option>Furniture Retailer / Importer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Tax ID / Resale License #
                    </label>
                    <input
                      type="text"
                      placeholder="Optional / Resale Permit #"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Phone / Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 234-5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      City &amp; Country *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New York, USA"
                      value={formData.cityCountry}
                      onChange={(e) => setFormData({ ...formData, cityCountry: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                    />
                  </div>
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
                    padding: '13px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s ease',
                    marginTop: 6,
                  }}
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Trade Application →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
