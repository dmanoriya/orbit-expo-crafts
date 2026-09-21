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
    const res = await fetch(`${wpBase}/wp-json/hcc/v1/config`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: null }, { status: res.status });
    }

    const data = await res.json();
    if (data?.data?.fonts) {
      if (!data.data.fonts.fontHeading || ['Fraunces', 'Gilda Display'].includes(data.data.fonts.fontHeading)) {
        data.data.fonts.fontHeading = 'EB Garamond';
      }
      if (!data.data.fonts.fontBody || ['Archivo', 'Sarabun', 'Plus Jakarta Sans'].includes(data.data.fonts.fontBody)) {
        data.data.fonts.fontBody = 'Inter';
      }
      if (!data.data.fonts.fontMenu || ['Archivo', 'Sarabun', 'Plus Jakarta Sans'].includes(data.data.fonts.fontMenu)) {
        data.data.fonts.fontMenu = 'Inter';
      }
      if (!data.data.fonts.fontButton || ['Archivo', 'Sarabun', 'Plus Jakarta Sans'].includes(data.data.fonts.fontButton)) {
        data.data.fonts.fontButton = 'Inter';
      }
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
