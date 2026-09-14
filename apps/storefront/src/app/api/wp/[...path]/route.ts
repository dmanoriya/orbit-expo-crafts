import { NextRequest, NextResponse } from 'next/server';
import productsSnapshot from '../../../../data/products-snapshot.json';
import categoriesSnapshot from '../../../../data/categories-snapshot.json';
import attributesSnapshot from '../../../../data/attributes-snapshot.json';

function getWpCandidateBases(): string[] {
  const custom = (process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || '').replace(/\/$/, '');
  const list: string[] = [];

  if (custom) list.push(custom);

  if (process.env.NODE_ENV === 'development') {
    if (!list.includes('http://woo-catalog-nextjs.local')) list.push('http://woo-catalog-nextjs.local');
    if (!list.includes('https://admin.orbitexpocrafts.com')) list.push('https://admin.orbitexpocrafts.com');
  } else {
    if (!list.includes('https://admin.orbitexpocrafts.com')) list.push('https://admin.orbitexpocrafts.com');
  }

  return list;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const candidates = getWpCandidateBases();

  for (const base of candidates) {
    try {
      const targetUrl = `${base}/wp-json/hcc/v1/${subPath}${searchParams ? `?${searchParams}` : ''}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(targetUrl, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text().catch(() => '');
        try {
          const data = JSON.parse(text);
          if (data && data.success !== false) {
            return NextResponse.json(data, { status: 200 });
          }
        } catch {
          // JSON parse failed, try next candidate
        }
      }
    } catch {
      // Network failure / EPERM / DNS error -> try next candidate
    }
  }

  // If all live/local candidates fail, provide bundled catalog snapshots for core catalog queries
  if (subPath === 'products') {
    return NextResponse.json({ success: true, data: productsSnapshot }, { status: 200 });
  }
  if (subPath.startsWith('products/slug/')) {
    const rawSlug = decodeURIComponent(subPath.replace('products/slug/', '')).toLowerCase().trim();
    const list: any[] = Array.isArray((productsSnapshot as any)?.products) ? (productsSnapshot as any).products : [];
    const match = list.find((p: any) =>
      (p.slug && p.slug.toLowerCase() === rawSlug) ||
      (p.sku && p.sku.toLowerCase() === rawSlug) ||
      (p.id && String(p.id).toLowerCase() === rawSlug) ||
      (`orb-${p.id}`.toLowerCase() === rawSlug) ||
      (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === rawSlug)
    );
    if (match) {
      return NextResponse.json({ success: true, data: match, offline: true }, { status: 200 });
    }
  }
  if (subPath === 'categories') {
    return NextResponse.json({ success: true, data: categoriesSnapshot }, { status: 200 });
  }
  if (subPath === 'attributes') {
    return NextResponse.json({ success: true, data: attributesSnapshot }, { status: 200 });
  }
  if (subPath === 'homepage') {
    return NextResponse.json({ success: true, data: {}, offline: true }, { status: 200 });
  }
  if (subPath === 'posts') {
    return NextResponse.json({ success: true, data: { posts: [] }, offline: true }, { status: 200 });
  }

  return NextResponse.json(
    { success: false, error: 'All WordPress backends unreachable', offline: true },
    { status: 503 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const subPath = resolvedParams.path.join('/');
  const body = await request.json().catch(() => ({}));
  const candidates = getWpCandidateBases();

  for (const base of candidates) {
    try {
      const targetUrl = `${base}/wp-json/hcc/v1/${subPath}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const text = await res.text().catch(() => '');
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: res.ok, message: text || `Status ${res.status}` };
      }

      if (res.ok) {
        return NextResponse.json(data, { status: res.status });
      }
    } catch {
      // Try next candidate
    }
  }

  return NextResponse.json(
    { success: false, error: 'Unable to connect to submission service', offline: true },
    { status: 503 }
  );
}
