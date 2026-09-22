'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, CustomerUser } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useEnquiry } from '../../context/EnquiryContext';
import { BookingRecord, BookingMessage, BookingDocument } from '../../types/booking';
import { getStoredBookings, saveBooking, appendMessageToBooking, generateDefaultMilestones, deduplicateBookings } from '../../lib/bookingStore';
import PhoneInputField, { CountryCode, PHONE_COUNTRIES, validatePhoneNumber } from '../../components/PhoneInputField';

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
  const [testUser, setTestUser] = useState<CustomerUser | null>(null);
  const activeUser = user || testUser;
  const isUserAuthenticated = isAuthenticated || !!testUser;
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
  const [inspectorTab, setInspectorTab] = useState<'items' | 'documents' | 'conversation' | 'invoice'>('documents');
  const [newQueryMessage, setNewQueryMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncRef = useRef<number>(0);
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
      if (params.get('testPortal') === '1') {
        const mock: CustomerUser = {
          id: 999,
          username: 'vikram.singhania',
          email: 'vikram@singhania-architects.in',
          firstName: 'Vikram',
          lastName: 'Singhania',
          company: 'Singhania Architecture & Interiors',
          phone: '+91 98290 12345',
          role: 'Verified Trade Partner (Architectural Lead)',
        };
        setTestUser(mock);

        const demoDomestic: BookingRecord = {
          id: 'BK-2026-IND-8801',
          createdAt: '2026-09-18T10:30:00.000Z',
          projectName: 'The Leela Palace Suites — Bespoke Sheesham Collection',
          clientName: 'Vikram Singhania',
          companyName: 'Singhania Architecture & Interiors',
          email: 'vikram@singhania-architects.in',
          phone: '+91 98290 12345',
          status: 'In Production',
          totalPieces: 18,
          estimatedCbm: '4.80',
          targetDeliveryDate: 'Within 45 working days',
          marketType: 'domestic',
          clientCategory: 'trade',
          shippingAddress: {
            street: 'Block A, Diplomatic Enclave, Chanakyapuri',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110021',
            country: 'India',
          },
          items: [
            {
              id: 'item-1',
              name: 'Imperial Hand-Carved Sheesham Dining Table (8-Seater)',
              quantity: 2,
              material: 'Solid Seasoned Sheesham (Indian Rosewood)',
              finish: 'Rich Walnut Matte Polyurethane',
              unitPrice: 78000,
              totalPrice: 156000,
            },
            {
              id: 'item-2',
              name: 'Acanthus Leaf Upholstered Carver Dining Chairs',
              quantity: 16,
              material: 'Solid Sheesham & Belgian Brass Castings',
              finish: 'Natural Honey Sheesham / Velvet Sage',
              unitPrice: 14500,
              totalPrice: 232000,
            },
          ],
          invoice: {
            invoiceNumber: 'TAX-DOM-2026-0814',
            issueDate: '19 Sep 2026',
            subtotal: 388000,
            packingAndCrating: 19400,
            estimatedFreight: 22000,
            totalAmount: 429400,
            currency: 'INR',
            paymentTerms: '50% Advance via NEFT/RTGS upon CAD approval, 50% prior to dispatch from Basni Jodhpur.',
          },
          documents: [
            {
              id: 'doc-dom-1',
              name: 'Master Joinery Manual & Finish Schedule',
              description: 'Comprehensive workshop joinery manual detailing mortise-and-tenon specifications, seasonal wood movement allowances, and polyurethane coating care.',
              fileUrl: '/catalogue/Orbit-Expo-Crafts-Spec-Sheet.pdf',
              fileName: 'Leela-Suites-Joinery-Manual.pdf',
              fileType: 'application/pdf',
              fileSize: '3.4 MB',
              uploadedBy: 'Orbit Engineering Team',
              uploadedAt: '19 Sep 2026',
            },
            {
              id: 'doc-dom-2',
              name: 'GST Tax Invoice & E-Way Bill Consignment Schedule',
              description: 'Statutory GST tax schedule (HSN 9403, 18% CGST/SGST) and interstate road transit consignment declaration for Basni (Jodhpur) to New Delhi corridor.',
              fileUrl: '/catalogue/Orbit-Project-BOQ.xlsx',
              fileName: 'GST-Tax-Schedule-0814.pdf',
              fileType: 'application/pdf',
              fileSize: '1.8 MB',
              uploadedBy: 'Orbit Accounts Desk',
              uploadedAt: '20 Sep 2026',
            },
            {
              id: 'doc-dom-3',
              name: 'Timber Kiln-Seasoning & Moisture Compliance Certificate',
              description: 'Calibrated laboratory test certificate confirming equilibrium moisture content (EMC) stabilized between 8.2% and 9.4% for North Indian climate.',
              fileUrl: '/catalogue/Orbit-Expo-Crafts-Spec-Sheet.pdf',
              fileName: 'Wood-Moisture-QC-Cert.pdf',
              fileType: 'application/pdf',
              fileSize: '1.2 MB',
              uploadedBy: 'QC Inspection Head (Basni)',
              uploadedAt: '21 Sep 2026',
            },
          ],
          messages: [
            {
              id: 'm-1',
              sender: 'team',
              senderName: 'Orbit Engineering Desk',
              timestamp: 'Sep 18, 2026, 11:30 am',
              text: 'Welcome to your Trade & Client Project Portal. We have confirmed receipt of the preliminary BOQ for The Leela Palace Suites.',
            },
            {
              id: 'm-2',
              sender: 'client',
              senderName: 'Vikram Singhania (Architect)',
              timestamp: 'Sep 19, 2026, 02:15 pm',
              text: 'Thank you. Please ensure the finish matches the sample chip sent to our Delhi studio earlier this week.',
            },
            {
              id: 'm-3',
              sender: 'team',
              senderName: 'Orbit Engineering Desk',
              timestamp: 'Sep 21, 2026, 10:00 am',
              text: 'Sample chip approved. Master Joinery Manual and Kiln Moisture Certificate have been uploaded to the Manual / Documents tab for your review.',
            },
          ],
        };

        const demoExport: BookingRecord = {
          id: 'BK-2026-EXP-9204',
          createdAt: '2026-09-15T08:00:00.000Z',
          projectName: 'Mayfair Penthouse Residence & Lounge',
          clientName: 'Olivia Laurent',
          companyName: 'Laurent Interiors London',
          email: 'olivia@laurent-interiors.co.uk',
          phone: '+44 20 7946 0912',
          status: 'Quality Control & Packing',
          totalPieces: 12,
          estimatedCbm: '3.60',
          targetDeliveryDate: 'Within 60 working days',
          marketType: 'export',
          clientCategory: 'trade',
          shippingAddress: {
            street: 'Flat 4B, 18 Grosvenor Square',
            city: 'London',
            state: 'Greater London',
            postalCode: 'W1K 6LD',
            country: 'United Kingdom',
          },
          items: [
            {
              id: 'exp-1',
              name: 'Grand Chesterfield Solid Teak Library Bookcase',
              quantity: 2,
              material: 'First-Grade Reclaimed Teak & Hand-Cast Antique Ironmongery',
              finish: 'Smoked Oak Hand-Rubbed Wax',
              unitPrice: 115000,
              totalPrice: 230000,
            },
            {
              id: 'exp-2',
              name: 'Artisan Turned-Leg Coffee Table with Inlaid Bone Accents',
              quantity: 2,
              material: 'Solid Acacia & Sustainably Sourced Camel Bone Inlay',
              finish: 'Matte Ebony & Bone',
              unitPrice: 42000,
              totalPrice: 84000,
            },
          ],
          invoice: {
            invoiceNumber: 'EXP-CIF-2026-042',
            issueDate: '15 Sep 2026',
            subtotal: 314000,
            packingAndCrating: 15700,
            estimatedFreight: 38000,
            totalAmount: 367700,
            currency: 'USD',
            paymentTerms: '50% SWIFT Wire upon CAD sign-off, 50% against original Bill of Lading copy.',
          },
          documents: [
            {
              id: 'doc-exp-1',
              name: 'ISPM-15 Phytosanitary Fumigation Certificate',
              description: 'Government certified fumigation clearance and heat-treatment certificate required by UK and European Port Authorities for solid wood crates.',
              fileUrl: '/catalogue/Orbit-Expo-Crafts-Spec-Sheet.pdf',
              fileName: 'ISPM-15-Phytosanitary-Cert.pdf',
              fileType: 'application/pdf',
              fileSize: '2.1 MB',
              uploadedBy: 'Customs & Port Logistics',
              uploadedAt: '17 Sep 2026',
            },
            {
              id: 'doc-exp-2',
              name: 'Ocean Freight Consignment Manifest & Port Declaration',
              description: 'Shipping line sea container manifest with Mundra Port (INMUN1) customs clearance stamp and verified gross mass (VGM) container slip.',
              fileUrl: '/catalogue/Orbit-Project-BOQ.xlsx',
              fileName: 'Ocean-Manifest-INMUN1.pdf',
              fileType: 'application/pdf',
              fileSize: '2.8 MB',
              uploadedBy: 'Maersk Export Desk',
              uploadedAt: '18 Sep 2026',
            },
          ],
          messages: [
            {
              id: 'm-exp-1',
              sender: 'team',
              senderName: 'Orbit Export Concierge',
              timestamp: 'Sep 15, 2026, 09:00 am',
              text: 'Export booking confirmed. ISPM-15 export-grade packaging is scheduled following final QC inspection.',
            },
          ],
        };

        setBookings([demoDomestic, demoExport]);
        const targetBookingId = params.get('bookingId');
        if (targetBookingId === demoExport.id) {
          setSelectedBooking(demoExport);
        } else {
          setSelectedBooking(demoDomestic);
        }
        setActiveTab('orders');
        setInspectorTab('documents');

        return;
      }

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
      } else {
        setSelectedBooking(null);
      }
    };

    readUrlState();
    window.addEventListener('popstate', readUrlState);
    return () => window.removeEventListener('popstate', readUrlState);
  }, [initialTab]);

  // Sync profile form when user logs in with deep fallback & auto-healing
  useEffect(() => {
    if (activeUser) {
      let fName = activeUser.firstName || '';
      let lName = activeUser.lastName || '';
      let phone = activeUser.phone || '';
      let comp = activeUser.company || '';

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
          const allBookings = getStoredBookings(activeUser.email);
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
        const hasNewFName = fName && !activeUser.firstName;
        const hasNewLName = lName && !activeUser.lastName;
        const hasNewComp = comp && !activeUser.company;
        const hasNewPhone = phone && !activeUser.phone;
        if (user && (hasNewFName || hasNewLName || hasNewComp || hasNewPhone)) {
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
  }, [activeUser]);

  // Refresh bookings on mount, on explicit user click, or when tab becomes visible (debounced)
  const refreshBookings = async (options?: { force?: boolean }) => {
    if (testUser) return;

    // Rate-limit automated background checks (minimum 30 seconds between auto-refreshes)
    // Explicit clicks (force: true) always run immediately
    const now = Date.now();
    if (!options?.force && now - lastSyncRef.current < 30000) {
      return;
    }
    lastSyncRef.current = now;

    // 1. Instantly populate from local storage so the page is immediately responsive
    const localList = deduplicateBookings(getStoredBookings());
    const urlBookingParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('bookingId') : null;
    if (localList.length > 0) {
      setBookings((prev) => (prev.length === 0 ? localList : deduplicateBookings(prev)));
      if (urlBookingParam) {
        const match = localList.find((b) => b.id === urlBookingParam || b.invoice?.invoiceNumber === urlBookingParam);
        if (match) {
          setSelectedBooking((prev) => prev || match);
        }
      }
    }

    // 2. Fetch live updates from WordPress backend
    setIsSyncing(true);
    try {
      const params = new URLSearchParams();
      if (activeUser?.email) {
        params.set('email', activeUser.email);
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
        const serverBookings: BookingRecord[] = deduplicateBookings(json.data.bookings);
        // Direct React state update - ZERO DELAY!
        setBookings(serverBookings);

        const currentParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('bookingId') : null;

        setSelectedBooking((prev) => {
          if (currentParam) {
            const matchedParam = serverBookings.find((b) => b.id === currentParam || b.invoice?.invoiceNumber === currentParam);
            if (matchedParam) return matchedParam;
          }
          if (prev) {
            const matched = serverBookings.find((b) => b.id === prev.id);
            if (matched) return matched;
            return prev;
          }
          return null;
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

  // Synchronize on mount and tab change, and on tab visibility (debounced, NO continuous polling interval)
  useEffect(() => {
    refreshBookings({ force: true });

    // 1. Sync when user returns to window/tab (debounced by lastSyncRef >= 30s)
    const handleFocus = () => {
      refreshBookings();
    };

    // 2. Sync when page becomes visible (debounced by lastSyncRef >= 30s)
    const handleVisibility = () => {
      if (!document.hidden) {
        refreshBookings();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeUser, activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !newQueryMessage.trim()) return;

    setIsSendingMessage(true);
    const clientNameStr = activeUser?.firstName
      ? `${activeUser.firstName} (Client)`
      : (selectedBooking.clientName ? `${selectedBooking.clientName} (Client)` : 'You (Client)');
    const textToSend = newQueryMessage.trim();
    const updated = appendMessageToBooking(selectedBooking.id, textToSend, 'client', clientNameStr);
    
    setNewQueryMessage('');
    setIsSendingMessage(false);
    
    if (updated) {
      setSelectedBooking({ ...updated });
      refreshBookings({ force: true });

      // Open WhatsApp directly with pre-filled order context & client query
      const orderRef = selectedBooking.id || 'Commercial Order';
      const companyStr = selectedBooking.companyName || activeUser?.company || '';
      const clientStr = selectedBooking.clientName || activeUser?.firstName || 'Client';
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
          refreshBookings({ force: true });
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
      const phoneErr = validatePhoneNumber(regPhoneDigits, regPhoneCountry, false);
      if (phoneErr) {
        errors.phone = phoneErr;
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
      const phoneErr = validatePhoneNumber(profilePhoneDigits, profilePhoneCountry, false);
      if (phoneErr) {
        errors.phone = phoneErr;
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
          email: activeUser?.email || '',
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


  const handleDownloadDoc = (doc: BookingDocument) => {
    if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // Synthesized document fallback download
    const content = `ORBIT EXPO CRAFTS - PROJECT DOCUMENTATION MANUAL\n\nProject: ${selectedBooking?.projectName || 'Contract Booking'}\nBooking Reference: ${selectedBooking?.id}\nClient: ${selectedBooking?.clientName || 'Client'}\nDocument Name: ${doc.name}\nDescription (Purpose): ${doc.description}\nFile Name: ${doc.fileName || doc.name}\nFormat / Size: ${doc.fileType} (${doc.fileSize})\nUploaded By: ${doc.uploadedBy}\nUpload Date: ${doc.uploadedAt}\n\nStatus: Official Verified Document in Orbit Expo Crafts Documentation Trail.\nRIICO Industrial Area, Basni, Jodhpur, Rajasthan, India\nSupport: trade@orbitexpocrafts.com | WhatsApp: +91 99280 22151`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_document.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareDocOnWhatsApp = (doc: BookingDocument) => {
    if (!selectedBooking) return;
    const clientNameStr = activeUser?.firstName || selectedBooking.clientName || 'Client';
    const text = [
      `*Project Document Reference: ${selectedBooking.id}*`,
      ``,
      `*Client:* ${clientNameStr}`,
      `*Project:* ${selectedBooking.projectName}`,
      `*Document Name:* ${doc.name}`,
      `*Description / Purpose:* ${doc.description}`,
      `*Format & Size:* ${doc.fileType} (${doc.fileSize})`,
      `*Uploaded By:* ${doc.uploadedBy} on ${doc.uploadedAt}`,
      ``,
      `_Shared via Orbit Expo Crafts Trade & Client Documentation Portal_`
    ].join('\n');
    window.open(`https://wa.me/919928022151?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // =========================================================================
  // VIEW 1: UNAUTHENTICATED LOGIN / REGISTER PORTAL
  // =========================================================================
  if (!isUserAuthenticated || !activeUser) {
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
                      onBlur={() => {
                        if (regPhoneDigits) {
                          const err = validatePhoneNumber(regPhoneDigits, regPhoneCountry, false);
                          if (err) setRegFieldErrors((prev) => ({ ...prev, phone: err }));
                        }
                      }}
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
                Welcome, {profileFirstName || activeUser.firstName || activeUser.username}
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
                {activeUser.role || 'Verified Trade Client'}
              </span>
            </div>
            <p style={{ fontSize: 14.5, color: '#666666', margin: 0 }}>
              {(profileCompany || activeUser.company) ? `${profileCompany || activeUser.company} • ` : ''}{activeUser.email}
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
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Trade & Client Project Portal</h3>
                    <p style={{ fontSize: 13.5, color: '#666666', margin: '2px 0 0' }}>
                      Project documentation trail, itemized bill of materials (BOQ), and direct engineering communication.
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
                  {bookings.slice(0, 3).map((bk, idx) => {
                    const isDomestic = bk.marketType === 'domestic' || bk.shippingAddress?.country?.toLowerCase() === 'india';
                    return (
                      <div
                        key={`ov-${bk.id || idx}-${idx}`}
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
                              background: bk.status === 'Dispatched' || bk.status === 'Delivered' ? '#E8F5E9' : '#FFF3E0',
                              color: bk.status === 'Dispatched' || bk.status === 'Delivered' ? '#2E7D32' : '#B45309',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                            }}>
                              {bk.status}
                            </span>
                            <span style={{
                              background: isDomestic ? '#EFF6FF' : '#F5F3FF',
                              color: isDomestic ? '#1D4ED8' : '#6D28D9',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11.5,
                              fontWeight: 700,
                            }}>
                              {isDomestic ? '🇮🇳 Domestic Trade' : '🌐 Export Trade'}
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
                              setInspectorTab('documents');
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
                            Project Documents & BOQ →
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
                    );
                  })}
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
                      onClick={() => {
                        setSelectedBooking(null);
                        handleTabChange('orders');
                      }}
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
                      ← Back to All Projects
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-serif)' }}>
                          {selectedBooking.id}
                        </h2>
                        <span style={{
                          background: selectedBooking.status === 'Dispatched' || selectedBooking.status === 'Delivered' ? '#E8F5E9' : '#FFF3E0',
                          color: selectedBooking.status === 'Dispatched' || selectedBooking.status === 'Delivered' ? '#2E7D32' : '#B45309',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                          {selectedBooking.status}
                        </span>
                        {((selectedBooking.marketType === 'domestic') || (selectedBooking.shippingAddress?.country?.toLowerCase() === 'india')) ? (
                          <span style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                            🇮🇳 Domestic Contract
                          </span>
                        ) : (
                          <span style={{
                            background: '#F5F3FF',
                            color: '#6D28D9',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                            🌐 Export Consignment
                          </span>
                        )}
                        <span style={{
                          background: '#F0ECE4',
                          color: 'var(--ink-2)',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {selectedBooking.clientCategory === 'direct' ? 'Direct Client' : 'Trade Partner'} &bull; PI #{selectedBooking.invoice?.invoiceNumber || 'Pending'}
                        </span>
                      </div>
                      <p style={{ fontSize: 13.5, color: '#666666', margin: '4px 0 0' }}>
                        Project: <strong>{selectedBooking.projectName}</strong> &bull; Booked on {selectedBooking.createdAt} &bull; {selectedBooking.shippingAddress?.city}, {selectedBooking.shippingAddress?.country}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>

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
                      href={`https://wa.me/919928022151?text=${encodeURIComponent(`*Hello Orbit Technical Desk*\n\nI am inquiring regarding Project *${selectedBooking.id}* (${selectedBooking.projectName}).\nClient: ${activeUser?.firstName || selectedBooking.clientName || 'Client'}\nLocation: ${selectedBooking.shippingAddress?.city}, ${selectedBooking.shippingAddress?.country}`)}`}
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
                    { key: 'documents', label: `📁 Manual & Project Documents (${selectedBooking.documents?.length || 0})` },
                    { key: 'items', label: '📦 Itemized Bill of Materials (BOQ)' },
                    { key: 'conversation', label: `💬 Conversation & Queries (${selectedBooking.messages?.length || 0})` },
                    { key: 'invoice', label: '📄 Commercial Proforma Invoice' },
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

                {/* SUBTAB 1: PROJECT DOCUMENTS & MANUAL REPOSITORY */}
                {inspectorTab === 'documents' && (
                  <div>
                    {/* DOMESTIC VS EXPORT NOTICE BANNER */}
                    {((selectedBooking.marketType === 'domestic') || (selectedBooking.shippingAddress?.country?.toLowerCase() === 'india')) ? (
                      <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 'var(--r-md)', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E40AF', marginBottom: 2 }}>
                            🇮🇳 Domestic Contract Supply & Dispatch Terms
                          </div>
                          <div style={{ fontSize: 13.5, color: '#334155' }}>
                            Dedicated Surface Road Transport Dispatch from Basni, Jodhpur to <strong>{selectedBooking.shippingAddress?.city}, {selectedBooking.shippingAddress?.state || ''}</strong> &bull; GST / Tax ID: <strong>{selectedBooking.gstOrTaxId || 'Included in Official GST Proforma'}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0F766E', background: '#F0FDFA', padding: '5px 12px', borderRadius: 6, border: '1px solid #99F6E4' }}>
                          ✓ Domestic Transport Dispatch
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 'var(--r-md)', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B21A8', marginBottom: 2 }}>
                            🌐 International Export Consignment Terms
                          </div>
                          <div style={{ fontSize: 13.5, color: '#4C1D95' }}>
                            FOB Mundra Port (INMUN1) / CIF Destination: <strong>{selectedBooking.shippingAddress?.city}, {selectedBooking.shippingAddress?.country}</strong> &bull; Tax ID / Customs: <strong>{selectedBooking.gstOrTaxId || 'Export Documentation Ready'}</strong>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B21A8', background: '#F3E8FF', padding: '5px 12px', borderRadius: 6, border: '1px solid #D8B4FE' }}>
                          ✓ Export Port Clearance
                        </div>
                      </div>
                    )}

                    {/* ACTION & SUMMARY BAR */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                          Manual & Project Documents Repository
                        </h3>
                        <p style={{ fontSize: 13, color: '#666666', margin: '2px 0 0' }}>
                          Official drawings, specifications, invoices, finish swatches, and quality certificates. All files are securely kept and permanently downloadable.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => refreshBookings({ force: true })}
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
                          title="Instant sync latest documents from team desk"
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
                          {isSyncing ? 'Syncing...' : 'Sync Documents'}
                        </button>

                      </div>
                    </div>

                    {/* DOCUMENTS TRAIL TABLE (DESKTOP) */}
                    {selectedBooking.documents && selectedBooking.documents.length > 0 ? (
                      <>
                        <div className="portal-desktop-only portal-table-scroll">
                          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', textAlign: 'left', background: '#FFFFFF', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                            <thead>
                              <tr style={{ background: '#FAF9F5', borderBottom: '2px solid var(--line)' }}>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: '26%' }}>
                                  Document Name
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: '34%' }}>
                                  Description / Purpose (Compulsory)
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%' }}>
                                  Uploaded By & Date
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: '10%' }}>
                                  Format
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '12%' }}>
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedBooking.documents.map((doc, idx) => (
                                <tr key={doc.id || idx} style={{ borderBottom: '1px solid #ECE7DE' }}>
                                  <td style={{ padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ fontSize: 22 }}>
                                        {doc.fileType?.includes('image') ? '🖼️' : doc.fileType?.includes('cad') || doc.name.toLowerCase().includes('cad') ? '📐' : '📄'}
                                      </span>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111111' }}>
                                          {doc.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#777777', marginTop: 2, fontFamily: 'monospace' }}>
                                          {doc.fileName || `${doc.name}.pdf`}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '16px 18px', fontSize: 13.5, color: '#333333', lineHeight: 1.5 }}>
                                    <div style={{ background: '#FAF9F5', padding: '8px 12px', borderRadius: 6, border: '1px solid #F0ECE4' }}>
                                      {doc.description}
                                    </div>
                                  </td>
                                  <td style={{ padding: '16px 18px', fontSize: 13 }}>
                                    <div style={{ fontWeight: 600, color: '#222222' }}>
                                      {doc.uploadedBy || 'Team'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#777777', marginTop: 2 }}>
                                      📅 {doc.uploadedAt || 'Recent'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '16px 18px', fontSize: 12.5 }}>
                                    <span style={{ background: '#ECE7DE', color: '#333333', padding: '3px 8px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>
                                      {doc.fileType?.toUpperCase().replace('APPLICATION/', '') || 'PDF'}
                                    </span>
                                    <div style={{ fontSize: 11.5, color: '#777777', marginTop: 4 }}>
                                      {doc.fileSize || '1.2 MB'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadDoc(doc)}
                                        style={{
                                          background: '#111111',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          borderRadius: 4,
                                          padding: '7px 12px',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 5,
                                          whiteSpace: 'nowrap',
                                        }}
                                        title="Download document to device"
                                      >
                                        <span>📥</span> Download
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleShareDocOnWhatsApp(doc)}
                                        style={{
                                          background: '#25D366',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          borderRadius: 4,
                                          padding: '7px 10px',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                        }}
                                        title="Share reference on WhatsApp"
                                      >
                                        <span>💬</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* DOCUMENTS CARDS (MOBILE) */}
                        <div className="portal-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {selectedBooking.documents.map((doc, idx) => (
                            <div
                              key={`mob-doc-${doc.id || idx}`}
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 22 }}>
                                    {doc.fileType?.includes('image') ? '🖼️' : doc.fileType?.includes('cad') || doc.name.toLowerCase().includes('cad') ? '📐' : '📄'}
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#111111' }}>{doc.name}</div>
                                    <div style={{ fontSize: 11.5, color: '#777777', fontFamily: 'monospace' }}>{doc.fileName || `${doc.name}.pdf`}</div>
                                  </div>
                                </div>
                                <span style={{ background: '#ECE7DE', color: '#333333', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                                  {doc.fileSize || 'PDF'}
                                </span>
                              </div>

                              <div style={{ background: '#FAF9F5', padding: '10px 12px', borderRadius: 6, fontSize: 13, color: '#333333', lineHeight: 1.5, border: '1px solid #ECE7DE' }}>
                                <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#777777', marginBottom: 2 }}>Description (Purpose):</strong>
                                {doc.description}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#666666' }}>
                                <span>Uploaded by <strong>{doc.uploadedBy || 'Team'}</strong></span>
                                <span>📅 {doc.uploadedAt || 'Recent'}</span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, paddingTop: 6, borderTop: '1px solid #ECE7DE' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(doc)}
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <span>📥</span> Download Document
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShareDocOnWhatsApp(doc)}
                                  style={{
                                    background: '#25D366',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '9px 14px',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                  title="Share on WhatsApp"
                                >
                                  <span>💬</span> WhatsApp
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '56px 20px', background: '#FAF9F5', borderRadius: 'var(--r-md)', border: '1px dashed #D6D0C4' }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
                        <h4 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>No Documents Uploaded Yet</h4>
                        <p style={{ fontSize: 14, color: '#666666', maxWidth: '52ch', margin: '0 auto' }}>
                          Specification drawings, finish sample approvals, CAD plans, and formal invoices uploaded by our project desk will appear here in your permanent documentation trail.
                        </p>
                      </div>
                    )}
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
                          <div><strong>Account:</strong> {selectedBooking.invoice?.bankDetails?.accountName || 'Orbit Expo Crafts'}</div>
                          <div><strong>Bank:</strong> {selectedBooking.invoice?.bankDetails?.bankName || 'State Bank of India'}</div>
                          <div><strong>Account Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedBooking.invoice?.bankDetails?.accountNumber || '38901248921'}</span></div>
                          <div><strong>IFSC / RTGS:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedBooking.invoice?.bankDetails?.ifscCode || 'SBIN0003241'}</span></div>
                          <div><strong>SWIFT / BIC:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedBooking.invoice?.bankDetails?.swiftCode || 'SBININBBXXX'}</span></div>
                          <div><strong>Branch:</strong> {selectedBooking.invoice?.bankDetails?.branch || 'Basni Industrial Area, Jodhpur'}</div>
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
                          href={`https://wa.me/919928022151?text=${encodeURIComponent(`*Hello Orbit Technical Desk*\n\nI am inquiring about Commercial Order *${selectedBooking.id}*.\nClient: ${activeUser?.firstName || selectedBooking.clientName || 'Client'}`)}`}
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
                        selectedBooking.messages.map((msg, idx) => {
                          const isClient = msg.sender === 'client';
                          return (
                            <div
                              key={`msg-${msg.id || idx}-${idx}`}
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
                      Trade & Client Project Portal
                    </h2>
                    <p style={{ fontSize: 14, color: '#666666', marginTop: 4 }}>
                      Contract projects, itemized specifications, manual document trails, and direct engineering communication for domestic and export trade.
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
                      <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#FAF9F5', borderBottom: '2px solid var(--line)' }}>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booking Ref & PI #</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project & Location</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Specifications & Docs</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trade & Status</th>
                            <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((bk, idx) => {
                            const isDomestic = bk.marketType === 'domestic' || bk.shippingAddress?.country?.toLowerCase() === 'india';
                            return (
                              <tr key={`tbl-${bk.id || idx}-${idx}`} style={{ borderBottom: '1px solid #ECE7DE' }}>
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
                                  <div style={{ fontSize: 12, color: '#0E5C63', marginTop: 2, fontWeight: 600 }}>
                                    📁 {bk.documents?.length || 0} project document{bk.documents?.length === 1 ? '' : 's'}
                                  </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                    <span
                                      style={{
                                        background: bk.status === 'Dispatched' || bk.status === 'Delivered' ? '#E8F5E9' : '#FFF3E0',
                                        color: bk.status === 'Dispatched' || bk.status === 'Delivered' ? '#2E7D32' : '#B45309',
                                        padding: '3px 9px',
                                        borderRadius: 999,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {bk.status}
                                    </span>
                                    <span
                                      style={{
                                        background: isDomestic ? '#EFF6FF' : '#F5F3FF',
                                        color: isDomestic ? '#1D4ED8' : '#6D28D9',
                                        padding: '2px 8px',
                                        borderRadius: 999,
                                        fontSize: 11,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {isDomestic ? '🇮🇳 Domestic Trade' : '🌐 Export Trade'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBooking(bk);
                                        setInspectorTab('documents');
                                        handleTabChange('orders', bk.id);
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
                                      Project Documents & BOQ →
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBooking(bk);
                                        setInspectorTab('conversation');
                                        handleTabChange('orders', bk.id);
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="portal-mobile-only" style={{ marginBottom: 28 }}>
                      {bookings.map((bk, idx) => {
                        const isDomestic = bk.marketType === 'domestic' || bk.shippingAddress?.country?.toLowerCase() === 'india';
                        return (
                          <div
                            key={`mob-${bk.id || idx}-${idx}`}
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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                <span
                                  style={{
                                    background: bk.status === 'Dispatched' || bk.status === 'Delivered' ? '#E8F5E9' : '#FFF3E0',
                                    color: bk.status === 'Dispatched' || bk.status === 'Delivered' ? '#2E7D32' : '#B45309',
                                    padding: '3px 10px',
                                    borderRadius: 999,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {bk.status}
                                </span>
                                <span
                                  style={{
                                    background: isDomestic ? '#EFF6FF' : '#F5F3FF',
                                    color: isDomestic ? '#1D4ED8' : '#6D28D9',
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {isDomestic ? '🇮🇳 Domestic Trade' : '🌐 Export Trade'}
                                </span>
                              </div>
                            </div>

                            <div style={{ borderTop: '1px solid #F0ECE4', borderBottom: '1px solid #F0ECE4', padding: '10px 0', fontSize: 13 }}>
                              <div style={{ fontWeight: 600, color: '#222222', marginBottom: 2 }}>{bk.projectName}</div>
                              <div style={{ fontSize: 12, color: '#666666' }}>
                                📍 {bk.shippingAddress?.city || 'Project Site'}, {bk.shippingAddress?.country || ''}
                              </div>
                              <div style={{ fontSize: 12, color: '#444444', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                <span>📦 <strong>{bk.totalPieces} pcs</strong></span>
                                <span>📐 <strong>{bk.estimatedCbm} CBM</strong></span>
                                <span style={{ color: '#0E5C63', fontWeight: 600 }}>📁 <strong>{bk.documents?.length || 0} Docs</strong></span>
                                {bk.invoice && <span>💵 <strong>{getCurrencySymbol(bk.invoice.currency)}{(bk.invoice.totalAmount || 0).toLocaleString()} {bk.invoice.currency || 'INR'}</strong></span>}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBooking(bk);
                                  setInspectorTab('documents');
                                  handleTabChange('orders', bk.id);
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
                                Project Documents & BOQ →
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBooking(bk);
                                  setInspectorTab('conversation');
                                  handleTabChange('orders', bk.id);
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
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '64px 20px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No Project Orders Booked Yet</h3>
                    <p style={{ fontSize: 14.5, color: '#666666', maxWidth: '45ch', margin: '0 auto 24px' }}>
                      Orbit Expo Crafts routes contract projects through our portal with direct proforma generation, CAD documentation trail, and personalized engineering support. Add pieces to your enquiry bag and confirm booking.
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
                      Browse Catalog & Book Project →
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
                    value={activeUser.email}
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
                    onBlur={() => {
                      if (profilePhoneDigits) {
                        const err = validatePhoneNumber(profilePhoneDigits, profilePhoneCountry, false);
                        if (err) setProfileFieldErrors((prev) => ({ ...prev, phone: err }));
                      }
                    }}
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
