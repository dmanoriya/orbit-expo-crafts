import React from 'react';
import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';
import { CheckoutClientView } from './CheckoutClientView';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('checkout', {
    title: 'Commercial Order Booking | Orbit Expo Crafts',
    description: 'Book your bespoke commercial furniture order, reserve factory manufacturing schedule, and request formal proforma invoices.',
    canonical: 'https://orbitexpocrafts.com/checkout',
  });
}

export default function CheckoutPage() {
  return <CheckoutClientView />;
}
