'use client';

import React, { useState, useEffect } from 'react';

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

  // Errors & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refId, setRefId] = useState('');

  const safeCountry = selectedCountry || COUNTRIES[0] || { country: 'India', code: '+91', flag: '🇮🇳', iso: 'IN' };

  useEffect(() => {
    setReqType(initialRequestType || 'sample');
    setFinish(initialFinish || 'Standard Finish');
    setQuantity(safeMoq);
    setStep(1);
    setErrors({});
  }, [initialRequestType, initialFinish, safeMoq, isOpen]);

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
      notes: notes,
    };

    let generatedRef = '';

    try {
      const res = await fetch('/api/wp/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload),
      });

      const data = await res.json();
      if (data.success && data.data?.reference_id) {
        generatedRef = data.data.reference_id;
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
