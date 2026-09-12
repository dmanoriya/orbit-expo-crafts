'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitFormEntry } from '../lib/submitFormEntry';

interface SampleCadModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestType: 'sample' | 'cad';
  productName: string;
  productImage?: string;
  productMoq?: number;
  initialFinish?: string;
}

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

export default function SampleCadModal({
  isOpen,
  onClose,
  requestType: initialRequestType = 'sample',
  productName = 'Selected Product',
  productImage,
  productMoq = 1,
  initialFinish = 'Standard Finish',
}: SampleCadModalProps) {
  const { user, login } = useAuth();
  const safeMoq = Math.max(1, Number(productMoq) || 1);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reqType, setReqType] = useState<'sample' | 'cad'>(initialRequestType || 'sample');
  
  // Step 1 Fields
  const [finish, setFinish] = useState(initialFinish || 'Standard Finish');
  const [quantity, setQuantity] = useState(safeMoq);
  const [notes, setNotes] = useState('');

  // Step 2 Fields
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[0]);
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
    if (!rawPhone) return { country: COUNTRIES[0], digits: '' };
    const trimmed = rawPhone.trim();
    const matchedCountry = COUNTRIES.find((c) => trimmed.startsWith(c.code));
    if (matchedCountry) {
      const localDigits = trimmed.slice(matchedCountry.code.length).replace(/\D/g, '');
      return { country: matchedCountry, digits: localDigits };
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      return { country: COUNTRIES[0], digits: digits.slice(2) };
    }
    return { country: COUNTRIES[0], digits };
  };

  // Auto-fill from user profile or last submitted profile
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
  }, [user, isOpen]);

  // Errors & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refId, setRefId] = useState('');

  const safeCountry = selectedCountry || COUNTRIES[0] || { country: 'India', code: '+91', flag: '🇮🇳', iso: 'IN' };

  if (!isOpen) return null;

  // Validation Checkers
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (quantity < safeMoq) {
      errs.quantity = `Quantity cannot be less than Minimum Order Quantity (${safeMoq} units).`;
    }

    if (notes) {
      const lower = (notes || '').toLowerCase();
      const hasSpam = SPAM_KEYWORDS.some((kw) => lower.includes(kw));
      if (hasSpam) {
        errs.notes = 'Spam URLs or inappropriate text detected. Please describe your project requirements cleanly.';
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

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};

    // Name validation
    const trimmedName = (fullName || '').trim();
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
    const trimmedEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errs.email = 'Email Address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address (e.g. name@company.com).';
    }

    // Phone / WhatsApp validation
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const isIndia = safeCountry.code === '+91';

    if (!cleanPhone) {
      errs.phone = 'Phone / WhatsApp number is required.';
    } else if (isIndia && cleanPhone.length !== 10) {
      errs.phone = 'Indian phone number must be exactly 10 digits (e.g. 9876543210).';
    } else if (!isIndia && (cleanPhone.length < 7 || cleanPhone.length > 12)) {
      errs.phone = 'International phone number must be between 7 and 12 digits.';
    }

    // Trade Portal Account (Mandatory for unauthenticated users)
    if (!user) {
      if (isInlineLogin) {
        errs.password = 'Please click "Sign In" to continue or switch back to set password.';
        setLoginError('Please sign in to complete your request.');
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

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);

    const formPayload = {
      form_type: reqType === 'sample' ? 'finish_sample' : 'cad_request',
      full_name: fullName,
      company: company,
      email: email,
      phone: `${safeCountry.code} ${phone}`,
      finish_preference: finish,
      quantity: quantity,
      product_name: productName,
      product_image: productImage || '',
      product_url: typeof window !== 'undefined' ? window.location.href : '',
      source_page: typeof window !== 'undefined' ? window.location.pathname : '',
      source_title: reqType === 'sample' ? `PDP Finish Sample (${productName})` : `PDP 3D CAD Request (${productName})`,
      user_id: user?.id || 0,
      account_status: user ? 'Registered Customer' : 'New Account Created',
      create_account: !user,
      password: password || undefined,
      notes: notes,
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
      const formattedPhone = `${safeCountry.code} ${phone}`.trim();

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

      // If newly registered, automatically login to synchronize session with profile fallback
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
      console.warn('Form API error, fallback ref:', err);
    }

    if (!generatedRef) {
      generatedRef = 'REQ-' + Math.floor(100000 + Math.random() * 900000);
    }

    setRefId(generatedRef);
    setIsSubmitting(false);
    setStep(3);
  };

  return (
    <div className="sample-modal-overlay">
      <div className="sample-modal-container">
        {/* MODAL HEADER */}
        <div className="sample-modal-header">
          <div>
            <div className="sample-modal-badge">
              {reqType === 'sample' ? '🎨 FINISH SAMPLES REQUEST' : '📐 CAD / 3D BLOCK REQUEST'}
            </div>
            <h2>{productName}</h2>
          </div>
          <button className="sample-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* PROGRESS BAR */}
        {step < 3 && (
          <div className="sample-progress-bar">
            <div className="sample-progress-text">
              <span>STEP {step} OF 2</span>
              <span>{step === 1 ? 'Specification & Quantity' : 'Contact & Delivery Details'}</span>
            </div>
            <div className="sample-progress-track">
              <div className="sample-progress-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
            </div>
          </div>
        )}

        {/* STEP 1: SPECIFICATIONS */}
        {step === 1 && (
          <div className="sample-modal-body">
            {/* TYPE TOGGLE */}
            <div className="field">
              <label>REQUEST CATEGORY</label>
              <div className="sample-type-toggle">
                <button
                  type="button"
                  className={reqType === 'sample' ? 'active' : ''}
                  onClick={() => setReqType('sample')}
                >
                  🎨 Request Finish Samples
                </button>
                <button
                  type="button"
                  className={reqType === 'cad' ? 'active' : ''}
                  onClick={() => setReqType('cad')}
                >
                  📐 Ask for CAD / 3D Block
                </button>
              </div>
            </div>

            {/* PRODUCT SUMMARY THUMBNAIL */}
            <div className="sample-product-preview">
              <img src={productImage || '/fallback-product.svg'} alt={productName} />
              <div>
                <strong>{productName}</strong>
                <span>Selected Finish: {finish}</span>
              </div>
            </div>

            {/* FINISH & QUANTITY */}
            <div className="grid2">
              <div className="field">
                <label>FINISH PREFERENCE</label>
                <input
                  type="text"
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  placeholder="e.g. Antique Brass, Walnut Stain"
                />
              </div>

              <div className="field">
                <label>APPROX. QUANTITY (MIN MOQ: {safeMoq})</label>
                <input
                  type="number"
                  min={safeMoq}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(safeMoq, parseInt(e.target.value) || safeMoq))}
                />
                {errors.quantity && <span className="field-error">{errors.quantity}</span>}
              </div>
            </div>

            {/* PROJECT NOTES TEXTAREA */}
            <div className="field">
              <label>PROJECT / SPECIFICATION NOTES (OPTIONAL)</label>
              <textarea
                rows={3}
                placeholder="Mention any custom dimensions, stain approvals, or project delivery timelines..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {errors.notes && <span className="field-error">{errors.notes}</span>}
            </div>

            <div className="sample-modal-footer">
              <button type="button" className="btn btn-soft" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-lg" onClick={handleNextStep}>
                Next: Contact Details →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONTACT & PHONE WITH COUNTRY FLAG SELECTOR */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="sample-modal-body">
            {/* FULL NAME */}
            <div className="field">
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
            <div className="field">
              <label>COMPANY / ARCHITECTURAL FIRM (OPTIONAL)</label>
              <input
                type="text"
                placeholder="e.g. Studio Lotus / Oberoi Hotels"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {/* EMAIL */}
            <div className="field">
              <label>EMAIL ADDRESS *</label>
              <input
                type="email"
                placeholder="priya@studiolotus.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            {/* PHONE / WHATSAPP WITH COUNTRY FLAG SELECTOR */}
            <div className="field">
              <label>PHONE / WHATSAPP NUMBER *</label>
              <div className="sample-phone-group">
                <div className="sample-flag-selector">
                  <select
                    value={safeCountry.iso}
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
                    {safeCountry.flag} {safeCountry.code}
                  </span>
                </div>
                <input
                  type="tel"
                  maxLength={safeCountry.code === '+91' ? 10 : 12}
                  placeholder={safeCountry.code === '+91' ? '98765 43210 (10 digits)' : 'Phone number'}
                  value={phone}
                  onChange={(e) => {
                    const maxDigits = safeCountry.code === '+91' ? 10 : 12;
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
                    setPhone(digitsOnly);
                  }}
                />
              </div>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            {/* TRADE PORTAL ACCOUNT SETUP (REQUIRED) */}
            {user ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: '#166534', fontWeight: 500 }}>
                  ✓ Linked to Trade Account: <strong>{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username || user.email)}</strong>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active
                </span>
              </div>
            ) : (
              <div style={{ background: '#FAF9F5', border: '1px solid #ECE7DE', borderRadius: 6, padding: '12px 14px' }}>
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

            <div className="sample-modal-footer">
              <button type="button" className="btn btn-soft" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg">
                {isSubmitting ? 'Sending Request…' : `Submit ${reqType === 'sample' ? 'Sample' : 'CAD'} Request`}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION SCREEN */}
        {step === 3 && (
          <div className="sample-modal-body sample-success-screen">
            <div className="sample-success-icon">✓</div>
            <h3>Request Submitted Successfully!</h3>
            <p className="sample-ref">Reference ID: <strong>{refId}</strong></p>
            <p className="sample-desc">
              Thank you, <strong>{fullName}</strong>. Your {reqType === 'sample' ? 'physical finish samples' : 'downloadable CAD/3D block files'} for <strong>{productName}</strong> have been logged with our Udaipur project desk.
            </p>
            <div className="sample-summary-card">
              <div><span>Product:</span> <strong>{productName}</strong></div>
              <div><span>Type:</span> <strong>{reqType === 'sample' ? 'Finish Samples' : 'CAD 3D Block'}</strong></div>
              <div><span>Finish:</span> <strong>{finish}</strong></div>
              <div><span>Contact Phone:</span> <strong>{safeCountry.code} {phone}</strong></div>
            </div>
            <button type="button" className="btn btn-primary btn-lg" onClick={onClose} style={{ marginTop: 20 }}>
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
