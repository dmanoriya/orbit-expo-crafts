import { NextResponse } from 'next/server';

function getWpApiUrl(): string {
  let url = process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    url = process.env.NODE_ENV === 'development' ? 'http://woo-catalog-nextjs.local' : 'https://admin.orbitexpocrafts.com';
  }
  return url.replace(/\/$/, '');
}

export async function GET() {
  try {
    const wpBase = getWpApiUrl();
    const res = await fetch(`${wpBase}/wp-json/hcc/v1/homepage`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: null }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
