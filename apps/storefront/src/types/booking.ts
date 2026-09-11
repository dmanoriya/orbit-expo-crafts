export interface BookingMessage {
  id: string;
  sender: 'client' | 'concierge';
  senderName: string;
  timestamp: string;
  text: string;
}

export interface BookingMilestone {
  key: string;
  label: string;
  date?: string;
  completed: boolean;
  active: boolean;
  note?: string;
}

export interface BookingItem {
  id: string;
  name: string;
  catName?: string;
  quantity: number;
  image?: string;
  material?: string;
  finish?: string;
  dimensions?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface BookingRecord {
  id: string; // e.g. "OEC-2026-8812"
  createdAt: string;
  projectName: string;
  clientName: string;
  companyName?: string;
  email: string;
  phone: string;
  gstOrTaxId?: string;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    siteAccessNotes?: string;
  };
  targetDeliveryDate?: string;
  specialNotes?: string;
  items: BookingItem[];
  totalPieces: number;
  estimatedCbm: string;
  status:
    | 'Booking Received'
    | 'Engineering & CAD Review'
    | 'Proforma Issued'
    | 'In Production'
    | 'Quality Control & Packing'
    | 'Dispatched'
    | 'Delivered';
  logistics: {
    carrier?: string;
    trackingNumber?: string;
    originPort?: string;
    destinationPort?: string;
    vesselName?: string;
    estimatedDelivery?: string;
    currentMilestoneNote?: string;
  };
  invoice: {
    invoiceNumber: string;
    issueDate: string;
    subtotal: number;
    packingAndCrating: number;
    estimatedFreight: number;
    totalAmount: number;
    currency: string;
    paymentTerms: string;
    bankDetails: {
      accountName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      swiftCode: string;
      branch: string;
    };
  };
  milestones: BookingMilestone[];
  messages: BookingMessage[];
}
