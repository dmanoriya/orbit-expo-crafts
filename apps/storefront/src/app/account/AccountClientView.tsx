'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useEnquiry } from '../../context/EnquiryContext';
import { BookingRecord, BookingMessage } from '../../types/booking';
import { getStoredBookings, saveBooking, appendMessageToBooking, generateDefaultMilestones } from '../../lib/bookingStore';
import PhoneInputField, { CountryCode, PHONE_COUNTRIES } from '../../components/PhoneInputField';

interface AccountClientViewProps {
  initialTab?: 'overview' | 'favorites' | 'orders' | 'profile';
}

function getCurrencySymbol(cur?: string): string {
  const c = (cur || 'INR').toUpperCase();
  if (c === 'INR') return '₹';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  if (c === 'AED') return 'AED ';
  if (c === 'USD') return '$';
  return '₹';
}

function parsePhone(rawPhone?: string): { country: CountryCode; digits: string } {
  if (!rawPhone) return { country: PHONE_COUNTRIES[0], digits: '' };
  const matched = PHONE_COUNTRIES.find((c) => rawPhone.startsWith(c.code));
  if (matched) {
    return { country: matched, digits: rawPhone.replace(matched.code, '').replace(/\D/g, '') };
  }
  return { country: PHONE_COUNTRIES[0], digits: rawPhone.replace(/\D/g, '').slice(0, 10) };
}

