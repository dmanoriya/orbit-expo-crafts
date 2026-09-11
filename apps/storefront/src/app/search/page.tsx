import { redirect } from 'next/navigation';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; search?: string }>;
}) {
  const resolved = await searchParams;
  const q = (resolved?.q || resolved?.search || '').trim();

  if (q) {
    redirect(`/collections?search=${encodeURIComponent(q)}`);
  }

  redirect('/collections');
}
