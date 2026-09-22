import { BookingRecord, BookingMessage, BookingMilestone, BookingDocument } from '../types/booking';

const STORAGE_KEY = 'orbit_customer_bookings';

export function deduplicateBookings(bookings: BookingRecord[]): BookingRecord[] {
  if (!Array.isArray(bookings)) return [];
  const seen = new Set<string>();
  const result: BookingRecord[] = [];
  for (const b of bookings) {
    if (!b || !b.id) continue;
    const key = String(b.id).trim();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(b);
    }
  }
  return result;
}

export function generateDefaultDocuments(bookingId: string = 'OEC-PROJ', projectName: string = 'Custom Project'): BookingDocument[] {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return [
    {
      id: 'doc_cad_' + (bookingId || '1'),
      name: 'Approved CAD Technical Specifications',
      description: `Signed joinery drawing and dimensional specifications approved for "${projectName}".`,
      fileUrl: '/catalogue/Orbit-Expo-Crafts-Spec-Sheet.pdf',
      fileName: 'CAD-Joinery-Specs.pdf',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      uploadedBy: 'company',
      uploadedAt: today,
    },
    {
      id: 'doc_boq_' + (bookingId || '2'),
      name: 'Itemized Project BOQ & Cost Proposal',
      description: 'Formal bill of quantities with wood species, hardware, PU finishes, and delivery schedule.',
      fileUrl: '/catalogue/Orbit-Project-BOQ.xlsx',
      fileName: 'Project-Quotation-BOQ.xlsx',
      fileType: 'xlsx',
      fileSize: '1.2 MB',
      uploadedBy: 'company',
      uploadedAt: today,
    },
  ];
}

export function getStoredBookings(userEmail?: string): BookingRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    let all: BookingRecord[] = JSON.parse(raw);
    if (!Array.isArray(all)) return [];

    // Auto-heal duplicate entries in localStorage
    const deduplicated = deduplicateBookings(all);
    if (deduplicated.length !== all.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
      } catch (e) {}
    }
    all = deduplicated;

    all.forEach((b) => {
      if (b.invoice && (!b.invoice.currency || b.invoice.currency === 'USD')) {
        b.invoice.currency = 'INR';
      }
      if (Array.isArray(b.documents)) {
        b.documents = b.documents.filter((doc) => !doc.id.startsWith('doc_cad_') && !doc.id.startsWith('doc_boq_'));
      } else {
        b.documents = [];
      }
      if (!b.marketType) {
        b.marketType = (b.shippingAddress?.country && b.shippingAddress.country.toLowerCase() === 'india') ? 'domestic' : 'export';
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
    let all: BookingRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(all)) all = [];
    all = deduplicateBookings(all);
    if (!booking.documents || !Array.isArray(booking.documents)) {
      booking.documents = [];
    } else {
      booking.documents = booking.documents.filter((doc) => !doc.id.startsWith('doc_cad_') && !doc.id.startsWith('doc_boq_'));
    }
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

export function addDocumentToBooking(
  bookingId: string,
  doc: {
    name: string;
    description: string;
    fileUrl: string;
    fileName?: string;
    fileType?: string;
    fileSize?: string;
    uploadedBy?: 'company' | 'client' | string;
  }
): BookingRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all: BookingRecord[] = JSON.parse(raw);
    const target = all.find((b) => b.id === bookingId);
    if (!target) return null;

    if (!Array.isArray(target.documents)) {
      target.documents = [];
    }

    const newDoc: BookingDocument = {
      id: 'doc_' + Date.now(),
      name: doc.name.trim(),
      description: doc.description.trim(),
      fileUrl: doc.fileUrl,
      fileName: doc.fileName || doc.name.trim(),
      fileType: doc.fileType || 'pdf',
      fileSize: doc.fileSize || '1.5 MB',
      uploadedBy: doc.uploadedBy || 'client',
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    target.documents.unshift(newDoc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Background sync to backend
    fetch(`/api/wp/customers/bookings/${bookingId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoc),
    }).catch(() => {});

    return target;
  } catch (e) {
    console.error('Error adding document to booking:', e);
    return null;
  }
}

export function appendMessageToBooking(
  bookingId: string,
  text: string,
  sender: 'client' | 'concierge' | 'team' = 'client',
  senderName: string = 'You (Client)'
): BookingRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all: BookingRecord[] = JSON.parse(raw);
    const target = all.find((b) => b.id === bookingId);
    if (!target) return null;

    if (!Array.isArray(target.messages)) {
      target.messages = [];
    }

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
  return [];
}
