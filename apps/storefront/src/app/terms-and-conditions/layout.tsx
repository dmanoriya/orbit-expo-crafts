import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('terms-and-conditions', {
    title: 'Terms & Conditions of Commercial Supply | Orbit Expo Crafts',
    description: 'Terms of engagement, order confirmations, commercial payment schedules, design ownership, production timelines, and cancellation guidelines for contract clients.',
    canonical: 'https://orbitexpocrafts.com/terms-and-conditions',
  });
}

export default function TermsAndConditionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
