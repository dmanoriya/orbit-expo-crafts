import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { clearWpDataCache } from '../../../lib/wpCommerce';

export async function POST(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    const authHeader = request.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.REVALIDATE_SECRET || 'orbit_expo_crafts_secret_key_2026';

    if (secret !== expectedSecret && authHeader !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid secret key' }, { status: 401 });
    }

    // Instantly wipe memory caches
    clearWpDataCache();

    const body = await request.json().catch(() => ({}));
    const tags: string[] = Array.isArray(body.tags) && body.tags.length > 0
      ? body.tags
      : ['wp-products', 'wp-categories', 'wp-attributes', 'wp-homepage', 'wp-config'];

    tags.forEach((tag) => {
      revalidateTag(tag);
    });

    revalidatePath('/', 'layout');
    revalidatePath('/shop', 'page');
    revalidatePath('/catalogue', 'page');

    console.log(`> Next.js Cache Revalidated Tags: ${tags.join(', ')}`);

    return NextResponse.json({
      revalidated: true,
      tags,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
