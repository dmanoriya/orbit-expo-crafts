import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('turnkey', {
    title: 'Turnkey Hospitality & Commercial Fit-Outs | Orbit Expo Crafts',
    description: 'End-to-end contract manufacturing and site fit-out solutions for hotels, luxury resorts, restaurants, and corporate environments from concept to on-site handover.',
    canonical: 'https://orbitexpocrafts.com/turnkey',
  });
}

export default function TurnkeyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
