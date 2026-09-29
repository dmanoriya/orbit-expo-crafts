import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('shipping-policy', {
    title: 'Shipping & Global Export Logistics Policy | Orbit Expo Crafts',
    description: 'Detailed information on our international freight handling, export packaging standards, ISPM-15 heat-treated wood crating, customs documentation, and domestic delivery.',
    canonical: 'https://orbitexpocrafts.com/shipping-policy',
  });
}

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
