import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discuss Your Project — ORBIT Expo Crafts',
  description: 'Tell us about your project and furniture needs. We help turn your ideas and designs into custom furniture for your space.',
};

export default function DiscussProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
