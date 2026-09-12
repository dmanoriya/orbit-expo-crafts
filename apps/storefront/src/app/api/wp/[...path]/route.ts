import { NextRequest, NextResponse } from 'next/server';

function getWpBaseUrl(): string {
  let url = process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (url) {
    return url.replace(/\/$/, '');
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

    const text = await res.text().catch(() => '');
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: res.ok, data: null };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message, offline: true }, { status: 503 });
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

    const text = await res.text().catch(() => '');
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: res.ok, message: text || `Status ${res.status}` };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message, offline: true },
      { status: 503 }
    );
  }
}
