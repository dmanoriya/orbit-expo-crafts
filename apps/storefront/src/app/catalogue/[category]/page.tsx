import { redirect } from 'next/navigation';

interface LegacyCategoryProps {
  params: Promise<{ category: string }>;
}

export default async function LegacyCategoryRedirect({ params }: LegacyCategoryProps) {
  const resolvedParams = await params;
  redirect(`/collections/${resolvedParams.category}`);
}
