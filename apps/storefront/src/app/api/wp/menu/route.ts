import { NextResponse } from 'next/server';
import { fetchWpStorefrontData } from '../../../../lib/wpCommerce';

export const revalidate = 60;

export async function GET() {
  try {
    const data = await fetchWpStorefrontData();
    return NextResponse.json(
      {
        success: true,
        data: {
          categories: data.categories || [],
          categoryTree: data.categoryTree || [],
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, data: { categories: [], categoryTree: [] } });
  }
}
