import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('privacy-policy', {
    title: 'Privacy Policy | Orbit Expo Crafts',
    description: 'How Orbit Expo Crafts collects, uses, and protects personal data, project drawings, NDA specifications, and client account information.',
    canonical: 'https://orbitexpocrafts.com/privacy-policy',
  });
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
