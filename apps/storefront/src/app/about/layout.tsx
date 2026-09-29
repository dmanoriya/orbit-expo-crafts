import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('about', {
    title: 'About Us | Orbit Expo Crafts — Rajasthan Contract Furniture & Architectural Joinery',
    description: 'Founded in Rajasthan, Orbit Expo Crafts bridges heritage artisanal craft with industrial contract precision for luxury hotels, resorts, and design studios worldwide.',
    canonical: 'https://orbitexpocrafts.com/about',
  });
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
