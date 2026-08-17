import { redirect } from 'next/navigation';

interface CategorySlugProps {
  params: Promise<{ slug: string }>;
}

export default async function CategorySlugRedirect({ params }: CategorySlugProps) {
  const { slug } = await params;
  redirect(`/catalogue/${slug}`);
}
