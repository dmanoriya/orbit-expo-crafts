import { NextResponse } from 'next/server';

function getWpCandidateBases(): string[] {
  const custom = (process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || '').replace(/\/$/, '');
  const list: string[] = [];

  if (custom) list.push(custom);

  if (process.env.NODE_ENV === 'development') {
    if (!list.includes('http://woo-catalog-nextjs.local')) list.push('http://woo-catalog-nextjs.local');
    if (!list.includes('https://admin.orbitexpocrafts.com')) list.push('https://admin.orbitexpocrafts.com');
  } else {
    if (!list.includes('https://admin.orbitexpocrafts.com')) list.push('https://admin.orbitexpocrafts.com');
    if (!list.includes('http://woo-catalog-nextjs.local')) list.push('http://woo-catalog-nextjs.local');
  }

  return list;
}

export async function GET() {
  const candidates = getWpCandidateBases();

  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${base}/wp-json/hcc/v1/config`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
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
        }
      }
    } catch {
      // try next candidate
    }
  }

  return NextResponse.json({ success: false, data: null }, { status: 502 });
}
