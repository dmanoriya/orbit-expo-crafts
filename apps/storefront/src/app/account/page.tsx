import React from 'react';
import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';
import { AccountClientView } from './AccountClientView';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('my-account', {
    title: 'Trade & Client Account Portal | Orbit Expo Crafts',
    description: 'Manage your commercial architectural specifications, saved favorites, RFQ enquiries, and trade account profile.',
    canonical: 'https://orbitexpocrafts.com/account',
  });
}

export default function AccountPage() {
  return <AccountClientView />;
}
