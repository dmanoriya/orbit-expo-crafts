import { NextResponse } from 'next/server';

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://admin.orbitexpocrafts.com';

export async function GET() {
  try {
    const res = await fetch(`${WP_API_URL.replace(/\/$/, '')}/wp-json/hcc/v1/config`, {
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
