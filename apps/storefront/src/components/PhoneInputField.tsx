'use client';

import React, { useMemo } from 'react';

export interface CountryCode {
  country: string;
  code: string;
  flag: string;
  iso: string;
  digits: number;
  placeholder: string;
  hint?: string;
}

export const PHONE_COUNTRIES: CountryCode[] = [
  { country: 'India', code: '+91', flag: '🇮🇳', iso: 'IN', digits: 10, placeholder: '98765 43210', hint: '10-digit mobile number' },
  { country: 'United Arab Emirates', code: '+971', flag: '🇦🇪', iso: 'AE', digits: 9, placeholder: '50 123 4567', hint: '9-digit phone number' },
  { country: 'United States', code: '+1', flag: '🇺🇸', iso: 'US', digits: 10, placeholder: '(555) 012-3456', hint: '10-digit phone number' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧', iso: 'GB', digits: 10, placeholder: '7911 123456', hint: '10-digit phone number' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬', iso: 'SG', digits: 8, placeholder: '8123 4567', hint: '8-digit phone number' },
  { country: 'Australia', code: '+61', flag: '🇦🇺', iso: 'AU', digits: 9, placeholder: '412 345 678', hint: '9-digit mobile number' },
  { country: 'Canada', code: '+1', flag: '🇨🇦', iso: 'CA', digits: 10, placeholder: '(555) 012-3456', hint: '10-digit phone number' },
  { country: 'Germany', code: '+49', flag: '🇩🇪', iso: 'DE', digits: 11, placeholder: '151 23456789', hint: '10–11 digit phone number' },
  { country: 'Saudi Arabia', code: '+966', flag: '🇸🇦', iso: 'SA', digits: 9, placeholder: '50 123 4567', hint: '9-digit phone number' },
  { country: 'Qatar', code: '+974', flag: '🇶🇦', iso: 'QA', digits: 8, placeholder: '3312 3456', hint: '8-digit phone number' },
  { country: 'France', code: '+33', flag: '🇫🇷', iso: 'FR', digits: 9, placeholder: '6 12 34 56 78', hint: '9-digit phone number' },
  { country: 'Italy', code: '+39', flag: '🇮🇹', iso: 'IT', digits: 10, placeholder: '312 345 6789', hint: '10-digit phone number' },
];

export function getPhonePlaceholder(country: CountryCode): string {
  return country.placeholder || `${country.digits}-digit number`;
}

export function getMaxDigits(country: CountryCode): number {
  if (country.iso === 'DE') return 12;
  if (country.iso === 'GB') return 11;
  return country.digits || 15;
}

export function validatePhoneNumber(phoneDigits: string, country: CountryCode, required = true): string | null {
  const clean = (phoneDigits || '').replace(/\D/g, '');
  if (!clean) {
    return required ? 'Phone / WhatsApp number is required.' : null;
  }

  if (country.iso === 'IN') {
    if (clean.length !== 10) {
      return 'Please enter a valid 10-digit Indian mobile number.';
    }
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    }
    return null;
  }

  if (country.iso === 'US' || country.iso === 'CA') {
    if (clean.length !== 10) {
      return `Please enter a valid 10-digit ${country.country} phone number.`;
    }
    return null;
  }

  if (country.iso === 'AE') {
    if (clean.length !== 9) {
      return 'Please enter a valid 9-digit UAE phone number.';
    }
    return null;
  }

  if (country.iso === 'GB') {
    if (clean.length < 10 || clean.length > 11) {
      return 'Please enter a valid 10-digit UK phone number.';
    }
    return null;
  }

  if (country.iso === 'SG' || country.iso === 'QA') {
    if (clean.length !== 8) {
      return `Please enter a valid 8-digit ${country.country} phone number.`;
    }
    return null;
  }

  if (country.iso === 'AU') {
    if (clean.length !== 9) {
      return 'Please enter a valid 9-digit Australian mobile number.';
    }
    return null;
  }

  if (country.iso === 'DE') {
    if (clean.length < 10 || clean.length > 12) {
      return 'Please enter a valid German phone number (10 to 11 digits).';
    }
    return null;
  }

  if (country.iso === 'FR') {
    if (clean.length !== 9) {
      return 'Please enter a valid 9-digit French phone number.';
    }
    return null;
  }

  if (country.iso === 'IT') {
    if (clean.length !== 10) {
      return 'Please enter a valid 10-digit Italian phone number.';
    }
    return null;
  }

  if (country.iso === 'SA') {
    if (clean.length !== 9) {
      return 'Please enter a valid 9-digit Saudi phone number.';
    }
    return null;
  }

  if (clean.length < 7 || clean.length > 15) {
    return `Please enter a valid ${country.country} phone number (7 to 15 digits).`;
  }

  return null;
}

