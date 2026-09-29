import { Metadata } from 'next';
import { fetchWpPageMetadata } from '../../lib/wpCommerce';

export async function generateMetadata(): Promise<Metadata> {
  return fetchWpPageMetadata('discuss-projects', {
    title: 'Discuss Your Project | Orbit Expo Crafts — Custom Hospitality & Contract Manufacturing',
    description: 'Submit your drawings, BOQs, or project briefs. Our engineering and estimation team reviews hospitality, commercial, and residential contract specifications within 24 hours.',
    canonical: 'https://orbitexpocrafts.com/discuss-projects',
  });
}

export default function DiscussProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
