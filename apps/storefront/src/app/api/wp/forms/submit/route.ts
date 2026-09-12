import { NextResponse } from 'next/server';

function getWpApiUrl(): string {
  let url = process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    url = process.env.NODE_ENV === 'development' ? 'http://woo-catalog-nextjs.local' : 'https://admin.orbitexpocrafts.com';
  }
  return url.replace(/\/$/, '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const wpBase = getWpApiUrl();

    // Primary: query parameter rest route
    let res = await fetch(`${wpBase}/index.php?rest_route=/hcc/v1/forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }).catch(() => null);

    // Fallback: pretty permalink rest route
    if (!res || !res.ok) {
      const fallbackRes = await fetch(`${wpBase}/wp-json/hcc/v1/forms/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }).catch(() => null);

      if (fallbackRes && fallbackRes.ok) {
        res = fallbackRes;
      }
    }

    if (!res) {
      return NextResponse.json(
        { success: false, error: 'Could not connect to WordPress backend.' },
        { status: 503 }
      );
    }

    const text = await res.text().catch(() => '');
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: res.ok, message: text || `HTTP ${res.status}` };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('API /forms/submit error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