export interface PhoneInputFieldProps {
  value: string; // digits only
  countryCode?: string; // e.g. '+91'
  onChange: (phoneDigits: string, fullInternationalNumber: string, country: CountryCode) => void;
  onCountryChange?: (country: CountryCode) => void;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  className?: string;
  inputStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value,
  countryCode = '+91',
  onChange,
  onCountryChange,
  onBlur,
  label,
  required = false,
  disabled = false,
  placeholder,
  error,
  id,
  name = 'phone',
  autoComplete = 'tel-national',
  className = '',
  inputStyle,
  wrapperStyle,
}) => {
  const activeCountry = useMemo(() => {
    return PHONE_COUNTRIES.find((c) => c.code === countryCode || c.iso === countryCode) || PHONE_COUNTRIES[0];
  }, [countryCode]);

  const maxDigits = getMaxDigits(activeCountry);

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = PHONE_COUNTRIES.find((c) => c.iso === e.target.value) || PHONE_COUNTRIES[0];
    if (onCountryChange) {
      onCountryChange(found);
    }
    // Re-trigger onChange with newly active country and trim to new max
    const newMax = getMaxDigits(found);
    const cleanDigits = value.replace(/\D/g, '').slice(0, newMax);
    const fullNumber = cleanDigits ? `${found.code} ${cleanDigits}` : '';
    onChange(cleanDigits, fullNumber, found);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip all non-numeric characters strictly
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, maxDigits);
    const fullNumber = digitsOnly ? `${activeCountry.code} ${digitsOnly}` : '';
    onChange(digitsOnly, fullNumber, activeCountry);
  };

  const dynamicPlaceholder = placeholder || activeCountry.placeholder || getPhonePlaceholder(activeCountry);

  return (
    <div className={`phone-input-field ${className}`} style={{ width: '100%', ...wrapperStyle }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: 6,
            color: '#333333',
            letterSpacing: '0.02em',
          }}
        >
          {label} {required && <span style={{ color: '#D9534F' }}>*</span>}
        </label>
      )}

      <div className="sample-phone-group" style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        {/* COUNTRY FLAG + CODE SELECTOR */}
        <div
          className="sample-flag-selector"
          style={{
            position: 'relative',
            flex: 'none',
            width: 125,
            minHeight: 44,
          }}
        >
          <select
            value={activeCountry.iso}
            onChange={handleCountrySelect}
            disabled={disabled}
            aria-label="Select Country Phone Code"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              width: '100%',
              height: '100%',
              zIndex: 2,
            }}
          >
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.flag} {c.code} ({c.country})
              </option>
            ))}
          </select>
          <div
            className="flag-display"
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: '#F8F6F0',
              border: `1px solid ${error ? '#D9534F' : '#CCC'}`,
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
              color: '#111111',
              pointerEvents: 'none',
              padding: '0 8px',
            }}
          >
            <span style={{ fontSize: 16 }}>{activeCountry.flag}</span>
            <span>{activeCountry.code}</span>
            <span style={{ fontSize: 10, color: '#666', marginLeft: 2 }}>▼</span>
          </div>
        </div>

        {/* NUMERIC PHONE INPUT */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={maxDigits}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          placeholder={dynamicPlaceholder}
          value={value}
          onChange={handleInputChange}
          onBlur={onBlur}
          style={{
            flex: 1,
            width: '100%',
            padding: '10px 14px',
            borderRadius: 6,
            border: `1px solid ${error ? '#D9534F' : '#CCC'}`,
            fontSize: 14,
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
            ...inputStyle,
          }}
        />
      </div>

      {error && (
        <span
          className="field-error"
          role="alert"
          style={{
            fontSize: 11.5,
            color: '#D9534F',
            fontWeight: 600,
            marginTop: 4,
            display: 'block',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default PhoneInputField;
