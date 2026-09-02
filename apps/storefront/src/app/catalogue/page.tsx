import { redirect } from 'next/navigation';

export default function LegacyCatalogueRedirect() {
  redirect('/collections');
}
