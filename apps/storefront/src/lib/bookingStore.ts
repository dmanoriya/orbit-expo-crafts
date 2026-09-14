import { BookingRecord, BookingMessage, BookingMilestone } from '../types/booking';

const STORAGE_KEY = 'orbit_customer_bookings';

export function getStoredBookings(userEmail?: string): BookingRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: BookingRecord[] = JSON.parse(raw);
    all.forEach((b) => {
      if (b.invoice && (!b.invoice.currency || b.invoice.currency === 'USD')) {
        b.invoice.currency = 'INR';
      }
    });
    if (!userEmail) return all;
    return all.filter(
      (b) => !b.email || b.email.toLowerCase() === userEmail.toLowerCase()
    );
  } catch (e) {
    console.error('Error loading bookings:', e);
    return [];
  }
}

export function saveBooking(booking: BookingRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: BookingRecord[] = raw ? JSON.parse(raw) : [];
    const existingIndex = all.findIndex((b) => b.id === booking.id);
    if (existingIndex >= 0) {
      all[existingIndex] = booking;
    } else {
      all.unshift(booking);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Also attempt background sync with backend if online
    fetch('/api/wp/customers/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    }).catch(() => {
      // Offline fallback is already preserved in localStorage
    });
  } catch (e) {
    console.error('Error saving booking:', e);
  }
}

export function appendMessageToBooking(
  bookingId: string,
  text: string,
  sender: 'client' | 'concierge' = 'client',
  senderName: string = 'You (Client)'
): BookingRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all: BookingRecord[] = JSON.parse(raw);
    const target = all.find((b) => b.id === bookingId);
    if (!target) return null;

    const newMessage: BookingMessage = {
      id: 'msg_' + Date.now(),
      sender,
      senderName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      text,
    };

    target.messages.push(newMessage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Also attempt background sync with backend
    fetch(`/api/wp/customers/bookings/${bookingId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMessage),
    }).catch(() => {});

    return target;
  } catch (e) {
    console.error('Error adding message to booking:', e);
    return null;
  }
}

export function generateDefaultMilestones(): BookingMilestone[] {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return [
    {
      key: 'received',
      label: 'Commercial Booking Received',
      date: today,
      completed: true,
      active: false,
      note: 'Bill of quantities registered in Rajasthan factory queue.',
    },
    {
      key: 'cad_review',
      label: 'CAD Engineering & Material Verification',
      date: 'In Progress (24h turnaround)',
      completed: false,
      active: true,
      note: 'Technical specifier reviewing wood species, joinery, and moisture level.',
    },
    {
      key: 'proforma_issued',
      label: 'Commercial Proposal & Proforma Invoice Issued',
      completed: false,
      active: false,
      note: 'Official invoice generated with RTGS / SWIFT wire instructions.',
    },
    {
      key: 'production',
      label: 'Timber Seasoning & Joinery Crafting',
      completed: false,
      active: false,
      note: 'Kiln-drying to 8-10% EMC followed by master carving and inlay assembly.',
    },
    {
      key: 'qc_packing',
      label: 'Final QC Inspection & Export Crating',
      completed: false,
      active: false,
      note: 'Fumigated wooden box crating (ISPM-15 compliant) with moisture barrier.',
    },
    {
      key: 'dispatch',
      label: 'Container Loaded & Dispatched (Mundra Port)',
      completed: false,
      active: false,
      note: 'Bill of Lading and vessel consignment tracking activated.',
    },
  ];
}
