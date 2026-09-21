import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { clearWpDataCache } from '../../../lib/wpCommerce';

export async function POST(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    const authHeader = request.headers.get('x-revalidate-secret');
    const validSecrets = [
      process.env.REVALIDATE_SECRET,
      'orbit_expo_crafts_secret_key_2026',
      'orbit_headless_revalidate_2026',
    ].filter(Boolean);

    const isSecretValid = (secret && validSecrets.includes(secret)) || (authHeader && validSecrets.includes(authHeader));

    if (!isSecretValid) {
      return NextResponse.json({ message: 'Invalid secret key' }, { status: 401 });
    }

    // Instantly wipe memory caches
    clearWpDataCache();

    const body = await request.json().catch(() => ({}));
    const tagParam = request.nextUrl.searchParams.get('tag');
    const pathParam = request.nextUrl.searchParams.get('path');

    const defaultTags = ['wp-products', 'wp-categories', 'wp-attributes', 'wp-homepage', 'wp-config', 'business-pages', 'mega-menu'];
    const rawTags: string[] = Array.isArray(body.tags) && body.tags.length > 0
      ? body.tags
      : (tagParam ? [tagParam, 'business-pages', 'mega-menu'] : defaultTags);

    const tagsSet = new Set(rawTags);
    if (tagsSet.has('wp-categories') || tagsSet.has('wp-products')) {
      tagsSet.add('mega-menu');
    }
    const tags = Array.from(tagsSet);

    tags.forEach((tag) => {
      try {
        revalidateTag(tag);
      } catch (e) {
        // ignore in case of unconfigured tag
      }
    });

    if (pathParam) {
      try {
        revalidatePath(pathParam);
      } catch (e) {
        // ignore
      }
    }

    revalidatePath('/', 'layout');
    revalidatePath('/shop', 'page');
    revalidatePath('/catalogue', 'page');
    revalidatePath('/suppliers-vendors', 'page');
    revalidatePath('/interior-designers', 'page');
    revalidatePath('/influencers-marketing', 'page');
    revalidatePath('/furniture-decor-designers', 'page');

    console.log(`> Next.js Cache Revalidated Tags: ${tags.join(', ')}${pathParam ? ` | Path: ${pathParam}` : ''}`);

    return NextResponse.json({
      revalidated: true,
      tags,
      path: pathParam || null,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
