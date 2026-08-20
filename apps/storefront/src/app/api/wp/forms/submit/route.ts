import { NextResponse } from 'next/server';

const WP_API_URL = (process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://admin.orbitexpocrafts.com').replace(/\/$/, '');

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${WP_API_URL}/index.php?rest_route=/hcc/v1/forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API /forms/submit error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
