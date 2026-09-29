import type { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('contact', {
    title: 'Contact Us | Orbit Expo Crafts — Factory Inquiries & Studio Consultations',
    description: 'Get in touch with Orbit Expo Crafts production facilities in Udaipur and Jodhpur. Inquire about custom architectural joinery, hotel fit-outs, or visit our workshops.',
    canonical: 'https://orbitexpocrafts.com/contact',
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