export const AccountClientView: React.FC<AccountClientViewProps> = ({ initialTab = 'overview' }) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, register, logout, updateProfile } = useAuth();
  const { favorites, removeFavorite, clearFavorites, moveAllToEnquiry } = useFavorites();
  const { addEnquiry } = useEnquiry();

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhoneDigits, setRegPhoneDigits] = useState('');
  const [regPhoneCountry, setRegPhoneCountry] = useState<CountryCode>(PHONE_COUNTRIES[0]);
  const [regPassword, setRegPassword] = useState('');
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({});

  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'orders' | 'profile'>(initialTab);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [addedFavId, setAddedFavId] = useState<string | null>(null);

  // Bookings & Transactions State
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'timeline' | 'items' | 'invoice' | 'conversation'>('timeline');
  const [newQueryMessage, setNewQueryMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Profile Form State
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhoneDigits, setProfilePhoneDigits] = useState('');
  const [profilePhoneCountry, setProfilePhoneCountry] = useState<CountryCode>(PHONE_COUNTRIES[0]);
  const [profileCompany, setProfileCompany] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});

  // Tab Switcher with URL synchronization and browser history support
  const handleTabChange = (tab: 'overview' | 'favorites' | 'orders' | 'profile', bookingId?: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/favorites' && tab !== 'favorites') {
        const target = `/account?tab=${tab}${bookingId ? '&bookingId=' + bookingId : ''}`;
        router.push(target);
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      if (bookingId) {
        url.searchParams.set('bookingId', bookingId);
      } else {
        url.searchParams.delete('bookingId');
      }
      window.history.pushState(null, '', url.pathname + url.search);
    }
  };

  // Handle URL query parameter ?tab=... or ?mode=... or ?bookingId=... & popstate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const readUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'favorites' || tabParam === 'orders' || tabParam === 'profile' || tabParam === 'overview') {
        setActiveTab(tabParam);
      } else {
        setActiveTab(initialTab);
      }
      const modeParam = params.get('mode');
      if (modeParam === 'register') {
        setAuthMode('register');
      }
      const bookingParam = params.get('bookingId');
      if (bookingParam) {
        const all = getStoredBookings();
        const match = all.find((b) => b.id === bookingParam || b.invoice?.invoiceNumber === bookingParam);
        if (match) {
          setSelectedBooking(match);
          setActiveTab('orders');
        }
      }
    };

    readUrlState();
    window.addEventListener('popstate', readUrlState);
    return () => window.removeEventListener('popstate', readUrlState);
  }, [initialTab]);

  // Sync profile form when user logs in with deep fallback & auto-healing
  useEffect(() => {
    if (user) {
      let fName = user.firstName || '';
      let lName = user.lastName || '';
      let phone = user.phone || '';
      let comp = user.company || '';

      // Check fallback cached in localStorage if any field is missing
      if (!fName || !lName || !comp || !phone) {
        try {
          const cachedProfileStr = localStorage.getItem('orbit_last_submitted_profile');
          if (cachedProfileStr) {
            const cached = JSON.parse(cachedProfileStr);
            if (!fName && cached.firstName) fName = cached.firstName;
            if (!lName && cached.lastName) lName = cached.lastName;
            if (!comp && cached.company) comp = cached.company;
            if (!phone && cached.phone) phone = cached.phone;
          }
        } catch (e) {}

        if (!fName || !lName || !comp || !phone) {
          const allBookings = getStoredBookings(user.email);
          const withClient = allBookings.find((b) => b.clientName || b.phone || b.companyName);
          if (withClient) {
            if (!fName && withClient.clientName) {
              const parts = withClient.clientName.trim().split(/\s+/);
              fName = parts[0] || '';
              if (!lName && parts.length > 1) lName = parts.slice(1).join(' ');
            }
            if (!comp && withClient.companyName) comp = withClient.companyName;
            if (!phone && withClient.phone) phone = withClient.phone;
          }
        }

        // Auto-heal user profile across auth context and backend if missing data was discovered
        const hasNewFName = fName && !user.firstName;
        const hasNewLName = lName && !user.lastName;
        const hasNewComp = comp && !user.company;
        const hasNewPhone = phone && !user.phone;
        if (hasNewFName || hasNewLName || hasNewComp || hasNewPhone) {
          updateProfile({
            firstName: fName || user.firstName,
            lastName: lName || user.lastName,
            company: comp || user.company,
            phone: phone || user.phone,
          });
        }
      }

      setProfileFirstName(fName);
      setProfileLastName(lName);
      const parsedP = parsePhone(phone);
      setProfilePhoneCountry(parsedP.country);
      setProfilePhoneDigits(parsedP.digits);
      setProfileCompany(comp);
    }
  }, [user]);

  // Refresh bookings on mount & when user changes, plus fetch live updates from WordPress with zero delay
  const refreshBookings = async () => {
    // 1. Instantly populate from local storage so the page is immediately responsive
    const localList = getStoredBookings();
    if (localList.length > 0) {
      setBookings((prev) => (prev.length === 0 ? localList : prev));
      setSelectedBooking((prev) => prev || localList[0]);
    }

    // 2. Fetch live updates from WordPress backend
    setIsSyncing(true);
    try {
      const params = new URLSearchParams();
      if (user?.email) {
        params.set('email', user.email);
      }
      if (localList.length > 0) {
        const ids = localList.map((b) => b.id).filter(Boolean).join(',');
        if (ids) params.set('ids', ids);
      }
      const qs = params.toString();
      const res = await fetch(`/api/wp/customers/bookings${qs ? `?${qs}` : ''}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.bookings) && json.data.bookings.length > 0) {
        const serverBookings: BookingRecord[] = json.data.bookings;
        // Direct React state update - ZERO DELAY!
        setBookings(serverBookings);
        setSelectedBooking((prev) => {
          if (prev) {
            const matched = serverBookings.find((b) => b.id === prev.id);
            if (matched) return matched;
          }
          return serverBookings[0];
        });

        // Silently update localStorage cache without triggering secondary POST fetches
        try {
          localStorage.setItem('orbit_customer_bookings', JSON.stringify(serverBookings));
        } catch (e) {}
      }
    } catch (e) {
      // Offline or network glitch, local state is retained
    } finally {
      setIsSyncing(false);
    }
  };

  // Multi-trigger zero-delay synchronization:
  useEffect(() => {
    refreshBookings();

    // 1. Instant sync when browser tab or window gains focus
    const handleFocus = () => {
      refreshBookings();
    };

    // 2. Instant sync when page becomes visible
    const handleVisibility = () => {
      if (!document.hidden) {
        refreshBookings();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Active 3-second heartbeat polling when on the Orders tab
    let interval: NodeJS.Timeout | null = null;
    if (activeTab === 'orders') {
      interval = setInterval(() => {
        refreshBookings();
      }, 3000);
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (interval) clearInterval(interval);
    };
  }, [user, activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newQueryMessage.trim()) return;

    setIsSendingMessage(true);
    const clientNameStr = user?.firstName
      ? `${user.firstName} (Client)`
      : (selectedBooking.clientName ? `${selectedBooking.clientName} (Client)` : 'You (Client)');
    const textToSend = newQueryMessage.trim();
    const updated = appendMessageToBooking(selectedBooking.id, textToSend, 'client', clientNameStr);
    
    setNewQueryMessage('');
    setIsSendingMessage(false);
    
    if (updated) {
      setSelectedBooking({ ...updated });
      refreshBookings();

      // Open WhatsApp directly with pre-filled order context & client query
      const orderRef = selectedBooking.id || 'Commercial Order';
      const companyStr = selectedBooking.companyName || user?.company || '';
      const clientStr = selectedBooking.clientName || user?.firstName || 'Client';
      const projectStr = selectedBooking.projectName || '';

      const lines = [
        `*Commercial Order Query: ${orderRef}*`,
        ``,
        `*Client:* ${clientStr}${companyStr ? ` (${companyStr})` : ''}`,
        `*Order Ref:* ${orderRef}`,
        ...(projectStr ? [`*Project:* ${projectStr}`] : []),
        `*Query:* ${textToSend}`,
        ``,
        `_Sent from Orbit Expo Crafts Customer Portal_`
      ];

      const waUrl = `https://wa.me/919928022151?text=${encodeURIComponent(lines.join('\n'))}`;

      try {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.error('Failed to open WhatsApp window:', err);
      }

      // Desk response acknowledgment in portal thread
      setTimeout(() => {
        const deskReply = appendMessageToBooking(
          selectedBooking.id,
          `Namaste! Your query regarding "${textToSend.slice(0, 36)}${textToSend.length > 36 ? '...' : ''}" has been opened directly on WhatsApp (+91 99280 22151) and logged with Senior Technical Specifier Rajeev Sharma. We are active on WhatsApp to assist you directly.`,
          'concierge',
          'Orbit Technical Desk'
        );
        if (deskReply) {
          setSelectedBooking({ ...deskReply });
          refreshBookings();
        }
      }, 700);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const res = await login(loginIdentifier, loginPassword);
    setAuthLoading(false);
    if (!res.success) {
      setAuthError(res.error || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    const cleanFName = regFirstName.trim();
    if (!cleanFName || cleanFName.length < 2) {
      errors.firstName = 'First name is required (min 2 letters).';
    } else if (/^\d+$/.test(cleanFName)) {
      errors.firstName = 'Name cannot contain only numbers.';
    }

    const cleanLName = regLastName.trim();
    if (!cleanLName || cleanLName.length < 2) {
      errors.lastName = 'Last name is required (min 2 letters).';
    } else if (/^\d+$/.test(cleanLName)) {
      errors.lastName = 'Name cannot contain only numbers.';
    }

    const cleanEmail = regEmail.trim();
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail) {
      errors.email = 'Work email is required.';
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Please enter a valid work email address.';
    }

    if (regPhoneDigits) {
      if (regPhoneCountry.code === '+91') {
        if (regPhoneDigits.length !== 10) {
          errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
        } else if (!/^[6-9]\d{9}$/.test(regPhoneDigits)) {
          errors.phone = 'Indian mobile numbers must start with 6, 7, 8, or 9.';
        }
      } else if (regPhoneDigits.length < 7 || regPhoneDigits.length > 15) {
        errors.phone = 'Please enter a valid phone number (7 to 15 digits).';
      }
    }

    if (!regPassword || regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setRegFieldErrors(errors);
      return;
    }
    setRegFieldErrors({});
    setAuthError(null);
    setAuthLoading(true);

    const fullRegPhone = regPhoneDigits ? `${regPhoneCountry.code} ${regPhoneDigits}` : '';
    const res = await register({
      firstName: cleanFName,
      lastName: cleanLName,
      company: regCompany.trim(),
      email: cleanEmail,
      phone: fullRegPhone,
      password: regPassword,
    });
    setAuthLoading(false);
    if (!res.success) {
      setAuthError(res.error || 'Registration failed. Please try again.');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    const cleanFName = profileFirstName.trim();
    if (!cleanFName || cleanFName.length < 2) {
      errors.firstName = 'First name is required (min 2 letters).';
    } else if (/^\d+$/.test(cleanFName)) {
      errors.firstName = 'Name cannot contain only numbers.';
    }

    if (profilePhoneDigits) {
      if (profilePhoneCountry.code === '+91') {
        if (profilePhoneDigits.length !== 10) {
          errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
        } else if (!/^[6-9]\d{9}$/.test(profilePhoneDigits)) {
          errors.phone = 'Indian mobile numbers must start with 6, 7, 8, or 9.';
        }
      } else if (profilePhoneDigits.length < 7 || profilePhoneDigits.length > 15) {
        errors.phone = 'Please enter a valid phone number (7 to 15 digits).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors);
      return;
    }
    setProfileFieldErrors({});

    const fullProfilePhone = profilePhoneDigits ? `${profilePhoneCountry.code} ${profilePhoneDigits}` : '';
    await updateProfile({
      firstName: cleanFName,
      lastName: profileLastName.trim(),
      phone: fullProfilePhone,
      company: profileCompany.trim(),
    });
    try {
      localStorage.setItem(
        'orbit_last_submitted_profile',
        JSON.stringify({
          fullName: `${cleanFName} ${profileLastName}`.trim(),
          firstName: cleanFName,
          lastName: profileLastName.trim(),
          company: profileCompany.trim(),
          phone: fullProfilePhone,
          email: user?.email || '',
        })
      );
    } catch (e) {}
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleSingleAddEnquiry = (item: any) => {
    addEnquiry({
      id: item.id,
      name: item.name,
      catName: item.catName,
      q: item.moq || 1,
      image: item.image,
      moq: item.moq,
    });
    setAddedFavId(item.id);
    setTimeout(() => setAddedFavId(null), 1800);
  };

  // =========================================================================
  // VIEW 1: UNAUTHENTICATED LOGIN / REGISTER PORTAL
  // =========================================================================
  if (!isAuthenticated || !user) {
    return (
      <div key="unauthenticated-portal" style={{ backgroundColor: '#FAF9F5', minHeight: '85vh', padding: '48px 16px 80px' }}>
        <div className="wrap" style={{ maxWidth: 520, margin: '0 auto' }}>
          {/* LOGO & TITLE */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--brand)', display: 'block', marginBottom: 8, fontWeight: 600 }}>
              TRADE & CLIENT PORTAL
            </span>
            <h1 className="disp" style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', fontWeight: 400, color: '#111111', margin: 0 }}>
              {authMode === 'login' ? 'Welcome Back' : 'Create Trade Account'}
            </h1>
            <p style={{ fontSize: 14.5, color: '#666666', marginTop: 8 }}>
              {authMode === 'login'
                ? 'Sign in to access saved favorites, contract RFQs, and trade pricing.'
                : 'Register for direct factory pricing, specification sheets, and sampling.'}
            </p>
          </div>

          {/* TAB SWITCHER */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#EAE6DD', borderRadius: 8, padding: 4, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              style={{
                padding: '10px 0',
                borderRadius: 6,
                border: 'none',
                background: authMode === 'login' ? '#FFFFFF' : 'transparent',
                color: authMode === 'login' ? '#111111' : '#666666',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              style={{
                padding: '10px 0',
                borderRadius: 6,
                border: 'none',
                background: authMode === 'register' ? '#FFFFFF' : 'transparent',
                color: authMode === 'register' ? '#111111' : '#666666',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Register
            </button>
          </div>

          {/* CARD CONTAINER */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '32px 28px', boxShadow: 'var(--shadow-md)' }}>
            {authError && (
              <div style={{ padding: '12px 14px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 6, color: '#C62828', fontSize: 13.5, marginBottom: 20 }}>
                ⚠️ {authError}
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6, color: '#333333' }}>
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your email or username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#333333' }}>
                      Password
                    </label>
                    <a href="mailto:trade@orbitexpocrafts.com?subject=Password%20Reset%20Request" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none' }}>
                      Forgot Password?
                    </a>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    background: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '13px 20px',
                    fontSize: 14.5,
                    fontWeight: 600,
                    cursor: authLoading ? 'not-allowed' : 'pointer',
                    marginTop: 6,
                    transition: 'background 0.2s ease',
                  }}
                >
                  {authLoading ? 'Signing in...' : 'Sign In to Account →'}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David"
                      value={regFirstName}
                      onChange={(e) => {
                        setRegFirstName(e.target.value);
                        if (regFieldErrors.firstName) setRegFieldErrors((prev) => ({ ...prev, firstName: '' }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 6,
                        border: regFieldErrors.firstName ? '1px solid #DC2626' : '1px solid #CCC',
                        fontSize: 13.5,
                      }}
                    />
                    {regFieldErrors.firstName && (
                      <span style={{ display: 'block', color: '#DC2626', fontSize: 11.5, marginTop: 4 }}>
                        {regFieldErrors.firstName}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Miller"
                      value={regLastName}
                      onChange={(e) => {
                        setRegLastName(e.target.value);
                        if (regFieldErrors.lastName) setRegFieldErrors((prev) => ({ ...prev, lastName: '' }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 6,
                        border: regFieldErrors.lastName ? '1px solid #DC2626' : '1px solid #CCC',
                        fontSize: 13.5,
                      }}
                    />
                    {regFieldErrors.lastName && (
                      <span style={{ display: 'block', color: '#DC2626', fontSize: 11.5, marginTop: 4 }}>
                        {regFieldErrors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                    Company / Studio / Firm
                  </label>
                  <input
                    type="text"
                    placeholder="Miller Interior Architecture"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CCC', fontSize: 13.5 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your work email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regFieldErrors.email) setRegFieldErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 6,
                        border: regFieldErrors.email ? '1px solid #DC2626' : '1px solid #CCC',
                        fontSize: 13.5,
                      }}
                    />
                    {regFieldErrors.email && (
                      <span style={{ display: 'block', color: '#DC2626', fontSize: 11.5, marginTop: 4 }}>
                        {regFieldErrors.email}
                      </span>
                    )}
                  </div>
                  <div>
                    <PhoneInputField
                      label="Phone / WhatsApp"
                      value={regPhoneDigits}
                      countryCode={regPhoneCountry.code}
                      onChange={(digits, _fullNumber, countryObj) => {
                        setRegPhoneDigits(digits);
                        setRegPhoneCountry(countryObj);
                        if (regFieldErrors.phone) setRegFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      onCountryChange={setRegPhoneCountry}
                      error={regFieldErrors.phone}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                    Create Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regFieldErrors.password) setRegFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: regFieldErrors.password ? '1px solid #DC2626' : '1px solid #CCC',
                      fontSize: 13.5,
                    }}
                  />
                  {regFieldErrors.password && (
                    <span style={{ display: 'block', color: '#DC2626', fontSize: 11.5, marginTop: 4 }}>
                      {regFieldErrors.password}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    background: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '13px 20px',
                    fontSize: 14.5,
                    fontWeight: 600,
                    cursor: authLoading ? 'not-allowed' : 'pointer',
                    marginTop: 6,
                  }}
                >
                  {authLoading ? 'Creating account...' : 'Create Account →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED CUSTOMER DASHBOARD
  // =========================================================================
  return (
    <div key="authenticated-dashboard" style={{ backgroundColor: '#FFFFFF', minHeight: '90vh', padding: '36px 0 80px' }}>
      <div className="wrap">
        {/* DASHBOARD TOP BANNER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, borderBottom: '1px solid var(--line)', paddingBottom: 28, marginBottom: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 className="disp" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 400, color: '#111111', margin: 0 }}>
                Welcome, {profileFirstName || user.firstName || user.username}
              </h1>
              <span
                style={{
                  background: '#EFEBE4',
                  color: '#4A4640',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {user.role || 'Verified Trade Client'}
              </span>
            </div>
            <p style={{ fontSize: 14.5, color: '#666666', margin: 0 }}>
              {(profileCompany || user.company) ? `${profileCompany || user.company} • ` : ''}{user.email}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/collections"
              style={{
                padding: '9px 18px',
                borderRadius: 6,
                border: '1px solid var(--line)',
                background: '#FFFFFF',
                color: '#111111',
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Browse Catalog
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              style={{
                padding: '9px 18px',
                borderRadius: 6,
                border: '1px solid #CCC',
                background: '#F9F8F5',
                color: '#C62828',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* DASHBOARD NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--line)', marginBottom: 32, overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeTab === 'overview' ? '2.5px solid #111111' : '2.5px solid transparent',
              color: activeTab === 'overview' ? '#111111' : '#666666',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              fontSize: 14.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('favorites')}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeTab === 'favorites' ? '2.5px solid #111111' : '2.5px solid transparent',
              color: activeTab === 'favorites' ? '#111111' : '#666666',
              fontWeight: activeTab === 'favorites' ? 700 : 500,
              fontSize: 14.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
            }}
          >
            <span>Favourites</span>
            <span
              style={{
                background: activeTab === 'favorites' ? '#B85735' : '#ECE7DE',
                color: activeTab === 'favorites' ? '#FFFFFF' : '#444444',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
              }}
            >
              {favorites.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('orders')}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeTab === 'orders' ? '2.5px solid #111111' : '2.5px solid transparent',
              color: activeTab === 'orders' ? '#111111' : '#666666',
              fontWeight: activeTab === 'orders' ? 700 : 500,
              fontSize: 14.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
            }}
          >
            <span>Bookings, Proposals & Orders</span>
            {bookings.length > 0 && (
              <span
                style={{
                  background: activeTab === 'orders' ? '#111111' : '#ECE7DE',
                  color: activeTab === 'orders' ? '#FFFFFF' : '#444444',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 999,
                }}
              >
                {bookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: activeTab === 'profile' ? '2.5px solid #111111' : '2.5px solid transparent',
              color: activeTab === 'profile' ? '#111111' : '#666666',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              fontSize: 14.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Company & Trade Profile
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* STATS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
              <div style={{ padding: '24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                  SAVED SPECIFICATIONS
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#111111', marginBottom: 4 }}>
                  {favorites.length}
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('favorites')}
                  style={{ background: 'none', border: 'none', color: 'var(--brand)', padding: 0, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  View Favourites →
                </button>
              </div>

              <div style={{ padding: '24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                  ACTIVE BOOKINGS & ORDERS
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#111111', marginBottom: 4 }}>
                  {bookings.length}
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('orders')}
                  style={{ background: 'none', border: 'none', color: 'var(--brand)', padding: 0, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  View Bookings →
                </button>
              </div>

              <div style={{ padding: '24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                  TRADE PRICING TIER
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2E7D32', marginBottom: 4 }}>
                  Tier 1 Active
                </div>
                <div style={{ fontSize: 13, color: '#666666' }}>
                  Direct factory wholesale rates applied
                </div>
              </div>

              <div style={{ padding: '24px', background: '#111111', color: '#FFFFFF', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8, fontWeight: 600 }}>
                  YOUR DEDICATED CONCIERGE
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                  Rajeev Sharma
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                  Senior Technical Specifier (Rajasthan HQ)
                </div>
                <a
                  href="https://wa.me/919928022151"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#25D366', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                >
                  💬 WhatsApp Direct →
                </a>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div style={{ padding: 28, background: '#F4F2EB', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Need custom dimension modifications?</h3>
                <p style={{ fontSize: 14, color: '#555555', margin: '4px 0 0' }}>
                  Upload your project elevation drawings, room matrices, or BOQ lists for CAD review.
                </p>
              </div>
              <Link
                href="/discuss-projects"
                style={{
                  background: '#111111',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: 600,
                }}
              >
                Discuss Projects →
              </Link>
            </div>

            {/* RECENT COMMERCIAL BOOKINGS SUMMARY */}
            {bookings.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Active Commercial Bookings & Consignments</h3>
                    <p style={{ fontSize: 13.5, color: '#666666', margin: '2px 0 0' }}>
                      Real-time factory milestones, container logistics, and official proforma invoices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('orders')}
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All ({bookings.length}) →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bookings.slice(0, 3).map((bk) => (
                    <div
                      key={bk.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                        padding: '18px 22px',
                        background: '#FAF9F5',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--r-md)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{bk.id}</span>
                          <span style={{
                            background: bk.status === 'Dispatched' ? '#E8F5E9' : '#FFF3E0',
                            color: bk.status === 'Dispatched' ? '#2E7D32' : '#B45309',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                            {bk.status}
                          </span>
                          <span style={{ fontSize: 12, color: '#666666' }}>
                            PI #{bk.invoice?.invoiceNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: 13.5, color: '#444444', marginTop: 4 }}>
                          Project: <strong>{bk.projectName}</strong> &bull; {bk.totalPieces} pcs ({bk.estimatedCbm} CBM) &bull; {bk.shippingAddress.city}, {bk.shippingAddress.country}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(bk);
                            setInspectorTab('timeline');
                            handleTabChange('orders', bk.id);
                          }}
                          style={{
                            background: '#111111',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 4,
                            padding: '8px 14px',
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Milestones & Logistics →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(bk);
                            setInspectorTab('conversation');
                            handleTabChange('orders', bk.id);
                          }}
                          style={{
                            background: '#FFFFFF',
                            color: '#111111',
                            border: '1px solid #CCCCCC',
                            borderRadius: 4,
                            padding: '8px 12px',
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Open query thread"
                        >
                          💬 ({bk.messages?.length || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FAVORITES & SAVED SPECIFICATIONS */}
        {activeTab === 'favorites' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
                  Saved Favorites & Specification Sheets
                </h2>
                <p style={{ fontSize: 14, color: '#666666', marginTop: 4 }}>
                  {favorites.length} pieces saved for your upcoming projects.
                </p>
              </div>

              {favorites.length > 0 && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={moveAllToEnquiry}
                    style={{
                      background: '#111111',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 20px',
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Move All to Enquiry Bag
                  </button>
                  <button
                    type="button"
                    onClick={clearFavorites}
                    style={{
                      background: '#FFFFFF',
                      color: '#666666',
                      border: '1px solid #CCC',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 20px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>♥</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No Favourites Saved Yet</h3>
                <p style={{ fontSize: 14.5, color: '#666666', maxWidth: '45ch', margin: '0 auto 24px' }}>
                  Click the heart icon on any product across our catalog or bestsellers page to save it to your project specification board.
                </p>
                <Link
                  href="/best-sellers"
                  style={{
                    display: 'inline-block',
                    background: '#111111',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Explore Bestsellers →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '28px 20px' }}>
                {favorites.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r-md)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    <Link href={`/product/${item.slug || item.id}`} style={{ display: 'block', aspectRatio: '4/3', background: '#F4F2EB', overflow: 'hidden' }}>
                      <img
                        src={item.image || '/categories/tables.jpg'}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/categories/tables.jpg';
                        }}
                      />
                    </Link>

                    {/* REMOVE BUTTON */}
                    <button
                      type="button"
                      onClick={() => removeFavorite(item.id)}
                      title="Remove from Favourites"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#B85735',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      }}
                    >
                      ✕
                    </button>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-3)', letterSpacing: '0.08em', marginBottom: 4 }}>
                        {item.catName || item.type || 'Furniture'}
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }}>
                        <Link href={`/product/${item.slug || item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {item.name}
                        </Link>
                      </h4>
                      <div style={{ fontSize: 13, color: '#666666', marginBottom: 16 }}>
                        {item.material} {item.finish ? `• ${item.finish}` : ''}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 12, borderTop: '1px solid #F0ECE4' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand)' }}>
                          MOQ: {item.moq || 1} pcs
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSingleAddEnquiry(item)}
                          style={{
                            background: addedFavId === item.id ? '#2E7D32' : '#111111',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 4,
                            padding: '7px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                          }}
                        >
                          {addedFavId === item.id ? '✓ Added' : '+ Add to Enquiry'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMERCIAL ORDERS & CONSIGNMENTS */}
        {activeTab === 'orders' && (
          <div>
            {selectedBooking ? (
              <div>
                {/* INSPECTOR TOP NAV & HEADER */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(null)}
                      style={{
                        background: '#FAF9F5',
                        border: '1px solid var(--line)',
                        borderRadius: 6,
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      ← Back to All Orders
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-serif)' }}>
                          {selectedBooking.id}
                        </h2>
                        <span style={{
                          background: selectedBooking.status === 'Dispatched' ? '#E8F5E9' : '#FFF3E0',
                          color: selectedBooking.status === 'Dispatched' ? '#2E7D32' : '#B45309',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                          {selectedBooking.status}
                        </span>
                        <span style={{
                          background: '#F0ECE4',
                          color: 'var(--ink-2)',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          PI #{selectedBooking.invoice?.invoiceNumber || 'Pending'}
                        </span>
                      </div>
                      <p style={{ fontSize: 13.5, color: '#666666', margin: '4px 0 0' }}>
                        Project: <strong>{selectedBooking.projectName}</strong> &bull; Booked on {selectedBooking.createdAt}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectorTab('invoice');
                        setTimeout(() => window.print(), 250);
                      }}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CCCCCC',
                        borderRadius: 6,
                        padding: '9px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      🖨️ Print Proforma Invoice
                    </button>
                    <a
                      href={`https://wa.me/919928022151?text=Hello%2C%20I%20have%20an%20inquiry%20regarding%20Booking%20${selectedBooking.id}%20(${selectedBooking.projectName})`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#25D366',
                        color: '#FFFFFF',
                        borderRadius: 6,
                        padding: '9px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      💬 WhatsApp Specifier
                    </a>
                  </div>
                </div>

                {/* INSPECTOR SUB-TABS */}
                <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #ECE7DE', marginBottom: 28, overflowX: 'auto' }}>
                  {[
                    { key: 'timeline', label: '🚚 Milestone Tracking & Logistics' },
                    { key: 'items', label: '📦 Itemized Bill of Materials' },
                    { key: 'invoice', label: '📄 Commercial Proforma Invoice' },
                    { key: 'conversation', label: `💬 Conversation & Queries (${selectedBooking.messages?.length || 0})` },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setInspectorTab(t.key as any)}
                      style={{
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: inspectorTab === t.key ? '3px solid #111111' : '3px solid transparent',
                        padding: '12px 18px',
                        fontSize: 14,
                        fontWeight: inspectorTab === t.key ? 700 : 500,
                        color: inspectorTab === t.key ? '#111111' : '#777777',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginBottom: -2,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* SUBTAB 1: TIMELINE & TRACKING */}
                {inspectorTab === 'timeline' && (
                  <div>
                    {/* CONTAINER & FREIGHT LOGISTICS CARD */}
                    <div style={{ background: '#111111', color: '#FFFFFF', borderRadius: 'var(--r-md)', padding: 24, marginBottom: 32 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 16, marginBottom: 20 }}>
                        <div>
                          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', fontWeight: 700, marginBottom: 4 }}>
                            OCEAN FREIGHT & CONSIGNMENT DISPATCH
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>
                            {selectedBooking.logistics?.carrier || 'Maersk Global Logistics'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                            CONTAINER / TRACKING #
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                            {selectedBooking.logistics?.trackingNumber || 'MSKU-820491-9'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Origin Port</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedBooking.logistics?.originPort || 'Mundra Port, Gujarat (INMUN1)'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Consignee Destination</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedBooking.shippingAddress?.city}, {selectedBooking.shippingAddress?.country}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Vessel / Fleet</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedBooking.logistics?.vesselName || 'MV Rajasthan Express (Voyage 2608)'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Target Delivery Window</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#81C784' }}>{selectedBooking.targetDeliveryDate || 'Within 60 working days'}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 6, fontSize: 13, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>📍</span>
                        <span>
                          <strong>Current Live Note:</strong> {selectedBooking.logistics?.currentMilestoneNote || 'Consolidated booking received in Rajasthan factory queue. Awaiting CAD review.'}
                        </span>
                      </div>
                    </div>

                    {/* 6-STAGE MILESTONES STEPPER */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                          Production & Export Milestone Progression
                        </h3>
                        <p style={{ fontSize: 13, color: '#666666', margin: '2px 0 0' }}>
                          Real-time factory floor & customs export lifecycle tracking.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => refreshBookings()}
                          disabled={isSyncing}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: isSyncing ? '#EAE6DF' : '#FAF9F5',
                            color: '#0E5C63',
                            border: '1.5px solid #0E5C63',
                            borderRadius: 20,
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: isSyncing ? 'not-allowed' : 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            transition: 'all 0.15s ease',
                          }}
                          title="Instant sync latest production milestone and freight status from factory floor"
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: 13,
                              transform: isSyncing ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.5s ease',
                            }}
                          >
                            ⟳
                          </span>
                          {isSyncing ? 'Syncing...' : 'Sync Live Status'}
                        </button>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#0E5C63',
                            background: '#E6F4EA',
                            border: '1px solid #A8DAB5',
                            padding: '6px 14px',
                            borderRadius: 20,
                            letterSpacing: '0.02em',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#2E7D32',
                            }}
                          />
                          Verified Factory Tracking
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {(selectedBooking.milestones || []).map((m, idx) => (
                        <div
                          key={m.key || idx}
                          style={{
                            display: 'flex',
                            gap: 16,
                            padding: '16px 20px',
                            background: m.active ? '#FFFDF8' : m.completed ? '#FAFAF7' : '#FFFFFF',
                            borderRadius: 'var(--r-md)',
                            border: m.active ? '1.5px solid #D97706' : m.completed ? '1px solid #C8E6C9' : '1px solid #EAE6DF',
                            boxShadow: m.active ? '0 2px 8px rgba(217,119,6,0.1)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: m.completed ? '#2E7D32' : m.active ? '#D97706' : '#E0E0E0',
                                color: '#FFFFFF',
                                display: 'grid',
                                placeItems: 'center',
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {m.completed ? '✓' : idx + 1}
                            </div>
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                              <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: m.completed ? '#1B5E20' : m.active ? '#B45309' : '#333333' }}>
                                {m.label}
                              </h4>
                              {m.date && (
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: m.active ? '#D97706' : '#777777' }}>
                                  {m.date}
                                </span>
                              )}
                            </div>
                            {m.note && (
                              <p style={{ fontSize: 13.5, color: '#666666', margin: 0 }}>
                                {m.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: ITEMIZED SPECIFICATIONS */}
                {inspectorTab === 'items' && (
                  <div>
                    {/* SUMMARY CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                      <div style={{ padding: 18, background: '#FAF9F5', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                        <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Total Line Items</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedBooking.items.length} SKUs</div>
                      </div>
                      <div style={{ padding: 18, background: '#FAF9F5', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                        <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Total Consignment Pieces</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedBooking.totalPieces} pcs</div>
                      </div>
                      <div style={{ padding: 18, background: '#FAF9F5', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                        <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Consolidated Volume</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedBooking.estimatedCbm} CBM</div>
                      </div>
                      <div style={{ padding: 18, background: '#FAF9F5', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                        <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Commercial Value (Ex-Factory)</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)' }}>
                          {getCurrencySymbol(selectedBooking.invoice?.currency)}{(selectedBooking.invoice?.totalAmount || 0).toLocaleString()} {selectedBooking.invoice?.currency || 'INR'}
                        </div>
                      </div>
                    </div>

                    {/* ITEMS TABLE (DESKTOP) */}
                    <div className="portal-desktop-only portal-table-scroll">
                      <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#FAF9F5', borderBottom: '1px solid var(--line)' }}>
                            <th style={{ padding: '14px 18px', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Article / Specification</th>
                            <th style={{ padding: '14px 18px', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material & Finish</th>
                            <th style={{ padding: '14px 18px', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dimensions</th>
                            <th style={{ padding: '14px 18px', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Quantity</th>
                            <th style={{ padding: '14px 18px', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total ({selectedBooking.invoice?.currency || 'INR'})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedBooking.items || []).map((it, idx) => (
                            <tr key={it.id || idx} style={{ borderBottom: '1px solid #ECE7DE' }}>
                              <td style={{ padding: '16px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                  {it.image && (
                                    <img
                                      src={it.image}
                                      alt={it.name}
                                      style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 4, border: '1px solid #ECE7DE', flexShrink: 0 }}
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/fallback-product.svg';
                                      }}
                                    />
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{it.name}</div>
                                    <div style={{ fontSize: 12, color: '#777777' }}>SKU: {it.id} &bull; {it.catName || 'Catalog Selection'}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px 18px', fontSize: 13.5 }}>
                                <div>{it.material || 'Solid Teak / Sheesham'}</div>
                                {it.finish && <div style={{ fontSize: 12, color: '#777777' }}>Finish: {it.finish}</div>}
                              </td>
                              <td style={{ padding: '16px 18px', fontSize: 13 }}>
                                <span style={{ fontFamily: 'monospace', background: '#F5F3EF', padding: '2px 6px', borderRadius: 4 }}>
                                  {it.dimensions || 'Per CAD Drawing'}
                                </span>
                              </td>
                              <td style={{ padding: '16px 18px', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                                {it.quantity} pcs
                              </td>
                              <td style={{ padding: '16px 18px', textAlign: 'right', fontSize: 14, fontWeight: 700 }}>
                                {getCurrencySymbol(selectedBooking.invoice?.currency)}{((it.totalPrice || (it.quantity * (it.unitPrice || 0)))).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ITEMS LIST (MOBILE CARDS) */}
                    <div className="portal-mobile-only" style={{ marginBottom: 28 }}>
                      {(selectedBooking.items || []).map((it, idx) => (
                        <div
                          key={it.id || idx}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--r-md)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                            {it.image && (
                              <img
                                src={it.image}
                                alt={it.name}
                                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid #ECE7DE', flexShrink: 0 }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/fallback-product.svg';
                                }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14.5, color: '#111111' }}>{it.name}</div>
                              <div style={{ fontSize: 12, color: '#777777', marginTop: 2 }}>
                                SKU: {it.id} &bull; {it.catName || 'Catalog Selection'}
                              </div>
                            </div>
                          </div>

                          <div style={{ background: '#FAF9F5', padding: '10px 12px', borderRadius: 6, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div><strong>Material:</strong> {it.material || 'Solid Hardwood'}</div>
                            {it.finish && <div><strong>Finish:</strong> {it.finish}</div>}
                            <div><strong>Dimensions:</strong> {it.dimensions || 'Per CAD Drawing'}</div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #ECE7DE' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#555555' }}>
                              Quantity: <strong>{it.quantity} pcs</strong>
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>
                              {getCurrencySymbol(selectedBooking.invoice?.currency)}{((it.totalPrice || (it.quantity * (it.unitPrice || 0)))).toLocaleString()} {selectedBooking.invoice?.currency || 'INR'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CONSIGNEE ADDRESS & SITE CONSTRAINTS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                      <div style={{ padding: 22, background: '#FAF9F5', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-2)', marginBottom: 12 }}>
                          Consignee Project Site & Destination
                        </h4>
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                          <div><strong>{selectedBooking.clientName}</strong></div>
                          {selectedBooking.companyName && <div>{selectedBooking.companyName}</div>}
                          <div>{selectedBooking.shippingAddress?.street}</div>
                          <div>{selectedBooking.shippingAddress?.city}, {selectedBooking.shippingAddress?.state} {selectedBooking.shippingAddress?.postalCode}</div>
                          <div>{selectedBooking.shippingAddress?.country}</div>
                          <div style={{ marginTop: 8, color: '#666666' }}>Phone: {selectedBooking.phone}</div>
                          <div style={{ color: '#666666' }}>Email: {selectedBooking.email}</div>
                          {selectedBooking.gstOrTaxId && <div style={{ marginTop: 4 }}>Tax ID / GST: <strong>{selectedBooking.gstOrTaxId}</strong></div>}
                        </div>
                      </div>

                      <div style={{ padding: 22, background: '#FAF9F5', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-2)', marginBottom: 12 }}>
                          Site Access & Fabrication Notes
                        </h4>
                        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#444444' }}>
                          <p style={{ margin: '0 0 10px' }}>
                            <strong>Site Access:</strong> {selectedBooking.shippingAddress?.siteAccessNotes || 'Standard freight container access confirmed.'}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Production Notes:</strong> {selectedBooking.specialNotes || 'Standard contract grade packaging with corner styrofoam and bubble wraps.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: PROFORMA INVOICE */}
                {inspectorTab === 'invoice' && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #DDD', borderRadius: 'var(--r-md)', padding: '36px 32px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    {/* INVOICE HEADER */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, paddingBottom: 24, borderBottom: '2px solid #111111', marginBottom: 28 }}>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-serif)', color: '#111111' }}>
                          ORBIT EXPO CRAFTS
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                          Commercial Furniture & Architectural Manufacturing Export Division
                        </div>
                        <div style={{ fontSize: 12.5, color: '#666666', lineHeight: 1.5 }}>
                          RIICO Industrial Area, Phase II, Basni<br />
                          Jodhpur 342005, Rajasthan, India<br />
                          GSTIN: 08AAECO4928M1Z4 &bull; IEC Code: 0514028912<br />
                          Email: trade@orbitexpocrafts.com &bull; Tel: +91 99280 22151
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand)', letterSpacing: '0.05em' }}>
                          PROFORMA INVOICE
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                          #{selectedBooking.invoice?.invoiceNumber}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#666666', marginTop: 2 }}>
                          Date of Issue: {selectedBooking.invoice?.issueDate}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#666666' }}>
                          Order Reference: <strong>{selectedBooking.id}</strong>
                        </div>
                      </div>
                    </div>

                    {/* BUYER / CONSIGNEE */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 28, padding: 18, background: '#FAF9F5', borderRadius: 6 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777777', marginBottom: 6 }}>
                          CONSIGNEE / BUYER
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedBooking.projectName}</div>
                        <div style={{ fontSize: 13.5 }}>{selectedBooking.clientName}</div>
                        {selectedBooking.companyName && <div style={{ fontSize: 13.5 }}>{selectedBooking.companyName}</div>}
                        <div style={{ fontSize: 13, color: '#555555' }}>{selectedBooking.shippingAddress?.street}, {selectedBooking.shippingAddress?.city}, {selectedBooking.shippingAddress?.country}</div>
                        {selectedBooking.gstOrTaxId && <div style={{ fontSize: 12.5, marginTop: 4 }}>Tax ID / GST: {selectedBooking.gstOrTaxId}</div>}
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777777', marginBottom: 6 }}>
                          COMMERCIAL SHIPPING TERMS
                        </div>
                        <div style={{ fontSize: 13.5 }}><strong>Terms:</strong> FOB Mundra Port / Ex-Factory Jodhpur</div>
                        <div style={{ fontSize: 13.5 }}><strong>Target Delivery:</strong> {selectedBooking.targetDeliveryDate || 'Within 60 working days'}</div>
                        <div style={{ fontSize: 13.5 }}><strong>Port of Loading:</strong> Mundra Port (INMUN1)</div>
                        <div style={{ fontSize: 13.5 }}><strong>Currency:</strong> {selectedBooking.invoice?.currency}</div>
                      </div>
                    </div>

                    {/* TABLE (DESKTOP) */}
                    <div className="portal-desktop-only portal-table-scroll">
                      <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#111111', color: '#FFFFFF' }}>
                            <th style={{ padding: '10px 14px', fontSize: 12, textTransform: 'uppercase' }}>#</th>
                            <th style={{ padding: '10px 14px', fontSize: 12, textTransform: 'uppercase' }}>Description of Articles</th>
                            <th style={{ padding: '10px 14px', fontSize: 12, textTransform: 'uppercase' }}>HSN Code</th>
                            <th style={{ padding: '10px 14px', fontSize: 12, textTransform: 'uppercase', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '10px 14px', fontSize: 12, textTransform: 'uppercase', textAlign: 'right' }}>Unit Rate</th>
                            <th style={{ padding: '10px 14px', fontSize: 12, textTransform: 'uppercase', textAlign: 'right' }}>Amount ({selectedBooking.invoice?.currency})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedBooking.items || []).map((it, idx) => (
                            <tr key={it.id || idx} style={{ borderBottom: '1px solid #E0E0E0' }}>
                              <td style={{ padding: '12px 14px', fontSize: 13 }}>{idx + 1}</td>
                              <td style={{ padding: '12px 14px', fontSize: 13 }}>
                                <strong>{it.name}</strong>
                                <div style={{ fontSize: 11.5, color: '#666666' }}>
                                  {it.material || 'Solid Teak Wood'} &bull; {it.dimensions || 'CAD Specs'}
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: 12.5, fontFamily: 'monospace' }}>94036000</td>
                              <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>{it.quantity}</td>
                              <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right' }}>{getCurrencySymbol(selectedBooking.invoice?.currency)}{(it.unitPrice || 0).toLocaleString()}</td>
                              <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                                {getCurrencySymbol(selectedBooking.invoice?.currency)}{((it.totalPrice || (it.quantity * (it.unitPrice || 0)))).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ITEMS LIST (MOBILE CARDS) */}
                    <div className="portal-mobile-only" style={{ marginBottom: 24 }}>
                      {(selectedBooking.items || []).map((it, idx) => (
                        <div
                          key={it.id || idx}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--r-md)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 11, color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Item #{idx + 1} &bull; HSN 94036000
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#111111', marginTop: 3 }}>
                              {it.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                              {it.material || 'Solid Teak Wood'} &bull; {it.dimensions || 'CAD Specs'}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #ECE7DE', fontSize: 13 }}>
                            <span style={{ color: '#555555' }}>
                              Qty: <strong>{it.quantity} pcs</strong> &times; {getCurrencySymbol(selectedBooking.invoice?.currency)}{(it.unitPrice || 0).toLocaleString()}
                            </span>
                            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--brand)' }}>
                              {getCurrencySymbol(selectedBooking.invoice?.currency)}{((it.totalPrice || (it.quantity * (it.unitPrice || 0)))).toLocaleString()} {selectedBooking.invoice?.currency || 'INR'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* FINANCIAL TOTALS */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
                      <div style={{ width: '100%', maxWidth: 360, fontSize: 13.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ECE7DE' }}>
                          <span style={{ color: '#666666' }}>Subtotal Ex-Factory:</span>
                          <strong>{getCurrencySymbol(selectedBooking.invoice?.currency)}{(selectedBooking.invoice?.subtotal || 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ECE7DE' }}>
                          <span style={{ color: '#666666' }}>Export Crating & Palletizing:</span>
                          <strong>{getCurrencySymbol(selectedBooking.invoice?.currency)}{(selectedBooking.invoice?.packingAndCrating || 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ECE7DE' }}>
                          <span style={{ color: '#666666' }}>Port Freight & Handling Provision:</span>
                          <strong>{getCurrencySymbol(selectedBooking.invoice?.currency)}{(selectedBooking.invoice?.estimatedFreight || 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 17, fontWeight: 800, color: '#111111', borderTop: '2px solid #111111', marginTop: 4 }}>
                          <span>Total Invoice Value:</span>
                          <span style={{ color: 'var(--brand)' }}>{getCurrencySymbol(selectedBooking.invoice?.currency)}{(selectedBooking.invoice?.totalAmount || 0).toLocaleString()} {selectedBooking.invoice?.currency || 'INR'}</span>
                        </div>
                      </div>
                    </div>

                    {/* BANK DETAILS & PAYMENT TERMS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, padding: 20, background: '#FAF9F5', borderRadius: 6, border: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: 6 }}>
                          OFFICIAL BANK WIRE DETAILS (SWIFT / RTGS)
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                          <div><strong>Account:</strong> {selectedBooking.invoice?.bankDetails.accountName}</div>
                          <div><strong>Bank:</strong> {selectedBooking.invoice?.bankDetails.bankName}</div>
                          <div><strong>Account Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedBooking.invoice?.bankDetails.accountNumber}</span></div>
                          <div><strong>IFSC / RTGS:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedBooking.invoice?.bankDetails.ifscCode}</span></div>
                          <div><strong>SWIFT / BIC:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedBooking.invoice?.bankDetails.swiftCode}</span></div>
                          <div><strong>Branch:</strong> {selectedBooking.invoice?.bankDetails.branch}</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#777777', marginBottom: 6 }}>
                          COMMERCIAL PAYMENT TERMS
                        </div>
                        <p style={{ fontSize: 13, color: '#444444', lineHeight: 1.5, margin: '0 0 12px' }}>
                          {selectedBooking.invoice?.paymentTerms}
                        </p>
                        <div style={{ fontSize: 12, color: '#777777', borderTop: '1px solid #ECE7DE', paddingTop: 8 }}>
                          Authorized Signatory &bull; Orbit Expo Crafts Commercial Division
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 4: CONVERSATION & QUERY DESK */}
                {inspectorTab === 'conversation' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480, background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                    {/* CHAT HEADER */}
                    <div style={{ padding: '14px 20px', background: '#FAF9F5', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2E7D32' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>Orbit Technical Desk &bull; Rajasthan Factory</div>
                          <div style={{ fontSize: 12, color: '#666666' }}>Dedicated Specifier: Rajeev Sharma (Lead Furniture Engineer)</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, background: '#E8F5E9', color: '#2E7D32', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>
                          Live Thread Synced
                        </span>
                        <a
                          href={`https://wa.me/919928022151?text=${encodeURIComponent(`*Hello Orbit Technical Desk*\n\nI am inquiring about Commercial Order *${selectedBooking.id}*.\nClient: ${user?.firstName || selectedBooking.clientName || 'Client'}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            background: '#25D366',
                            color: '#FFFFFF',
                            padding: '5px 12px',
                            borderRadius: 4,
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 1px 4px rgba(37,211,102,0.3)',
                          }}
                        >
                          <span>💬</span> WhatsApp Direct (+91 99280 22151)
                        </a>
                      </div>
                    </div>

                    {/* MESSAGES LIST */}
                    <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#FCFBF8', minHeight: 320 }}>
                      {selectedBooking.messages && selectedBooking.messages.length > 0 ? (
                        selectedBooking.messages.map((msg) => {
                          const isClient = msg.sender === 'client';
                          return (
                            <div
                              key={msg.id}
                              style={{
                                alignSelf: isClient ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                              }}
                            >
                              <div style={{ fontSize: 11.5, color: '#777777', marginBottom: 4, textAlign: isClient ? 'right' : 'left' }}>
                                <strong>{msg.senderName}</strong> &bull; {msg.timestamp}
                              </div>
                              <div
                                style={{
                                  background: isClient ? '#111111' : '#FFFFFF',
                                  color: isClient ? '#FFFFFF' : '#111111',
                                  padding: '12px 16px',
                                  borderRadius: 8,
                                  border: isClient ? 'none' : '1px solid #ECE7DE',
                                  fontSize: 13.5,
                                  lineHeight: 1.5,
                                  boxShadow: isClient ? '0 2px 6px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.04)',
                                }}
                              >
                                {msg.text}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ textAlign: 'center', color: '#888', padding: '40px 20px', fontSize: 14 }}>
                          No messages yet. Send a query below to connect directly with our engineering desk.
                        </div>
                      )}
                    </div>

                    {/* QUERY COMPOSER */}
                    <form onSubmit={handleSendMessage} style={{ padding: 16, background: '#FFFFFF', borderTop: '1px solid var(--line)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={newQueryMessage}
                        onChange={(e) => setNewQueryMessage(e.target.value)}
                        placeholder="Type query regarding CAD revisions, timber swatches, or delivery schedule..."
                        style={{
                          flex: 1,
                          minWidth: 260,
                          padding: '12px 16px',
                          borderRadius: 6,
                          border: '1px solid #CCCCCC',
                          fontSize: 14,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isSendingMessage || !newQueryMessage.trim()}
                        style={{
                          background: '#25D366',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '12px 22px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: isSendingMessage || !newQueryMessage.trim() ? 'not-allowed' : 'pointer',
                          opacity: isSendingMessage || !newQueryMessage.trim() ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 2px 8px rgba(37,211,102,0.35)',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>💬</span>
                        {isSendingMessage ? 'Opening WhatsApp...' : 'Send & Chat on WhatsApp →'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* LIST OF BOOKINGS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
                      Commercial Order Bookings & Consignments
                    </h2>
                    <p style={{ fontSize: 14, color: '#666666', marginTop: 4 }}>
                      Complete transaction transparency, milestone tracking, and proforma invoices for your project orders.
                    </p>
                  </div>
                  {bookings.length > 0 && (
                    <Link
                      href="/collections"
                      style={{
                        background: '#111111',
                        color: '#FFFFFF',
                        padding: '10px 18px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontSize: 13.5,
                        fontWeight: 600,
                      }}
                    >
                      + Book Another Order
                    </Link>
                  )}
                </div>

                {bookings.length > 0 ? (
                  <>
                    {/* DESKTOP TABLE */}
                    <div className="portal-desktop-only portal-table-scroll">
                      <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#FAF9F5', borderBottom: '2px solid var(--line)' }}>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booking Ref & PI #</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project & Location</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Consignment Specs</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((bk) => (
                            <tr key={bk.id} style={{ borderBottom: '1px solid #ECE7DE' }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{bk.id}</div>
                                <div style={{ fontSize: 12, color: '#777777', marginTop: 2 }}>
                                  PI #{bk.invoice?.invoiceNumber || 'Pending'}
                                </div>
                              </td>
                              <td style={{ padding: '16px', fontSize: 13.5, color: '#666666' }}>
                                {bk.createdAt}
                              </td>
                              <td style={{ padding: '16px' }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{bk.projectName}</div>
                                <div style={{ fontSize: 12, color: '#777777' }}>
                                  {bk.shippingAddress?.city}, {bk.shippingAddress?.country}
                                </div>
                              </td>
                              <td style={{ padding: '16px', fontSize: 13.5 }}>
                                <div><strong>{bk.totalPieces} pcs</strong> &bull; {bk.estimatedCbm} CBM</div>
                                <div style={{ fontSize: 12, color: '#777777' }}>
                                  {bk.items.length} unique specification{bk.items.length > 1 ? 's' : ''}
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span
                                  style={{
                                    background: bk.status === 'Dispatched' ? '#E8F5E9' : '#FFF3E0',
                                    color: bk.status === 'Dispatched' ? '#2E7D32' : '#B45309',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {bk.status}
                                </span>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBooking(bk);
                                      setInspectorTab('timeline');
                                    }}
                                    style={{
                                      background: '#111111',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: 4,
                                      padding: '7px 12px',
                                      fontSize: 12.5,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Inspect & Track →
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBooking(bk);
                                      setInspectorTab('conversation');
                                    }}
                                    style={{
                                      background: '#FAF9F5',
                                      color: '#111111',
                                      border: '1px solid #CCC',
                                      borderRadius: 4,
                                      padding: '7px 10px',
                                      fontSize: 12.5,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                    title="Open conversation thread"
                                  >
                                    💬 ({bk.messages?.length || 0})
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="portal-mobile-only" style={{ marginBottom: 28 }}>
                      {bookings.map((bk) => (
                        <div
                          key={bk.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--r-md)',
                            padding: '16px',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: '#111111' }}>{bk.id}</div>
                              <div style={{ fontSize: 12, color: '#777777', marginTop: 2 }}>
                                PI #{bk.invoice?.invoiceNumber || 'Pending'} &bull; {bk.createdAt}
                              </div>
                            </div>
                            <span
                              style={{
                                background: bk.status === 'Dispatched' ? '#E8F5E9' : '#FFF3E0',
                                color: bk.status === 'Dispatched' ? '#2E7D32' : '#B45309',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 11.5,
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {bk.status}
                            </span>
                          </div>

                          <div style={{ borderTop: '1px solid #F0ECE4', borderBottom: '1px solid #F0ECE4', padding: '10px 0', fontSize: 13 }}>
                            <div style={{ fontWeight: 600, color: '#222222', marginBottom: 2 }}>{bk.projectName}</div>
                            <div style={{ fontSize: 12, color: '#666666' }}>
                              📍 {bk.shippingAddress?.city || 'Project Site'}, {bk.shippingAddress?.country || ''}
                            </div>
                            <div style={{ fontSize: 12, color: '#444444', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                              <span>📦 <strong>{bk.totalPieces} pcs</strong></span>
                              <span>📐 <strong>{bk.estimatedCbm} CBM</strong></span>
                              {bk.invoice && <span>💵 <strong>{getCurrencySymbol(bk.invoice.currency)}{(bk.invoice.totalAmount || 0).toLocaleString()} {bk.invoice.currency || 'INR'}</strong></span>}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBooking(bk);
                                setInspectorTab('timeline');
                              }}
                              style={{
                                background: '#111111',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: 6,
                                padding: '9px 14px',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'center',
                              }}
                            >
                              Inspect & Track →
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBooking(bk);
                                setInspectorTab('conversation');
                              }}
                              style={{
                                background: '#FAF9F5',
                                color: '#111111',
                                border: '1px solid #CCC',
                                borderRadius: 6,
                                padding: '9px 12px',
                                fontSize: 12.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              💬 ({bk.messages?.length || 0})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '64px 20px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No Commercial Orders Booked Yet</h3>
                    <p style={{ fontSize: 14.5, color: '#666666', maxWidth: '45ch', margin: '0 auto 24px' }}>
                      Orbit Expo Crafts routes complete contract orders through our catalog portal without requiring online credit card payment. Add items to your enquiry bag and proceed to order booking to generate your Proforma Invoice and tracking.
                    </p>
                    <Link
                      href="/collections"
                      style={{
                        display: 'inline-block',
                        background: '#111111',
                        color: '#FFFFFF',
                        padding: '12px 24px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      Browse Catalog & Book Order →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPANY & TRADE PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>
              Company & Trade Profile
            </h2>

            {profileSuccess && (
              <div style={{ padding: '12px 16px', background: '#E8F5E9', color: '#2E7D32', borderRadius: 6, marginBottom: 20, fontWeight: 600, fontSize: 14 }}>
                ✓ Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFirstName}
                    onChange={(e) => {
                      setProfileFirstName(e.target.value);
                      if (profileFieldErrors.firstName) setProfileFieldErrors((prev) => ({ ...prev, firstName: '' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: profileFieldErrors.firstName ? '1px solid #DC2626' : '1px solid #CCC',
                      fontSize: 14,
                    }}
                  />
                  {profileFieldErrors.firstName && (
                    <span style={{ display: 'block', color: '#DC2626', fontSize: 11.5, marginTop: 4 }}>
                      {profileFieldErrors.firstName}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                  Company / Architectural Studio
                </label>
                <input
                  type="text"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #DDD', fontSize: 14, background: '#F5F5F5', color: '#777' }}
                  />
                </div>
                <div>
                  <PhoneInputField
                    label="Phone / WhatsApp Number"
                    value={profilePhoneDigits}
                    countryCode={profilePhoneCountry.code}
                    onChange={(digits, _fullNumber, countryObj) => {
                      setProfilePhoneDigits(digits);
                      setProfilePhoneCountry(countryObj);
                      if (profileFieldErrors.phone) setProfileFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    onCountryChange={setProfilePhoneCountry}
                    error={profileFieldErrors.phone}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  alignSelf: 'flex-start',
                  background: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
