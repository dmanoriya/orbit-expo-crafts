'use client';

import React, { useMemo } from 'react';

export interface CountryCode {
  country: string;
  code: string;
  flag: string;
  iso: string;
  digits: number;
}

export const PHONE_COUNTRIES: CountryCode[] = [
  { country: 'India', code: '+91', flag: '🇮🇳', iso: 'IN', digits: 10 },
  { country: 'United Arab Emirates', code: '+971', flag: '🇦🇪', iso: 'AE', digits: 9 },
  { country: 'United States', code: '+1', flag: '🇺🇸', iso: 'US', digits: 10 },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧', iso: 'GB', digits: 10 },
  { country: 'Singapore', code: '+65', flag: '🇸🇬', iso: 'SG', digits: 8 },
  { country: 'Australia', code: '+61', flag: '🇦🇺', iso: 'AU', digits: 9 },
  { country: 'Canada', code: '+1', flag: '🇨🇦', iso: 'CA', digits: 10 },
  { country: 'Germany', code: '+49', flag: '🇩🇪', iso: 'DE', digits: 11 },
  { country: 'Saudi Arabia', code: '+966', flag: '🇸🇦', iso: 'SA', digits: 9 },
  { country: 'Qatar', code: '+974', flag: '🇶🇦', iso: 'QA', digits: 8 },
  { country: 'France', code: '+33', flag: '🇫🇷', iso: 'FR', digits: 9 },
  { country: 'Italy', code: '+39', flag: '🇮🇹', iso: 'IT', digits: 10 },
];

export interface PhoneInputFieldProps {
  value: string; // digits only
  countryCode?: string; // e.g. '+91'
  onChange: (phoneDigits: string, fullInternationalNumber: string, country: CountryCode) => void;
  onCountryChange?: (country: CountryCode) => void;
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

  const maxDigits = activeCountry.code === '+91' ? 10 : 15;

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = PHONE_COUNTRIES.find((c) => c.iso === e.target.value) || PHONE_COUNTRIES[0];
    if (onCountryChange) {
      onCountryChange(found);
    }
    // Re-trigger onChange with newly active country
    const cleanDigits = value.replace(/\D/g, '').slice(0, found.code === '+91' ? 10 : 15);
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

  const defaultPlaceholder = activeCountry.code === '+91'
    ? '98765 43210 (10 digits)'
    : 'Phone number (digits only)';

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
          placeholder={placeholder || defaultPlaceholder}
          value={value}
          onChange={handleInputChange}
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
