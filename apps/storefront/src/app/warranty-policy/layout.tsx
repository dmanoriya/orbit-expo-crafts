import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('warranty-policy', {
    title: 'Structural & Finish Warranty Policy | Orbit Expo Crafts',
    description: 'Comprehensive warranty coverage for contract furniture, commercial joinery, hardware mechanisms, and moisture-controlled solid timber against manufacturing defects.',
    canonical: 'https://orbitexpocrafts.com/warranty-policy',
  });
}

export default function WarrantyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
