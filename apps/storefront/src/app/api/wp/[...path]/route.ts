import { NextRequest, NextResponse } from 'next/server';

function getWpBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_WORDPRESS_URL) {
    return process.env.NEXT_PUBLIC_WORDPRESS_URL.replace(/\/$/, '');
  }
  if (process.env.WORDPRESS_URL) {
    return process.env.WORDPRESS_URL.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://woo-catalog-nextjs.local';
  }
  return 'https://admin.orbitexpocrafts.com';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const subPath = resolvedParams.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const wpBase = getWpBaseUrl();

    const targetUrl = `${wpBase}/wp-json/hcc/v1/${subPath}${searchParams ? `?${searchParams}` : ''}`;

    const res = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
      },
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const subPath = resolvedParams.path.join('/');
    const body = await request.json().catch(() => ({}));
    const wpBase = getWpBaseUrl();

    const targetUrl = `${wpBase}/wp-json/hcc/v1/${subPath}`;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
